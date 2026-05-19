<script setup lang="ts">
const props = defineProps<{
  config: any;
  isSending: boolean;
  conversationId?: string;
  historyConversations?: any[];
}>();

const emit = defineEmits<{
  (e: 'suggest', question: string): void;
  (e: 'reset'): void;
  (e: 'load-conversation', id: string): void;
  (e: 'load-more'): void;
}>();

function formatTime(dateString: string): string {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function handleScroll(e: Event) {
  const target = e.target as HTMLElement;
  // If user scrolls near the bottom, emit load-more
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
    emit('load-more');
  }
}
</script>

<template>
  <aside class="sidebar-panel">
    <section class="history-list">
      <div class="new-chat-wrapper">
        <button
          type="button"
          class="reset-button"
          @click="emit('reset')"
        >
          新建会话
        </button>
      </div>
      <div class="history-header">历史会话</div>
      <div v-if="historyConversations && historyConversations.length > 0" class="history-scroll" @scroll="handleScroll">
        <div
          v-for="item in historyConversations"
          :key="item.id"
          class="history-item"
          :class="{ active: item.id === conversationId }"
          @click="emit('load-conversation', item.id)"
        >
          <div class="history-title">{{ item.title || '新会话' }}</div>
          <div class="history-time">{{ formatTime(item.updatedAt) }}</div>
        </div>
      </div>
      <div v-else class="history-empty">
        暂无历史会话
      </div>
    </section>
  </aside>
</template>

<style scoped>
.sidebar-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.history-list {
  background: color-mix(in srgb, var(--agent-panel-bg) 70%, white 30%);
  border: 1px solid color-mix(in srgb, var(--agent-accent) 14%, white 86%);
  border-radius: 1.2rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
}

.new-chat-wrapper {
  padding: 1rem 1.2rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.7)),
    var(--agent-panel-bg);
  border-bottom: 1px solid color-mix(in srgb, var(--agent-accent) 10%, white 90%);
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

.history-header {
  padding: 1rem 1.2rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: #334155;
  background: transparent;
}

.history-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 0.7rem 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.45) transparent;
}

.history-scroll::-webkit-scrollbar {
  width: 6px;
}

.history-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.history-scroll::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.38);
  border-radius: 999px;
}

.history-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 0.55);
}

.history-empty {
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
}

.history-item {
  padding: 0.8rem 1rem;
  border-radius: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.25rem;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.5);
}

.history-item.active {
  background: white;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
}

.history-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item.active .history-title {
  color: var(--agent-accent-strong);
}

.history-time {
  font-size: 0.75rem;
  color: #94a3b8;
}
</style>
