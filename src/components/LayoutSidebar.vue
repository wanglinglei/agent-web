<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { IconMoreDots } from '../assets/svg';
import type { AgentWorkbenchConfig } from '../config/types';
import type { AgentsConversationSummary } from '../types/agents';

const props = defineProps<{
  config: AgentWorkbenchConfig;
  conversationId?: string;
  hasMore?: boolean;
  historyConversations?: AgentsConversationSummary[];
  isLoadingHistory?: boolean;
  isSending: boolean;
}>();

const emit = defineEmits<{
  (e: 'reset'): void;
  (e: 'load-conversation', id: string): void;
  (e: 'load-more'): void;
  (e: 'rename-conversation', payload: { id: string; title: string }): void;
  (e: 'delete-conversation', id: string): void;
}>();

type DialogMode = 'delete' | 'rename' | '';

const activeMenuConversationId = ref('');
const dialogMode = ref<DialogMode>('');
const pendingConversation = ref<AgentsConversationSummary | null>(null);
const renameValue = ref('');

const dialogTitle = computed(() =>
  dialogMode.value === 'rename' ? '重命名会话' : '删除会话',
);

const dialogDescription = computed(() => {
  if (!pendingConversation.value) {
    return '';
  }

  if (dialogMode.value === 'rename') {
    return '修改后会立即同步到历史会话列表。';
  }

  return `会话“${pendingConversation.value.title || '新会话'}”删除后将无法在当前列表中恢复。`;
});

function formatTime(dateString: string): string {
  if (!dateString) {
    return '';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function handleScroll(event: Event): void {
  if (!props.hasMore || props.isLoadingHistory) {
    return;
  }

  const target = event.target as HTMLElement;
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 64) {
    emit('load-more');
  }
}

function toggleConversationMenu(id: string): void {
  activeMenuConversationId.value =
    activeMenuConversationId.value === id ? '' : id;
}

function closeConversationMenu(): void {
  activeMenuConversationId.value = '';
}

function openRenameDialog(item: AgentsConversationSummary): void {
  pendingConversation.value = item;
  renameValue.value = item.title || '';
  dialogMode.value = 'rename';
  closeConversationMenu();
}

function openDeleteDialog(item: AgentsConversationSummary): void {
  pendingConversation.value = item;
  dialogMode.value = 'delete';
  closeConversationMenu();
}

function closeDialog(): void {
  dialogMode.value = '';
  pendingConversation.value = null;
  renameValue.value = '';
}

function confirmDialog(): void {
  if (!pendingConversation.value) {
    return;
  }

  if (dialogMode.value === 'rename') {
    const title = renameValue.value.trim();
    if (!title) {
      return;
    }

    emit('rename-conversation', {
      id: pendingConversation.value.id,
      title,
    });
  }

  if (dialogMode.value === 'delete') {
    emit('delete-conversation', pendingConversation.value.id);
  }

  closeDialog();
}

function handleDocumentClick(): void {
  closeConversationMenu();
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeConversationMenu();
    closeDialog();
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <aside class="sidebar-panel">
    <section class="history-list">
      <div class="new-chat-wrapper">
        <button
          type="button"
          class="reset-button"
          :disabled="isSending"
          @click="emit('reset')"
        >
          新建会话
        </button>
      </div>

      <div class="history-header">
        <span>历史会话</span>
        <span class="history-count">{{ historyConversations?.length || 0 }}</span>
      </div>

      <div
        v-if="historyConversations && historyConversations.length > 0"
        class="history-scroll-shell"
      >
        <div class="history-scroll" @scroll="handleScroll">
          <button
            v-for="item in historyConversations"
            :key="item.id"
            type="button"
            class="history-item"
            :class="{ active: item.id === conversationId }"
            @click="emit('load-conversation', item.id)"
          >
            <div class="history-title-row">
              <div class="history-title">{{ item.title || '新会话' }}</div>
              <div class="history-menu-wrapper" @click.stop>
                <button
                  type="button"
                  class="history-menu-trigger"
                  title="更多操作"
                  @click.stop="toggleConversationMenu(item.id)"
                >
                  <span class="history-menu-icon" v-html="IconMoreDots" />
                </button>

                <div
                  v-if="activeMenuConversationId === item.id"
                  class="history-dropdown"
                >
                  <button
                    type="button"
                    class="history-dropdown-item"
                    @click.stop="openRenameDialog(item)"
                  >
                    重命名
                  </button>
                  <button
                    type="button"
                    class="history-dropdown-item history-dropdown-item-danger"
                    @click.stop="openDeleteDialog(item)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
            <div class="history-time">{{ formatTime(item.updatedAt) }}</div>
          </button>

          <div class="history-status">
            <span v-if="isLoadingHistory">正在加载更多...</span>
            <span v-else-if="hasMore">向下滚动继续加载</span>
            <span v-else>已经到底了</span>
          </div>
        </div>
      </div>

      <div v-else class="history-empty">
        <p class="history-empty-title">暂无历史会话</p>
        <p class="history-empty-copy">当前 {{ config.helperTitle }} 还没有保存过的对话。</p>
      </div>
    </section>

    <div
      v-if="dialogMode"
      class="dialog-mask"
      @click.self="closeDialog"
    >
      <section class="dialog-panel">
        <p class="dialog-kicker">{{ dialogTitle }}</p>
        <p class="dialog-copy">{{ dialogDescription }}</p>

        <textarea
          v-if="dialogMode === 'rename'"
          v-model="renameValue"
          class="dialog-input"
          rows="3"
          placeholder="请输入新的会话标题"
        />

        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn-secondary" @click="closeDialog">
            取消
          </button>
          <button
            type="button"
            class="dialog-btn dialog-btn-primary"
            :disabled="dialogMode === 'rename' && !renameValue.trim()"
            @click="confirmDialog"
          >
            {{ dialogMode === 'rename' ? '确认修改' : '确认删除' }}
          </button>
        </div>
      </section>
    </div>
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
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.new-chat-wrapper {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.7)),
    var(--agent-panel-bg);
  border-bottom: 1px solid color-mix(in srgb, var(--agent-accent) 10%, white 90%);
  padding: 1rem 1.2rem;
}

.reset-button {
  background: var(--agent-accent);
  border: 0;
  border-radius: 999px;
  color: white;
  font-weight: 700;
  padding: 0.85rem 1rem;
  transition: opacity 0.2s ease;
  width: 100%;
}

.reset-button:hover:not(:disabled) {
  opacity: 0.9;
}

.history-header {
  align-items: center;
  color: #334155;
  display: flex;
  font-size: 0.9rem;
  font-weight: 600;
  justify-content: space-between;
  padding: 1rem 1.2rem 0.8rem;
}

.history-count {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  color: #64748b;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
}

.history-scroll-shell {
  flex: 1;
  min-height: 0;
  padding: 0 0.7rem 1rem;
}

.history-scroll {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  height: 100%;
  overflow-y: auto;
  padding: 0.1rem;
  scrollbar-width: thin;
}

.history-item {
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid transparent;
  border-radius: 1rem;
  color: #1e293b;
  padding: 0.85rem 0.9rem;
  text-align: left;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    transform 180ms ease;
  width: 100%;
}

.history-item:hover {
  border-color: color-mix(in srgb, var(--agent-accent) 20%, white 80%);
  transform: translateY(-1px);
}

.history-item.active {
  background: color-mix(in srgb, var(--agent-accent-soft) 78%, white 22%);
  border-color: color-mix(in srgb, var(--agent-accent) 24%, white 76%);
}

.history-title-row {
  align-items: flex-start;
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}

.history-title {
  display: -webkit-box;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.5;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.history-time {
  color: #64748b;
  font-size: 0.78rem;
  margin-top: 0.45rem;
}

.history-menu-wrapper {
  position: relative;
}

.history-menu-trigger {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: #64748b;
  display: inline-flex;
  height: 1.9rem;
  justify-content: center;
  width: 1.9rem;
}

.history-menu-trigger:hover {
  background: rgba(148, 163, 184, 0.14);
}

.history-menu-icon {
  display: inline-flex;
  height: 1rem;
  width: 1rem;
}

.history-dropdown {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
  padding: 0.35rem;
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  width: 8rem;
  z-index: 10;
}

.history-dropdown-item {
  background: transparent;
  border: 0;
  border-radius: 0.65rem;
  color: #334155;
  display: block;
  padding: 0.55rem 0.65rem;
  text-align: left;
  width: 100%;
}

.history-dropdown-item:hover {
  background: #f8fafc;
}

.history-dropdown-item-danger {
  color: #b91c1c;
}

.history-status {
  color: #64748b;
  font-size: 0.78rem;
  padding: 0.4rem 0.2rem 0;
  text-align: center;
}

.history-empty {
  color: #475569;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  padding: 1.2rem;
  text-align: center;
}

.history-empty-title {
  color: #172033;
  font-weight: 700;
  margin: 0;
}

.history-empty-copy {
  line-height: 1.7;
  margin: 0.65rem 0 0;
}

.dialog-mask {
  align-items: center;
  background: rgba(15, 23, 42, 0.36);
  display: flex;
  inset: 0;
  justify-content: center;
  position: fixed;
  z-index: 50;
}

.dialog-panel {
  background: white;
  border-radius: 1.3rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  padding: 1.25rem;
  width: min(92vw, 28rem);
}

.dialog-kicker {
  color: #172033;
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.dialog-copy {
  color: #475569;
  line-height: 1.75;
  margin: 0.65rem 0 0;
}

.dialog-input {
  border: 1px solid #dbe4f0;
  border-radius: 1rem;
  font: inherit;
  line-height: 1.6;
  margin-top: 1rem;
  min-height: 6rem;
  padding: 0.8rem 0.9rem;
  resize: vertical;
  width: 100%;
}

.dialog-actions {
  display: flex;
  gap: 0.7rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.dialog-btn {
  border: 0;
  border-radius: 999px;
  padding: 0.65rem 1rem;
}

.dialog-btn-secondary {
  background: #f1f5f9;
  color: #334155;
}

.dialog-btn-primary {
  background: #0f172a;
  color: white;
}

@media (max-width: 1080px) {
  .sidebar-panel {
    height: auto;
  }

  .history-list {
    max-height: 24rem;
  }
}
</style>
