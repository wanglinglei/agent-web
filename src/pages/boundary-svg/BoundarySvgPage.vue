<script setup lang="ts">
import { computed } from 'vue';
import { useAgentChat } from '../../composables/useAgentChat';
import { boundarySvgConfig } from './boundary-svg.config';
import type { AgentsChatMessage } from '../../types/agents';
import LayoutSidebar from '../../components/LayoutSidebar.vue';
import PageHeader from '../../components/PageHeader.vue';
import HistorySessions from '../../components/HistorySessions.vue';
import ChatInput from '../../components/ChatInput.vue';

const config = boundarySvgConfig;
const chat = useAgentChat(config);

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

  return message.status !== 'error';
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
          />

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
