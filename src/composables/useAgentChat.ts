import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  deleteConversation,
  fetchAgentsAnswerStream,
  fetchAgentConversations,
  fetchConversationMessages,
  updateConversationTitle,
} from '../api/agents';
import type {
  AgentsBoundarySvgPayload,
  AgentsChatMessage,
  AgentsEmailPayload,
  AgentsMessageRenderMeta,
  AgentsMessageRole,
  AgentsMessageStatus,
  AgentsTextPayload,
} from '../types/agents';
import type { AgentWorkbenchConfig } from '../config/types';

export function useAgentChat(config: AgentWorkbenchConfig) {
  const messages = ref<AgentsChatMessage[]>(createInitialMessages());
  const historyConversations = ref<any[]>([]);
  const inputValue = ref('');
  const isSending = ref(false);
  const conversationId = ref<string>();
  const errorMessage = ref('');
  const emailPreviewVisible = ref(false);
  const emailPreviewSubject = ref('');
  const emailPreviewContent = ref('');
  let activeController: AbortController | null = null;

  const canSubmit = computed(
    () => inputValue.value.trim().length > 0 && !isSending.value,
  );

  const page = ref(1);
  const hasMore = ref(true);
  const isLoadingHistory = ref(false);

  async function loadHistoryList(isLoadMore = false) {
    if (isLoadingHistory.value || (!hasMore.value && isLoadMore)) return;
    
    isLoadingHistory.value = true;
    try {
      if (!isLoadMore) {
        page.value = 1;
      }
      
      const newConversations = await fetchAgentConversations(config.agentKey, page.value, 20);
      
      if (newConversations.length < 20) {
        hasMore.value = false;
      } else {
        hasMore.value = true;
      }

      if (isLoadMore) {
        historyConversations.value = [...historyConversations.value, ...newConversations];
      } else {
        historyConversations.value = newConversations;
      }
      
      page.value++;
    } catch (e) {
      console.error('Failed to load history list', e);
    } finally {
      isLoadingHistory.value = false;
    }
  }

  onMounted(() => {
    loadHistoryList();
  });

  async function loadConversation(id: string) {
    if (isSending.value) return;
    try {
      const msgs = await fetchConversationMessages(id);
      messages.value = msgs.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        status: m.status,
        createdAt: new Date(m.createdAt).getTime(),
        renderMeta: m.metadata?.renderMeta,
      }));
      conversationId.value = id;
    } catch (e) {
      console.error('Failed to load conversation messages', e);
    }
  }

  /**
   * 重命名指定会话标题并同步侧边栏列表。
   *
   * @param id 会话 ID。
   * @param title 新标题。
   */
  async function renameConversation(id: string, title: string): Promise<void> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      errorMessage.value = '会话标题不能为空。';
      return;
    }

    try {
      await updateConversationTitle(id, normalizedTitle);
      const target = historyConversations.value.find((item) => item.id === id);
      if (target) {
        target.title = normalizedTitle;
      }
    } catch {
      errorMessage.value = '重命名会话失败，请稍后再试。';
    }
  }

  /**
   * 删除指定会话并在必要时重置当前聊天上下文。
   *
   * @param id 会话 ID。
   */
  async function removeConversation(id: string): Promise<void> {
    try {
      await deleteConversation(id);
      historyConversations.value = historyConversations.value.filter(
        (item) => item.id !== id,
      );
      if (conversationId.value === id) {
        startNewConversation();
      }
    } catch {
      errorMessage.value = '删除会话失败，请稍后再试。';
    }
  }

  function createChatMessage(
    role: AgentsMessageRole,
    content: string,
    status: AgentsMessageStatus,
  ): AgentsChatMessage {
    return {
      id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role,
      content,
      status,
      createdAt: Date.now(),
    };
  }

  function createInitialMessages(): AgentsChatMessage[] {
    return [];
  }

  async function handleSubmit(): Promise<void> {
    const message = inputValue.value.trim();

    if (!message || isSending.value) {
      return;
    }

    errorMessage.value = '';
    inputValue.value = '';
    isSending.value = true;
    activeController = new AbortController();

    const assistantMessage = createChatMessage('assistant', '', 'streaming');
    messages.value.push(
      createChatMessage('user', message, 'sent'),
      assistantMessage,
    );

    try {
      const result = await fetchAgentsAnswerStream({
        agentKey: config.agentKey,
        message,
        conversationId: conversationId.value,
        signal: activeController.signal,
      });

      conversationId.value = result.conversationId;
      updateMessage(assistantMessage.id, {
        content: resolveAssistantDisplayText(result.payload),
        renderMeta: resolveMessageRenderMeta(result.payload),
        status: 'sent',
      });
      loadHistoryList(); // refresh list
    } catch (error) {
      const messageText =
        error instanceof DOMException && error.name === 'AbortError'
          ? '本次任务已取消。'
          : error instanceof Error
            ? error.message
            : '任务处理失败，请稍后再试。';
      errorMessage.value = messageText;
      updateMessage(assistantMessage.id, {
        content: messageText,
        status: 'error',
      });
    } finally {
      isSending.value = false;
      activeController = null;
    }
  }

  function startNewConversation(): void {
    activeController?.abort();
    activeController = null;
    isSending.value = false;
    conversationId.value = undefined;
    errorMessage.value = '';
    inputValue.value = '';
    messages.value = createInitialMessages();
  }

  async function submitSuggestedQuestion(question: string): Promise<void> {
    if (isSending.value) {
      return;
    }
    inputValue.value = question;
    await handleSubmit();
  }

  function updateMessage(
    messageId: string,
    patch: Partial<Pick<AgentsChatMessage, 'content' | 'renderMeta' | 'status'>>,
  ): void {
    const target = messages.value.find((message: AgentsChatMessage) => message.id === messageId);
    if (!target) {
      return;
    }
    Object.assign(target, patch);
  }

  function resolveMessageRenderMeta(
    payload: AgentsBoundarySvgPayload | AgentsEmailPayload | AgentsTextPayload | null,
  ): AgentsMessageRenderMeta | undefined {
    if (!payload) {
      return undefined;
    }

    if (payload.type === 'svg') {
      if (!payload.ext.svg?.trim()) {
        return {
          renderType: 'text',
        };
      }
      return {
        renderType: 'svg',
        svgFileName: payload.ext.fileName || 'boundary.svg',
        svgSummary: payload.answer || resolveSvgSummaryText(),
        svgText: payload.ext.svg,
      };
    }

    if (payload.type === 'email') {
      return {
        emailPreview: payload.ext.preview,
        emailSubject: payload.ext.subject,
        renderType: 'email',
      };
    }

    return {
      renderType: 'text',
    };
  }

  function resolveAssistantDisplayText(
    payload: AgentsBoundarySvgPayload | AgentsEmailPayload | AgentsTextPayload | null,
  ): string {
    if (!payload) {
      return 'Agent 暂时没有返回内容，请换个问法再试。';
    }

    if (payload.type === 'email') {
      return payload.answer || `已生成邮件草稿：${payload.ext.subject || '（无主题）'}`;
    }

    if (payload.type === 'svg') {
      return payload.answer || resolveSvgSummaryText();
    }

    return payload.answer || 'Agent 暂时没有返回内容，请换个问法再试。';
  }

  function resolveSvgSummaryText(): string {
    return '边界 SVG 已生成，可直接预览、复制或下载。';
  }

  function openEmailPreview(message: AgentsChatMessage): void {
    if (message.renderMeta?.renderType !== 'email') {
      return;
    }
    emailPreviewSubject.value = message.renderMeta.emailSubject ?? '（无主题）';
    emailPreviewContent.value =
      message.renderMeta.emailPreview ?? message.content;
    emailPreviewVisible.value = true;
  }

  function closeEmailPreview(): void {
    emailPreviewVisible.value = false;
  }

  async function copySvgContent(message: AgentsChatMessage): Promise<void> {
    const svgText = message.renderMeta?.svgText?.trim();
    if (!svgText) {
      errorMessage.value = '当前消息没有可复制的 SVG 内容。';
      return;
    }

    try {
      await navigator.clipboard.writeText(svgText);
    } catch {
      errorMessage.value = '复制 SVG 失败，请检查浏览器剪贴板权限。';
    }
  }

  function downloadSvgContent(message: AgentsChatMessage): void {
    const svgText = message.renderMeta?.svgText?.trim();
    if (!svgText) {
      errorMessage.value = '当前消息没有可下载的 SVG 内容。';
      return;
    }

    const fileName = message.renderMeta?.svgFileName || 'boundary.svg';
    const blob = new Blob([svgText], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  onBeforeUnmount(() => {
    activeController?.abort();
  });

  return {
    messages,
    historyConversations,
    inputValue,
    isSending,
    conversationId,
    errorMessage,
    emailPreviewVisible,
    emailPreviewSubject,
    emailPreviewContent,
    canSubmit,
    loadConversation,
    loadHistoryList,
    renameConversation,
    removeConversation,
    handleSubmit,
    startNewConversation,
    submitSuggestedQuestion,
    openEmailPreview,
    closeEmailPreview,
    copySvgContent,
    downloadSvgContent,
  };
}
