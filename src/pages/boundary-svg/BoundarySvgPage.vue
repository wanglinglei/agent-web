<script setup lang="ts">
import { computed } from 'vue';
import { useAgentChat } from '../../composables/useAgentChat';
import { boundarySvgConfig } from './boundary-svg.config';
import LayoutSidebar from '../../components/LayoutSidebar.vue';
import PageHeader from '../../components/PageHeader.vue';
import HistorySessions from '../../components/HistorySessions.vue';
import ChatInput from '../../components/ChatInput.vue';

const config = boundarySvgConfig;
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
          @suggest="chat.submitSuggestedQuestion"
          @reset="chat.startNewConversation"
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
  </main>
</template>

<style scoped>
.agent-page {
  background: var(--agent-page-bg);
  height: 100vh;
  overflow: hidden;
  position: relative;
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
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.workbench-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 280px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
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
