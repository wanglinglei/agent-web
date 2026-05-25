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
  AgentsChatMessage,
  AgentsConversationMessage,
  AgentsConversationSummary,
  AgentsMessageRenderMeta,
  AgentsMessageRole,
  AgentsMessageStatus,
  TemplateDataItem,
  TemplateDataPatch,
  TemplateDataStreamChunk,
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
    const requestMessage = normalizeTemplateDataRequestMessage(
      config.agentKey,
      message,
      messages.value,
    );

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
      const templateDataItems: Array<TemplateDataItem | undefined> = [];
      const templateDataPatches: Array<TemplateDataPatch | undefined> = [];
      let hasTemplateDataChunk = false;
      const result = await fetchAgentsAnswerStream({
        agentKey: config.agentKey,
        message: requestMessage,
        conversationId: conversationId.value,
        onChunk: (chunk) => {
          if (typeof chunk === 'string') {
            streamedAnswer += chunk;
            updateMessage(assistantMessage.id, {
              content: streamedAnswer,
              status: 'streaming',
            });
            return;
          }

          hasTemplateDataChunk = true;
          applyTemplateDataChunk(chunk, templateDataItems, templateDataPatches);
          const normalizedItems = compactTemplateDataItems(templateDataItems);
          const normalizedPatches = compactTemplateDataPatches(templateDataPatches);
          updateMessage(assistantMessage.id, {
            content: resolveTemplateDataSummary(
              normalizedItems,
              normalizedPatches,
              chunk.total,
              chunk.mode,
            ),
            renderMeta: {
              renderType: 'template-data',
              templateDataItems: normalizedItems,
              templateDataPatches: normalizedPatches,
            },
            status: 'streaming',
          });
        },
        onMeta: (meta) => {
          if (meta.conversationId) {
            conversationId.value = meta.conversationId;
          }
        },
        signal: activeController.signal,
      });

      conversationId.value = result.conversationId;
      if (hasTemplateDataChunk) {
        const normalizedItems = compactTemplateDataItems(templateDataItems);
        const normalizedPatches = compactTemplateDataPatches(templateDataPatches);
        updateMessage(assistantMessage.id, {
          content: resolveTemplateDataSummary(
            normalizedItems,
            normalizedPatches,
            normalizedItems.length + normalizedPatches.length,
            normalizedPatches.length ? 'edit' : 'generate',
          ),
          renderMeta: {
            renderType: 'template-data',
            templateDataItems: normalizedItems,
            templateDataPatches: normalizedPatches,
          },
          status: 'sent',
        });
        await loadHistoryList();
        return;
      }

      const resolvedDisplayText = streamedAnswer.trim() || resolveFallbackDisplayText();
      updateMessage(assistantMessage.id, {
        content: resolvedDisplayText,
        renderMeta: resolveMessageRenderMetaFromContent(streamedAnswer),
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

  function resolveMessageRenderMetaFromContent(
    streamedText: string,
  ): AgentsMessageRenderMeta | undefined {
    const svgRenderMeta = extractSvgRenderMeta(streamedText);
    if (svgRenderMeta) {
      return svgRenderMeta;
    }

    if (!streamedText.trim()) {
      return undefined;
    }

    return {
      renderType: 'text',
    };
  }

  function resolveFallbackDisplayText(): string {
    return 'Agent 暂时没有返回内容，请换个问法再试。';
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

/**
 * 将模板扩展页面中的自然语言输入自动转换为编辑模式请求。
 *
 * @param agentKey 当前业务页对应的 agent key。
 * @param message 用户原始输入。
 * @param sourceMessages 当前会话消息。
 * @returns 可直接发送给后端的请求字符串。
 */
function normalizeTemplateDataRequestMessage(
  agentKey: string,
  message: string,
  sourceMessages: AgentsChatMessage[],
): string {
  if (agentKey !== 'template-data') {
    return message;
  }

  if (isLikelyJsonObjectMessage(message)) {
    return message;
  }

  // 显式携带了“示例文件/模版JSON”上下文时，保留自然语言原文交给后端解析。
  if (message.includes('示例文件:') || message.includes('模版JSON:')) {
    return message;
  }

  const latestItems = resolveLatestTemplateDataItemsFromMessages(sourceMessages);
  if (!latestItems.length) {
    return message;
  }

  return JSON.stringify({
    mode: 'edit',
    editInstruction: message,
    baseItems: latestItems,
  });
}

/**
 * 判断输入是否是 JSON 对象字符串。
 *
 * @param message 用户输入。
 * @returns 是否可按 JSON 对象解析。
 */
function isLikelyJsonObjectMessage(message: string): boolean {
  const normalized = message.trim();
  if (!normalized.startsWith('{') || !normalized.endsWith('}')) {
    return false;
  }
  try {
    const parsed = JSON.parse(normalized) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

/**
 * 从消息列表中提取最近一次模板扩展“生成模式”的结果数组。
 *
 * @param sourceMessages 当前消息列表。
 * @returns 最新人员模板数组。
 */
function resolveLatestTemplateDataItemsFromMessages(
  sourceMessages: AgentsChatMessage[],
): TemplateDataItem[] {
  const reversed = [...sourceMessages].reverse();
  const latestMessage = reversed.find(
    (item) =>
      item.role === 'assistant' &&
      item.renderMeta?.renderType === 'template-data' &&
      (item.renderMeta.templateDataItems?.length ?? 0) > 0,
  );
  return latestMessage?.renderMeta?.templateDataItems ?? [];
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

/**
 * 从流式 Markdown 中提取 SVG 代码块并生成渲染元信息。
 *
 * @param streamedText 流式累积文本。
 * @returns SVG 渲染元信息，未命中时返回 undefined。
 */
function extractSvgRenderMeta(
  streamedText: string,
): AgentsMessageRenderMeta | undefined {
  const text = streamedText.trim();
  if (!text) {
    return undefined;
  }

  const svgFenceRegex = /```svg\s*([\s\S]*?)```/i;
  const match = svgFenceRegex.exec(text);
  if (!match) {
    return undefined;
  }

  const rawSvgText = match[1]?.trim();
  const svgText = sanitizeSvgMarkup(rawSvgText);
  if (!svgText) {
    return {
      renderType: 'text',
    };
  }

  const svgSummary = text.replace(svgFenceRegex, '').trim();
  return {
    renderType: 'svg',
    svgFileName: 'boundary.svg',
    svgSummary: svgSummary || '边界 SVG 已生成，可直接预览、复制或下载。',
    svgText,
  };
}

/**
 * 将模板扩展流式分片应用到本地缓存数组。
 *
 * @param chunk 结构化分片。
 * @param items 人员结果缓存。
 * @param patches 变更补丁缓存。
 */
function applyTemplateDataChunk(
  chunk: TemplateDataStreamChunk,
  items: Array<TemplateDataItem | undefined>,
  patches: Array<TemplateDataPatch | undefined>,
): void {
  if (chunk.type === 'item' && chunk.item) {
    items[chunk.index] = chunk.item;
    return;
  }
  if (chunk.type === 'patch' && chunk.patch) {
    patches[chunk.index] = chunk.patch;
  }
}

/**
 * 压缩人员结果缓存，移除空位。
 *
 * @param items 人员结果缓存。
 * @returns 连续数组。
 */
function compactTemplateDataItems(
  items: Array<TemplateDataItem | undefined>,
): TemplateDataItem[] {
  return items.filter((item): item is TemplateDataItem => Boolean(item));
}

/**
 * 压缩补丁缓存，移除空位。
 *
 * @param patches 补丁缓存。
 * @returns 连续数组。
 */
function compactTemplateDataPatches(
  patches: Array<TemplateDataPatch | undefined>,
): TemplateDataPatch[] {
  return patches.filter((patch): patch is TemplateDataPatch => Boolean(patch));
}

/**
 * 生成模板扩展场景的消息摘要文本。
 *
 * @param items 人员结果列表。
 * @param patches 补丁列表。
 * @param total 总计数量。
 * @param mode 当前模式。
 * @returns 可展示文案。
 */
function resolveTemplateDataSummary(
  items: TemplateDataItem[],
  patches: TemplateDataPatch[],
  total: number,
  mode: 'edit' | 'generate',
): string {
  if (mode === 'edit') {
    return `已解析补丁 ${patches.length}/${Math.max(total, patches.length)} 条。`;
  }
  return `已生成人员模板 ${items.length}/${Math.max(total, items.length)} 条。`;
}
