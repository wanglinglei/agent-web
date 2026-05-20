import type { ComputedRef, Ref } from 'vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  deleteConversation,
  fetchAgentsAnswerStream,
  fetchAgentConversations,
  fetchConversationMessages,
  updateConversationTitle,
} from '../api/agents';
import type { AgentWorkbenchConfig } from '../config/types';
import type {
  AgentsBoundarySvgPayload,
  AgentsChatMessage,
  AgentsConversationMessage,
  AgentsConversationSummary,
  AgentsEmailPayload,
  AgentsMessageRenderMeta,
  AgentsMessageRole,
  AgentsMessageStatus,
  AgentsTextPayload,
} from '../types/agents';

const HISTORY_PAGE_SIZE = 20;

export interface AgentChatController {
  canSubmit: ComputedRef<boolean>;
  closeEmailPreview: () => void;
  conversationId: Ref<string | undefined>;
  copySvgContent: (message: AgentsChatMessage) => Promise<void>;
  downloadSvgContent: (message: AgentsChatMessage) => void;
  emailPreviewContent: Ref<string>;
  emailPreviewSubject: Ref<string>;
  emailPreviewVisible: Ref<boolean>;
  errorMessage: Ref<string>;
  handleSubmit: () => Promise<void>;
  hasMoreHistory: Ref<boolean>;
  historyConversations: Ref<AgentsConversationSummary[]>;
  inputValue: Ref<string>;
  isLoadingHistory: Ref<boolean>;
  isSending: Ref<boolean>;
  loadConversation: (id: string) => Promise<void>;
  loadHistoryList: (isLoadMore?: boolean) => Promise<void>;
  messages: Ref<AgentsChatMessage[]>;
  openEmailPreview: (message: AgentsChatMessage) => void;
  removeConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  startNewConversation: () => void;
  submitSuggestedQuestion: (question: string) => Promise<void>;
  cancelActiveRequest: () => void;
}

export function useAgentChat(config: AgentWorkbenchConfig): AgentChatController {
  const messages = ref<AgentsChatMessage[]>([]);
  const historyConversations = ref<AgentsConversationSummary[]>([]);
  const inputValue = ref('');
  const isSending = ref(false);
  const conversationId = ref<string>();
  const errorMessage = ref('');
  const emailPreviewVisible = ref(false);
  const emailPreviewSubject = ref('');
  const emailPreviewContent = ref('');
  const canSubmit = computed(
    () => inputValue.value.trim().length > 0 && !isSending.value,
  );
  const page = ref(1);
  const hasMoreHistory = ref(true);
  const isLoadingHistory = ref(false);
  let activeController: AbortController | null = null;

  async function loadHistoryList(isLoadMore = false): Promise<void> {
    if (isLoadingHistory.value || (!hasMoreHistory.value && isLoadMore)) {
      return;
    }

    isLoadingHistory.value = true;
    errorMessage.value = '';

    try {
      const nextPage = isLoadMore ? page.value : 1;
      const newConversations = await fetchAgentConversations(
        config.agentKey,
        nextPage,
        HISTORY_PAGE_SIZE,
      );

      hasMoreHistory.value = newConversations.length >= HISTORY_PAGE_SIZE;
      historyConversations.value = isLoadMore
        ? mergeConversationSummaries(
            historyConversations.value,
            newConversations,
          )
        : newConversations;
      page.value = nextPage + 1;
    } catch (error) {
      console.error('Failed to load history list', error);
      errorMessage.value = '加载历史会话失败，请稍后再试。';
    } finally {
      isLoadingHistory.value = false;
    }
  }

  onMounted(() => {
    void loadHistoryList();
  });

  async function loadConversation(id: string): Promise<void> {
    if (isSending.value || conversationId.value === id) {
      return;
    }

    errorMessage.value = '';

    try {
      const conversationMessages = await fetchConversationMessages(id);
      messages.value = conversationMessages.map(mapConversationMessage);
      conversationId.value = id;
      closeEmailPreview();
    } catch (error) {
      console.error('Failed to load conversation messages', error);
      errorMessage.value = '加载会话消息失败，请稍后再试。';
    }
  }

  async function renameConversation(id: string, title: string): Promise<void> {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      errorMessage.value = '会话标题不能为空。';
      return;
    }

    try {
      const updated = await updateConversationTitle(id, normalizedTitle);
      const target = historyConversations.value.find((item) => item.id === id);
      if (target) {
        target.title = updated?.title || normalizedTitle;
      }
    } catch {
      errorMessage.value = '重命名会话失败，请稍后再试。';
    }
  }

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
      let streamedAnswer = '';
      const result = await fetchAgentsAnswerStream({
        agentKey: config.agentKey,
        message,
        conversationId: conversationId.value,
        onChunk: (chunk) => {
          streamedAnswer += chunk;
          updateMessage(assistantMessage.id, {
            content: streamedAnswer,
            status: 'streaming',
          });
        },
        signal: activeController.signal,
      });

      conversationId.value = result.conversationId;
      const resolvedDisplayText =
        streamedAnswer.trim() || resolveAssistantDisplayText(result.payload);
      updateMessage(assistantMessage.id, {
        content: resolvedDisplayText,
        renderMeta: resolveMessageRenderMeta(result.payload),
        status: 'sent',
      });
      await loadHistoryList();
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

  function cancelActiveRequest(): void {
    activeController?.abort();
  }

  function startNewConversation(): void {
    cancelActiveRequest();
    activeController = null;
    isSending.value = false;
    conversationId.value = undefined;
    errorMessage.value = '';
    inputValue.value = '';
    messages.value = [];
    closeEmailPreview();
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
    const target = messages.value.find((message) => message.id === messageId);
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
      const svgText = sanitizeSvgMarkup(payload.ext.svg);
      if (!svgText) {
        return {
          renderType: 'text',
        };
      }

      return {
        renderType: 'svg',
        svgFileName: payload.ext.fileName || 'boundary.svg',
        svgSummary: payload.answer || resolveSvgSummaryText(),
        svgText,
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
    cancelActiveRequest();
  });

  return {
    canSubmit,
    closeEmailPreview,
    conversationId,
    copySvgContent,
    downloadSvgContent,
    emailPreviewContent,
    emailPreviewSubject,
    emailPreviewVisible,
    errorMessage,
    handleSubmit,
    hasMoreHistory,
    historyConversations,
    inputValue,
    isLoadingHistory,
    isSending,
    loadConversation,
    loadHistoryList,
    messages,
    openEmailPreview,
    removeConversation,
    renameConversation,
    startNewConversation,
    submitSuggestedQuestion,
    cancelActiveRequest,
  };
}

function mapConversationMessage(
  message: AgentsConversationMessage,
): AgentsChatMessage {
  const renderMeta = message.metadata?.renderMeta;

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    status: message.status,
    createdAt: new Date(message.createdAt).getTime(),
    renderMeta:
      renderMeta?.renderType === 'svg'
        ? {
            ...renderMeta,
            svgText: sanitizeSvgMarkup(renderMeta.svgText),
          }
        : renderMeta,
  };
}

function mergeConversationSummaries(
  current: AgentsConversationSummary[],
  incoming: AgentsConversationSummary[],
): AgentsConversationSummary[] {
  const seen = new Set<string>();
  const merged: AgentsConversationSummary[] = [];

  for (const item of [...current, ...incoming]) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}

function sanitizeSvgMarkup(svgText?: string): string {
  if (!svgText?.trim()) {
    return '';
  }

  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return svgText;
  }

  try {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const root = doc.documentElement;

    if (root.nodeName.toLowerCase() !== 'svg') {
      return '';
    }

    const blockedTags = new Set([
      'script',
      'foreignobject',
      'iframe',
      'object',
      'embed',
    ]);

    for (const element of Array.from(root.querySelectorAll('*'))) {
      const tagName = element.tagName.toLowerCase();
      if (blockedTags.has(tagName)) {
        element.remove();
        continue;
      }

      for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();

        if (name.startsWith('on')) {
          element.removeAttribute(attribute.name);
          continue;
        }

        if (
          (name === 'href' || name === 'xlink:href') &&
          value.startsWith('javascript:')
        ) {
          element.removeAttribute(attribute.name);
        }
      }
    }

    return new XMLSerializer().serializeToString(root);
  } catch {
    return '';
  }
}
