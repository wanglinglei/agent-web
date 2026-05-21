<script setup lang="ts">
import type { AgentsChatMessage } from '../../../types/agents';

defineProps<{
  message: AgentsChatMessage;
  onCopySvg?: (message: AgentsChatMessage) => void;
  onDownloadSvg?: (message: AgentsChatMessage) => void;
}>();
</script>

<template>
  <template v-if="message.role === 'assistant' && message.renderMeta?.renderType === 'svg'">
    <div v-if="message.renderMeta.svgText" class="svg-preview-card">
      <div class="svg-preview svg-preview-wrapper" v-html="message.renderMeta.svgText" />
    </div>
    <div class="bubble-actions">
      <button type="button" class="inline-action" @click="onCopySvg?.(message)">复制 SVG</button>
      <button type="button" class="inline-action" @click="onDownloadSvg?.(message)">
        下载 SVG
      </button>
    </div>
  </template>

</template>

<style scoped>
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
</style>
