<script setup lang="ts">
import DOMPurify from 'dompurify';
import markdownit from 'markdown-it';
import { computed } from 'vue';
import { useAgentChat } from '../../composables/useAgentChat';
import { emailConfig } from './email.config';
import type { AgentsChatMessage } from '../../types/agents';
import LayoutSidebar from '../../components/LayoutSidebar.vue';
import PageHeader from '../../components/PageHeader.vue';
import HistorySessions from '../../components/HistorySessions.vue';
import HistoryMessageExtras from './components/HistoryMessageExtras.vue';
import ChatInput from '../../components/ChatInput.vue';

const config = emailConfig;
const chat = useAgentChat(config);
const markdownRenderer = markdownit({
  breaks: true,
  html: true,
  linkify: true,
});

/**
 * 将邮件预览文本渲染为安全的 Markdown HTML。
 *
 * @param content 原始邮件正文文本。
 * @returns 可直接用于 v-html 的安全字符串。
 */
function renderEmailPreviewMarkdown(content: string): string {
  return DOMPurify.sanitize(markdownRenderer.render(content), {
    USE_PROFILES: { html: true },
  });
}

/**
 * 计算聊天区域中每条消息的基础展示文本。
 *
 * @param {AgentsChatMessage} message 聊天消息。
 * @returns {string}
 */
function resolveHistoryMessageContent(message: AgentsChatMessage): string {
  return message.content || '正在执行任务...';
}

/**
 * 判断当前消息是否使用 Markdown 容器渲染。
 *
 * @param {AgentsChatMessage} message 聊天消息。
 * @returns {boolean}
 */
function shouldRenderHistoryMarkdownMessage(message: AgentsChatMessage): boolean {
  if (message.role !== 'assistant') {
    return false;
  }

  if (message.status === 'error') {
    return false;
  }

  return message.renderMeta?.renderType !== 'email';
}

const themeStyle = computed<Record<string, string>>(() => ({
  '--agent-page-bg': config.theme.pageBackground,
  '--agent-hero-bg': config.theme.heroBackground,
  '--agent-accent': config.theme.accent,
  '--agent-accent-soft': config.theme.accentSoft,
  '--agent-accent-strong': config.theme.accentStrong,
  '--agent-panel-bg': config.theme.panelBackground,
  '--agent-surface': config.theme.surface,
}));

const renderedEmailPreview = computed<string>(() =>
  renderEmailPreviewMarkdown(chat.emailPreviewContent.value),
);
</script>

<template>
  <main class="agent-page" :style="themeStyle">
    <div class="agent-backdrop agent-backdrop-left" />
    <div class="agent-backdrop agent-backdrop-right" />

    <section class="agent-layout">
      <PageHeader :config="config" />

      <div class="workbench-grid">
        <LayoutSidebar
          :config="config"
          :isSending="chat.isSending.value"
          :conversationId="chat.conversationId.value"
          :hasMore="chat.hasMoreHistory.value"
          :historyConversations="chat.historyConversations.value"
          :isLoadingHistory="chat.isLoadingHistory.value"
          @reset="chat.startNewConversation"
          @load-conversation="chat.loadConversation"
          @rename-conversation="({ id, title }) => chat.renameConversation(id, title)"
          @delete-conversation="chat.removeConversation"
          @load-more="chat.loadHistoryList(true)"
        />

        <section class="chat-shell">
          <HistorySessions
            :config="config"
            :messages="chat.messages.value"
            :resolve-message-content="resolveHistoryMessageContent"
            :should-render-markdown-message="shouldRenderHistoryMarkdownMessage"
            @suggest="chat.submitSuggestedQuestion"
          >
            <template #message-extra="{ message }">
              <HistoryMessageExtras
                :message="message"
                :on-open-email="chat.openEmailPreview"
              />
            </template>
          </HistorySessions>

          <ChatInput
            v-model="chat.inputValue.value"
            :config="config"
            :isSending="chat.isSending.value"
            :errorMessage="chat.errorMessage.value"
            @cancel="chat.cancelActiveRequest"
            @submit="chat.handleSubmit"
          />
        </section>
      </div>
    </section>

    <!-- Email Preview Drawer -->
    <div
      v-if="chat.emailPreviewVisible.value"
      class="drawer-mask"
      @click.self="chat.closeEmailPreview"
    >
      <aside class="drawer-panel">
        <header class="drawer-header">
          <div>
            <p class="drawer-label">邮件预览</p>
            <p class="drawer-subject">{{ chat.emailPreviewSubject.value }}</p>
          </div>
          <button
            type="button"
            class="drawer-close"
            @click="chat.closeEmailPreview"
          >
            关闭
          </button>
        </header>

        <div class="drawer-body">
          <article class="drawer-content markdown-body" v-html="renderedEmailPreview" />
        </div>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.agent-page {
  background: var(--agent-page-bg);
  height: 100vh;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

.agent-backdrop {
  border-radius: 999px;
  filter: blur(18px);
  opacity: 0.9;
  position: absolute;
  pointer-events: none;
}

.agent-backdrop-left {
  background: color-mix(in srgb, var(--agent-accent) 22%, transparent);
  height: 18rem;
  left: -5rem;
  top: 3rem;
  width: 18rem;
}

.agent-backdrop-right {
  background: color-mix(in srgb, var(--agent-accent-soft) 72%, white 28%);
  height: 20rem;
  right: -5rem;
  top: 8rem;
  width: 20rem;
}

.agent-layout {
  margin: 0 auto;
  max-width: 1380px;
  padding: 1.5rem 1rem 2rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.workbench-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 280px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  height: 100%;
}

.chat-shell {
  background: color-mix(in srgb, var(--agent-surface) 90%, white 10%);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 1.8rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.11);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  min-height: 0;
}

.drawer-mask {
  background: rgba(15, 23, 42, 0.42);
  inset: 0;
  position: fixed;
  z-index: 50;
}

.drawer-panel {
  background: white;
  box-shadow: -18px 0 48px rgba(15, 23, 42, 0.2);
  height: 100%;
  margin-left: auto;
  width: min(92vw, 580px);
}

.drawer-header {
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.2rem;
}

.drawer-label {
  color: #64748b;
  font-size: 0.78rem;
  margin: 0;
}

.drawer-subject {
  color: #1e293b;
  font-weight: 700;
  margin: 0.4rem 0 0;
}

.drawer-close {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  color: #475569;
  padding: 0.5rem 0.8rem;
}

.drawer-body {
  height: calc(100% - 72px);
  overflow: auto;
  padding: 1.2rem;
}

.drawer-content {
  line-height: 1.8;
  margin: 0;
  word-break: break-word;
}

.markdown-body :deep(p) {
  margin: 0 0 0.75rem;
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
  background: #f8fafc;
  border-radius: 0.4rem;
}

.markdown-body :deep(pre) {
  overflow-x: auto;
  padding: 0.8rem;
}

.markdown-body :deep(code) {
  padding: 0.1rem 0.35rem;
}

@media (max-width: 1080px) {
  .workbench-grid {
    grid-template-columns: 1fr;
  }
  .chat-shell {
    order: 1;
  }
}

@media (max-width: 760px) {
  .agent-layout {
    padding: 1rem 0.75rem;
  }
}
</style>
