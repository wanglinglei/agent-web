<script setup lang="ts">
const props = defineProps<{
  config: any;
  isSending: boolean;
  conversationId?: string;
}>();

const emit = defineEmits<{
  (e: 'suggest', question: string): void;
  (e: 'reset'): void;
}>();
</script>

<template>
  <aside class="sidebar-panel">
    <section class="info-card helper-card">
      <button
        type="button"
        class="reset-button"
        @click="emit('reset')"
      >
        新建会话
      </button>
    </section>
  </aside>
</template>

<style scoped>
.sidebar-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-card {
  background: color-mix(in srgb, var(--agent-panel-bg) 78%, white 22%);
  border: 1px solid color-mix(in srgb, var(--agent-accent) 14%, white 86%);
  border-radius: 1.2rem;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  padding: 1rem;
}

.helper-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.7)),
    var(--agent-panel-bg);
}

.reset-button {
  background: var(--agent-accent);
  border: 0;
  border-radius: 999px;
  color: white;
  font-weight: 700;
  padding: 0.85rem 1rem;
  width: 100%;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reset-button:hover {
  opacity: 0.9;
}
</style>
