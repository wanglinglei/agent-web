<script setup lang="ts">
import type { AgentsChatMessage } from '../../../types/agents';

defineProps<{
  message: AgentsChatMessage;
  onOpenEmail?: (message: AgentsChatMessage) => void;
}>();
</script>

<template>
  <template v-if="message.role === 'assistant' && message.renderMeta?.renderType === 'email'">
    <div class="bubble-actions bubble-actions-right">
      <button type="button" class="inline-action" @click="onOpenEmail?.(message)">预览正文</button>
    </div>
  </template>
</template>

<style scoped>
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
</style>
