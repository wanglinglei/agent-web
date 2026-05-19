<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { AgentsChatMessage } from '../types/agents';

const props = defineProps<{
  messages: AgentsChatMessage[];
  config: any;
}>();

const emit = defineEmits<{
  (e: 'copy-svg', message: AgentsChatMessage): void;
  (e: 'download-svg', message: AgentsChatMessage): void;
  (e: 'open-email', message: AgentsChatMessage): void;
  (e: 'suggest', question: string): void;
}>();

const containerRef = ref<HTMLElement>();

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

watch(
  () => props.messages,
  async () => {
    await nextTick();
    if (containerRef.value) {
      containerRef.value.scrollTo({
        top: containerRef.value.scrollHeight,
        behavior: 'smooth',
      });
    }
  },
  { deep: true }
);
</script>

<template>
  <div ref="containerRef" class="messages-panel">
    <!-- 欢迎提示页 (空状态) -->
    <div v-if="messages.length === 0" class="welcome-screen">
      <h2 class="welcome-title">有什么我能帮你的吗？</h2>
      <div class="welcome-suggestions">
        <button
          v-for="question in config.suggestedQuestions"
          :key="question"
          class="welcome-suggestion-btn"
          @click="$emit('suggest', question)"
        >
          {{ question }}
        </button>
      </div>
    </div>

    <!-- 历史会话列表 -->
    <div v-else class="message-stack">
      <article
        v-for="message in messages"
        :key="message.id"
        class="message-row"
        :class="message.role === 'user' ? 'message-row-user' : 'message-row-assistant'"
      >
        <div
          class="message-bubble"
          :class="[
            message.role === 'user'
              ? 'message-bubble-user'
              : message.status === 'error'
                ? 'message-bubble-error'
                : 'message-bubble-assistant',
          ]"
        >
          <div class="message-meta">
            <span>{{ message.role === 'user' ? '你' : config.badge }}</span>
            <span>{{ formatTime(message.createdAt) }}</span>
            <span v-if="message.status === 'streaming'">正在处理...</span>
          </div>

          <p
            v-if="message.role === 'user' || message.renderMeta?.renderType !== 'svg'"
            class="message-text"
          >
            {{ message.content || '正在执行任务...' }}
          </p>

          <template
            v-if="message.role === 'assistant' && message.renderMeta?.renderType === 'svg'"
          >
            <p class="message-text">
              {{ message.renderMeta.svgSummary || '已生成 SVG 预览。' }}
            </p>
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
  flex: 1;
  overflow-y: auto;
  padding: 1.35rem;
}

.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #172033;
  margin-bottom: 2rem;
}

.welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  max-width: 800px;
}

.welcome-suggestion-btn {
  background: #f8fafc;
  border: 1px solid transparent;
  border-radius: 999px;
  color: #475569;
  font-size: 0.85rem;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.welcome-suggestion-btn:hover {
  background: white;
  border-color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  color: #172033;
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

.message-bubble {
  border-radius: 1.6rem;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  max-width: 84%;
  padding: 1rem 1.1rem;
}

.message-bubble-user {
  background: var(--agent-accent);
  border-bottom-right-radius: 0.5rem;
  color: white;
}

.message-bubble-assistant {
  background: #f8fafc;
  border-bottom-left-radius: 0.5rem;
  color: #1e293b;
}

.message-bubble-error {
  background: #fef2f2;
  border-bottom-left-radius: 0.5rem;
  color: #b91c1c;
}

.message-meta {
  display: flex;
  font-size: 0.75rem;
  gap: 0.55rem;
  opacity: 0.72;
}

.message-text {
  line-height: 1.85;
  margin: 0.65rem 0 0;
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
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  color: #334155;
  padding: 0.45rem 0.8rem;
  cursor: pointer;
}

.inline-action:hover {
  background: #f8fafc;
}

.svg-preview-wrapper {
  align-items: center;
  aspect-ratio: 1 / 1;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  max-width: min(100%, 560px);
  overflow: hidden;
  width: 100%;
}

.svg-preview :deep(svg) {
  display: block;
  height: 100%;
  margin: 0 auto;
  max-height: 100%;
  max-width: 100%;
  width: 100%;
}

@media (max-width: 760px) {
  .messages-panel {
    padding: 1rem;
  }

  .message-bubble {
    max-width: 100%;
  }
}
</style>
