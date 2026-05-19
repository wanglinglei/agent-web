<script setup lang="ts">
import { computed } from 'vue';
import { useAgentChat } from '../../composables/useAgentChat';
import { emailConfig } from './email.config';
import LayoutSidebar from '../../components/LayoutSidebar.vue';
import PageHeader from '../../components/PageHeader.vue';
import HistorySessions from '../../components/HistorySessions.vue';
import ChatInput from '../../components/ChatInput.vue';

const config = emailConfig;
const chat = useAgentChat(config);

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
          :historyConversations="chat.historyConversations.value"
          @suggest="chat.submitSuggestedQuestion"
          @reset="chat.startNewConversation"
          @load-conversation="chat.loadConversation"
          @load-more="chat.loadHistoryList(true)"
        />

        <section class="chat-shell">
          <HistorySessions
            :config="config"
            :messages="chat.messages.value"
            @copy-svg="chat.copySvgContent"
            @download-svg="chat.downloadSvgContent"
            @open-email="chat.openEmailPreview"
            @suggest="chat.submitSuggestedQuestion"
          />

          <ChatInput
            v-model="chat.inputValue.value"
            :config="config"
            :isSending="chat.isSending.value"
            :errorMessage="chat.errorMessage.value"
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
          <pre class="drawer-content">{{ chat.emailPreviewContent.value }}</pre>
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
  font-family: inherit;
  line-height: 1.8;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
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
