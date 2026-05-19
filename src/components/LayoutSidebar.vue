<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { IconMoreDots } from '../assets/svg';

interface HistoryConversation {
  id: string;
  title?: string;
  updatedAt: string;
}

const props = defineProps<{
  config: any;
  isSending: boolean;
  conversationId?: string;
  historyConversations?: HistoryConversation[];
}>();

const emit = defineEmits<{
  (e: 'suggest', question: string): void;
  (e: 'reset'): void;
  (e: 'load-conversation', id: string): void;
  (e: 'load-more'): void;
  (e: 'rename-conversation', payload: { id: string; title: string }): void;
  (e: 'delete-conversation', id: string): void;
}>();
const activeMenuConversationId = ref('');

/**
 * 格式化历史会话更新时间。
 *
 * @param dateString 时间字符串。
 * @returns 展示用时间文本。
 */
function formatTime(dateString: string): string {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

/**
 * 处理历史列表滚动加载。
 *
 * @param e 滚动事件。
 */
function handleScroll(e: Event) {
  const target = e.target as HTMLElement;
  // If user scrolls near the bottom, emit load-more
  if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
    emit('load-more');
  }
}

/**
 * 切换指定会话下拉菜单显隐。
 *
 * @param id 会话 ID。
 */
function toggleConversationMenu(id: string): void {
  activeMenuConversationId.value =
    activeMenuConversationId.value === id ? '' : id;
}

/**
 * 关闭当前打开的会话菜单。
 */
function closeConversationMenu(): void {
  activeMenuConversationId.value = '';
}

/**
 * 触发会话重命名。
 *
 * @param item 会话对象。
 */
function handleRename(item: HistoryConversation): void {
  const input = window.prompt('请输入新标题', item.title || '');
  if (input === null) {
    return;
  }
  const title = input.trim();
  if (!title) {
    return;
  }
  emit('rename-conversation', {
    id: item.id,
    title,
  });
  closeConversationMenu();
}

/**
 * 触发会话删除确认。
 *
 * @param item 会话对象。
 */
function handleDelete(item: HistoryConversation): void {
  const confirmed = window.confirm('确认删除该历史会话吗？');
  if (!confirmed) {
    return;
  }
  emit('delete-conversation', item.id);
  closeConversationMenu();
}

/**
 * 点击页面空白处时关闭会话菜单。
 */
function handleDocumentClick(): void {
  closeConversationMenu();
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
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
      <div
        v-if="historyConversations && historyConversations.length > 0"
        class="history-scroll-shell"
      >
        <div class="history-scroll" @scroll="handleScroll">
          <div
            v-for="item in historyConversations"
            :key="item.id"
            class="history-item"
            :class="{ active: item.id === conversationId }"
            @click="emit('load-conversation', item.id)"
          >
            <div class="history-title-row">
              <div class="history-title">{{ item.title || '新会话' }}</div>
              <div
                class="history-menu-wrapper"
                @click.stop
              >
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
                    @click.stop="handleRename(item)"
                  >
                    重命名
                  </button>
                  <button
                    type="button"
                    class="history-dropdown-item history-dropdown-item-danger"
                    @click.stop="handleDelete(item)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
            <div class="history-time">{{ formatTime(item.updatedAt) }}</div>
          </div>
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

.history-scroll-shell {
  flex: 1;
  min-height: 0;
  padding: 0 0.7rem 1.25rem;
}

.history-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 0;
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
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-title-row {
  align-items: center;
  display: flex;
  gap: 0.5rem;
}

.history-menu-wrapper {
  margin-left: auto;
  position: relative;
}

.history-menu-trigger {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0.45rem;
  color: #64748b;
  cursor: pointer;
  display: inline-flex;
  height: 1.5rem;
  justify-content: center;
  margin-left: auto;
  opacity: 0;
  transition: all 0.2s ease;
  width: 1.5rem;
}

.history-item:hover .history-menu-trigger,
.history-item.active .history-menu-trigger {
  opacity: 1;
}

.history-menu-trigger:hover {
  background: rgba(148, 163, 184, 0.14);
  color: #334155;
}

.history-menu-icon :deep(svg) {
  fill: currentColor;
  height: 0.95rem;
  width: 0.95rem;
}

.history-dropdown {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.16);
  min-width: 8rem;
  padding: 0.35rem;
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  z-index: 20;
}

.history-dropdown-item {
  background: transparent;
  border: 0;
  border-radius: 0.45rem;
  color: #1e293b;
  cursor: pointer;
  display: block;
  font-size: 0.8rem;
  padding: 0.5rem 0.6rem;
  text-align: left;
  width: 100%;
}

.history-dropdown-item:hover {
  background: #f1f5f9;
}

.history-dropdown-item-danger {
  color: #dc2626;
}

.history-dropdown-item-danger:hover {
  background: #fef2f2;
}

.history-item.active .history-title {
  color: var(--agent-accent-strong);
}

.history-time {
  font-size: 0.75rem;
  color: #94a3b8;
}
</style>
