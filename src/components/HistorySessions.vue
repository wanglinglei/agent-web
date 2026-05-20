<script setup lang="ts">
import DOMPurify from 'dompurify';
import markdownit from 'markdown-it';
import { nextTick, ref, watch } from 'vue';
import { Bubble } from 'ant-design-x-vue';
import type { AgentWorkbenchConfig } from '../config/types';
import type { AgentsChatMessage } from '../types/agents';

const props = defineProps<{
  config: AgentWorkbenchConfig;
  messages: AgentsChatMessage[];
}>();

const emit = defineEmits<{
  (e: 'copy-svg', message: AgentsChatMessage): void;
  (e: 'download-svg', message: AgentsChatMessage): void;
  (e: 'open-email', message: AgentsChatMessage): void;
  (e: 'suggest', question: string): void;
}>();

const containerRef = ref<HTMLElement>();
const markdownRenderer = markdownit({
  breaks: true,
  html: true,
  linkify: true,
});

/**
 * 将时间戳格式化为中文时分格式。
 *
 * @param {number} timestamp 消息创建时间戳
 * @returns {string}
 */
function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

/**
 * 计算 Bubble 布局位置。
 *
 * @param {AgentsChatMessage} message 聊天消息
 * @returns {'start' | 'end'}
 */
function resolvePlacement(message: AgentsChatMessage): 'start' | 'end' {
  return message.role === 'user' ? 'end' : 'start';
}

/**
 * 计算 Bubble 文本内容。
 *
 * @param {AgentsChatMessage} message 聊天消息
 * @returns {string}
 */
function resolveBubbleContent(message: AgentsChatMessage): string {
  if (message.role === 'assistant' && message.renderMeta?.renderType === 'svg') {
    return message.renderMeta.svgSummary || '已生成 SVG 预览。';
  }

  return message.content || '正在执行任务...';
}

/**
 * 判断当前消息是否以 Markdown 方式渲染。
 *
 * @param {AgentsChatMessage} message 聊天消息
 * @returns {boolean}
 */
function shouldRenderMarkdownMessage(message: AgentsChatMessage): boolean {
  if (message.role !== 'assistant') {
    return false;
  }

  if (message.status === 'streaming' || message.status === 'error') {
    return false;
  }

  return message.renderMeta?.renderType !== 'svg';
}

/**
 * 将消息文本渲染为安全 Markdown HTML。
 *
 * @param {string} content 消息原文
 * @returns {string}
 */
function renderMessageMarkdown(content: string): string {
  return DOMPurify.sanitize(markdownRenderer.render(content), {
    USE_PROFILES: { html: true },
  });
}

/**
 * 是否展示 Bubble 的加载状态。
 *
 * @param {AgentsChatMessage} message 聊天消息
 * @returns {boolean}
 */
function isBubbleLoading(message: AgentsChatMessage): boolean {
  return message.role === 'assistant' && message.status === 'streaming';
}

watch(
  () => props.messages,
  async () => {
    await nextTick();
    containerRef.value?.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: 'smooth',
    });
  },
  { deep: true },
);
</script>

<template>
  <div ref="containerRef" class="messages-panel">
    <div v-if="messages.length === 0" class="welcome-screen">
      <p class="welcome-kicker">{{ config.badge }}</p>
      <h2 class="welcome-title">{{ config.assistantGreeting }}</h2>
      <p class="welcome-description">{{ config.helperBody }}</p>
      <div class="welcome-suggestions">
        <button
          v-for="question in config.suggestedQuestions"
          :key="question"
          class="welcome-suggestion-btn"
          @click="emit('suggest', question)"
        >
          {{ question }}
        </button>
      </div>
    </div>

    <div v-else class="message-stack">
      <article
        v-for="message in messages"
        :key="message.id"
        class="message-row"
        :class="message.role === 'user' ? 'message-row-user' : 'message-row-assistant'"
      >
        <div class="message-item">
          <div class="message-meta">
            <span>{{ message.role === 'user' ? '你' : config.badge }}</span>
            <span>{{ formatTime(message.createdAt) }}</span>
            <span v-if="message.status === 'streaming'">正在处理...</span>
          </div>

          <template v-if="shouldRenderMarkdownMessage(message)">
            <div class="markdown-message bubble-content-assistant">
              <article
                class="markdown-body"
                v-html="renderMessageMarkdown(resolveBubbleContent(message))"
              />
            </div>
          </template>
          <template v-else>
            <Bubble
              class="message-bubble"
              :content="resolveBubbleContent(message)"
              :placement="resolvePlacement(message)"
              :loading="isBubbleLoading(message)"
              :typing="message.role === 'assistant' && message.status === 'streaming'"
              :variant="'filled'"
              :avatar="{}"
              :class-names="{
                content:
                  message.role === 'user'
                    ? 'bubble-content-user'
                    : message.status === 'error'
                      ? 'bubble-content-error'
                      : 'bubble-content-assistant',
              }"
            />
          </template>

          <template
            v-if="message.role === 'assistant' && message.renderMeta?.renderType === 'svg'"
          >
            <div v-if="message.renderMeta.svgText" class="svg-preview-card">
              <div
                class="svg-preview svg-preview-wrapper"
                v-html="message.renderMeta.svgText"
              />
            </div>
            <div class="bubble-actions">
              <button
                type="button"
                class="inline-action"
                @click="emit('copy-svg', message)"
              >
                复制 SVG
              </button>
              <button
                type="button"
                class="inline-action"
                @click="emit('download-svg', message)"
              >
                下载 SVG
              </button>
            </div>
          </template>

          <template
            v-if="message.role === 'assistant' && message.renderMeta?.renderType === 'email'"
          >
            <div class="bubble-actions bubble-actions-right">
              <button
                type="button"
                class="inline-action"
                @click="emit('open-email', message)"
              >
                预览正文
              </button>
            </div>
          </template>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.messages-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 1.35rem;
}

.welcome-screen {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto;
  max-width: 860px;
  padding: 2rem;
  text-align: center;
}

.welcome-kicker {
  color: var(--agent-accent);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.welcome-title {
  color: #172033;
  font-size: clamp(1.75rem, 3vw, 2.4rem);
  font-weight: 700;
  line-height: 1.3;
  margin: 0.9rem 0 0;
}

.welcome-description {
  color: #475569;
  line-height: 1.8;
  margin: 0.85rem 0 0;
  max-width: 48rem;
}

.welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: center;
  margin-top: 1.6rem;
}

.welcome-suggestion-btn {
  background: white;
  border: 1px solid #dbe4f0;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  color: #334155;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 0.7rem 1rem;
  text-align: left;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.welcome-suggestion-btn:hover {
  border-color: color-mix(in srgb, var(--agent-accent) 28%, white 72%);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.message-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-row {
  display: flex;
}

.message-row-user {
  justify-content: flex-end;
}

.message-row-assistant {
  justify-content: flex-start;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-width: min(84%, 52rem);
}

.message-bubble {
  max-width: 100%;
}

.message-bubble :deep(.bubble-content-user) {
  background: var(--agent-accent);
  border-radius: 1.15rem;
  border-bottom-right-radius: 0.4rem;
  color: white;
  white-space: pre-wrap;
}

.message-bubble :deep(.bubble-content-assistant) {
  background: #f8fafc;
  border-radius: 1.15rem;
  border-bottom-left-radius: 0.4rem;
  color: #1e293b;
  white-space: pre-wrap;
}

.message-bubble :deep(.bubble-content-error) {
  background: #fef2f2;
  border-radius: 1.15rem;
  border-bottom-left-radius: 0.4rem;
  color: #b91c1c;
  white-space: pre-wrap;
}

.markdown-message {
  background: #f8fafc;
  border-bottom-left-radius: 0.4rem;
  border-radius: 1.15rem;
  color: #1e293b;
  padding: 0.75rem 0.95rem;
  word-break: break-word;
}

.markdown-body :deep(p) {
  margin: 0 0 0.75rem;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid #cbd5e1;
  color: #475569;
  margin: 0 0 0.9rem;
  padding: 0.2rem 0 0.2rem 0.8rem;
}

.markdown-body :deep(a) {
  color: #0f766e;
  text-decoration: underline;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0 0 0.9rem 1.25rem;
  padding: 0;
}

.markdown-body :deep(pre),
.markdown-body :deep(code) {
  background: #f1f5f9;
  border-radius: 0.4rem;
}

.markdown-body :deep(pre) {
  overflow-x: auto;
  padding: 0.8rem;
}

.markdown-body :deep(code) {
  padding: 0.1rem 0.35rem;
}

.message-meta {
  display: flex;
  font-size: 0.75rem;
  gap: 0.55rem;
  opacity: 0.72;
}

.message-text {
  line-height: 1.85;
  margin: 0.1rem 0 0;
  white-space: pre-wrap;
}

.svg-preview-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  margin-top: 0.8rem;
  overflow: hidden;
  padding: 0.8rem;
}

.svg-preview {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 12rem;
}

.svg-preview-wrapper :deep(svg) {
  height: auto;
  max-height: 20rem;
  max-width: 100%;
}

.bubble-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.8rem;
}

.bubble-actions-right {
  justify-content: flex-end;
}

.inline-action {
  background: white;
  border: 1px solid #dbe4f0;
  border-radius: 999px;
  color: #334155;
  cursor: pointer;
  padding: 0.48rem 0.85rem;
  transition: border-color 160ms ease;
}

.inline-action:hover {
  border-color: color-mix(in srgb, var(--agent-accent) 30%, white 70%);
}

@media (max-width: 760px) {
  .messages-panel {
    padding: 1rem;
  }

  .message-item {
    max-width: 100%;
  }

  .welcome-screen {
    padding: 1rem 0.25rem;
  }
}
</style>
