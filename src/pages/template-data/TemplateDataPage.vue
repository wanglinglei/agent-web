<script setup lang="ts">
import { computed, ref } from 'vue';
import { message as toast } from 'ant-design-vue';
import mammoth from 'mammoth';
import { uploadGeneralFile } from '../../api/general';
import { useAgentChat } from '../../composables/useAgentChat';
import { templateDataConfig } from './template-data.config';
import type {
  AgentsChatMessage,
  TemplateDataItem,
  TemplateDataPatch,
} from '../../types/agents';
import LayoutSidebar from '../../components/LayoutSidebar.vue';
import PageHeader from '../../components/PageHeader.vue';
import HistorySessions from '../../components/HistorySessions.vue';
import ChatInput from '../../components/ChatInput.vue';

const config = templateDataConfig;
const chat = useAgentChat(config);
const jsonTemplateInput = ref(
  JSON.stringify(
    {
      姓名: '',
      班级: '一班',
      评价: '',
    },
    null,
    2,
  ),
);
const uploadedFileUrl = ref('');
const isUploading = ref(false);
const isParsingTemplateFile = ref(false);

/**
 * 读取最近一次模板扩展生成结果，作为编辑模式的 baseItems 默认值。
 *
 * @returns 最新人员结果数组。
 */
const latestTemplateItems = computed<TemplateDataItem[]>(() => {
  const targetMessage = resolveLatestTemplateDataMessage(chat.messages.value);
  return targetMessage?.renderMeta?.templateDataItems ?? [];
});

/**
 * 读取最近一次模板扩展补丁结果。
 *
 * @returns 最新 patch 数组。
 */
const latestTemplatePatches = computed<TemplateDataPatch[]>(() => {
  const targetMessage = resolveLatestTemplateDataMessage(chat.messages.value);
  return targetMessage?.renderMeta?.templateDataPatches ?? [];
});

/**
 * 读取最近一次模板扩展结构化消息。
 *
 * @param sourceMessages 会话消息。
 * @returns 目标消息。
 */
function resolveLatestTemplateDataMessage(
  sourceMessages: AgentsChatMessage[],
): AgentsChatMessage | undefined {
  const assistantMessages = [...sourceMessages].reverse();
  return assistantMessages.find(
    (item) =>
      item.role === 'assistant' &&
      item.renderMeta?.renderType === 'template-data' &&
      ((item.renderMeta.templateDataItems?.length ?? 0) > 0 ||
        (item.renderMeta.templateDataPatches?.length ?? 0) > 0),
  );
}

/**
 * 计算聊天区域中每条消息的基础展示文本。
 *
 * @param {AgentsChatMessage} message 聊天消息。
 * @returns {string}
 */
function resolveHistoryMessageContent(message: AgentsChatMessage): string {
  return message.content || '正在执行任务...';
}

/**
 * 判断当前消息是否使用 Markdown 容器渲染。
 *
 * @param {AgentsChatMessage} message 聊天消息。
 * @returns {boolean}
 */
function shouldRenderHistoryMarkdownMessage(message: AgentsChatMessage): boolean {
  if (message.role !== 'assistant') {
    return false;
  }
  if (message.status === 'error') {
    return false;
  }
  return message.renderMeta?.renderType !== 'template-data';
}

/**
 * 上传示例文档并写入 URL。
 *
 * @param event input file 事件。
 * @returns {Promise<void>}
 */
async function handleUploadFile(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  isUploading.value = true;
  chat.errorMessage.value = '';
  try {
    const result = await uploadGeneralFile(file);
    uploadedFileUrl.value = result.url;
  } catch (error) {
    chat.errorMessage.value =
      error instanceof Error ? error.message : '文件上传失败，请稍后再试。';
  } finally {
    isUploading.value = false;
    target.value = '';
  }
}

/**
 * 从本地文件解析并回填 JSON 模板，不走上传接口。
 *
 * @param event input file 事件。
 * @returns {Promise<void>}
 */
async function handleParseTemplateFile(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  isParsingTemplateFile.value = true;
  chat.errorMessage.value = '';
  try {
    const parsedTemplate = await parseTemplateJsonFromLocalFile(file);
    jsonTemplateInput.value = JSON.stringify(parsedTemplate, null, 2);
  } catch (error) {
    chat.errorMessage.value =
      error instanceof Error ? error.message : '本地模板解析失败，请检查文件内容。';
  } finally {
    isParsingTemplateFile.value = false;
    target.value = '';
  }
}

/**
 * 统一处理底部输入框提交：
 * - 纯 JSON 输入：按原样发送；
 * - 非 JSON 输入：组装生成请求后发送。
 *
 * @returns {Promise<void>}
 */
async function handleTemplateSubmit(): Promise<void> {
  const originalInput = chat.inputValue.value.trim();
  if (!originalInput) {
    return;
  }

  const isFirstSubmit = chat.messages.value.length === 0;
  const exampleDocUrl = uploadedFileUrl.value.trim();
  if (isFirstSubmit && !exampleDocUrl) {
    notifyValidationError('首次发送前请先上传示例文件。');
    return;
  }
  if (isFirstSubmit && !formatJsonTemplateInput(true)) {
    notifyValidationError('首次发送前请先生成并确认模板 JSON。');
    return;
  }

  let templateJsonString = '';
  if (formatJsonTemplateInput(false)) {
    try {
      templateJsonString = JSON.stringify(JSON.parse(jsonTemplateInput.value.trim()));
    } catch {
      templateJsonString = '';
    }
  }
  const mergedContent = [
    originalInput,
    ...(exampleDocUrl ? [`示例文件: ${exampleDocUrl}`] : []),
    ...(templateJsonString ? [`模版JSON: ${templateJsonString}`] : []),
  ].join('\n');

  chat.inputValue.value = mergedContent;
  await chat.handleSubmit();
}

/**
 * 统一提示前端校验错误（toast + 输入区错误文案）。
 *
 * @param {string} content 错误提示文案。
 * @returns {void}
 */
function notifyValidationError(content: string): void {
  chat.errorMessage.value = content;
  void toast.warning(content);
}

/**
 * 对 JSON 模板输入进行格式化。
 *
 * @param showError 格式化失败时是否提示错误。
 * @returns 是否格式化成功。
 */
function formatJsonTemplateInput(showError = false): boolean {
  const normalized = jsonTemplateInput.value.trim();
  if (!normalized) {
    return false;
  }

  try {
    const parsed = JSON.parse(normalized) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      if (showError) {
        chat.errorMessage.value = 'JSON 模板必须是对象格式。';
      }
      return false;
    }
    jsonTemplateInput.value = JSON.stringify(parsed, null, 2);
    return true;
  } catch {
    if (showError) {
      chat.errorMessage.value = 'JSON 模板格式错误，请检查后重试。';
    }
    return false;
  }
}

/**
 * 预览区格式化字段值。
 *
 * @param value 任意值。
 * @returns 可读文本。
 */
function formatPreviewValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '（无法序列化）';
  }
}

/**
 * 从本地文件中提取模板 JSON 对象。
 *
 * @param file 本地文件。
 * @returns JSON 对象。
 */
async function parseTemplateJsonFromLocalFile(
  file: File,
): Promise<Record<string, unknown>> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.docx')) {
    return parseDocxTemplateWithMammoth(file);
  }

  if (
    lowerName.endsWith('.json') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md')
  ) {
    const content = await file.text();
    const templateFromPlaceholders = extractTemplateFromPlaceholders(content);
    if (Object.keys(templateFromPlaceholders).length > 0) {
      return templateFromPlaceholders;
    }
    const extracted = extractFirstJsonObject(content);
    if (!extracted) {
      throw new Error(
        '文件中未识别到占位符或 JSON 对象。请使用 {字段} 或 {{字段}} 写法。',
      );
    }
    try {
      const parsed = JSON.parse(extracted) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('模板必须是 JSON 对象格式。');
      }
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error('识别到 JSON 片段，但解析失败，请检查语法。');
    }
  }

  throw new Error('仅支持 .docx / .json / .txt / .md 文件解析模板。');
}

/**
 * 使用 mammoth 解析 docx 文本并推断 JSON 模板。
 *
 * @param file docx 文件。
 * @returns 模板 JSON 对象。
 */
async function parseDocxTemplateWithMammoth(
  file: File,
): Promise<Record<string, unknown>> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const plainText = result.value || '';
  const templateFromPlaceholders = extractTemplateFromPlaceholders(plainText);
  if (Object.keys(templateFromPlaceholders).length > 0) {
    return templateFromPlaceholders;
  }

  throw new Error(
    '未从 docx 识别到占位符字段，请使用 {字段} 或 {{字段}} 写法。',
  );
}

/**
 * 从文本中提取占位符并生成模板对象。
 *
 * @param text 纯文本。
 * @returns 模板对象。
 */
function extractTemplateFromPlaceholders(text: string): Record<string, unknown> {
  const template: Record<string, unknown> = {};
  const normalizedText = text || '';
  const keySet = new Set<string>();

  const doubleBraceRegex = /\{\{\s*([A-Za-z0-9_\u4e00-\u9fa5.$-]+)\s*\}\}/g;
  let match: RegExpExecArray | null = null;
  while ((match = doubleBraceRegex.exec(normalizedText)) !== null) {
    const key = normalizePlaceholderKey(match[1]);
    if (isValidPlaceholderKey(key)) {
      keySet.add(key);
    }
  }

  const textWithoutDoubleBraces = normalizedText.replace(doubleBraceRegex, ' ');
  const singleBraceRegex = /\{\s*([A-Za-z0-9_\u4e00-\u9fa5.$-]+)\s*\}/g;
  while ((match = singleBraceRegex.exec(textWithoutDoubleBraces)) !== null) {
    const key = normalizePlaceholderKey(match[1]);
    if (isValidPlaceholderKey(key)) {
      keySet.add(key);
    }
  }

  for (const key of keySet) {
    assignTemplatePath(template, key, '');
  }

  return template;
}

/**
 * 判断占位符键是否合法。
 *
 * @param key 候选字段名。
 * @returns 是否可用。
 */
function isValidPlaceholderKey(key?: string): boolean {
  if (!key) {
    return false;
  }
  const normalized = key.trim();
  if (!normalized || normalized.length > 48) {
    return false;
  }
  if (!/^[A-Za-z0-9_\u4e00-\u9fa5.$-]+$/.test(normalized)) {
    return false;
  }
  if (
    /^(for|if|end|query|ins|exec|image|link|html|alias|end-for|end-if)$/i.test(
      normalized,
    )
  ) {
    return false;
  }
  const segments = normalized.split('.');
  if (segments.some((segment) => !segment.trim())) {
    return false;
  }
  return true;
}

/**
 * 归一化占位符键。
 *
 * @param value 原始候选文本。
 * @returns 归一化结果。
 */
function normalizePlaceholderKey(value?: string): string {
  if (!value) {
    return '';
  }
  return value.trim().replace(/^\$/, '');
}

/**
 * 根据路径向模板对象写入默认值。
 *
 * @param target 模板对象。
 * @param path 字段路径。
 * @param value 默认值。
 */
function assignTemplatePath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const segments = path.split('.').filter(Boolean);
  if (!segments.length) {
    return;
  }

  let cursor: Record<string, unknown> = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const current = cursor[segment];
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  const leafKey = segments[segments.length - 1];
  if (typeof cursor[leafKey] === 'undefined') {
    cursor[leafKey] = value;
  }
}

/**
 * 从字符串中提取首个可配对的大括号 JSON 对象片段。
 *
 * @param source 原始文本。
 * @returns JSON 字符串或空字符串。
 */
function extractFirstJsonObject(source: string): string {
  const text = source.trim();
  if (!text) {
    return '';
  }

  let startIndex = -1;
  let braceDepth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '{') {
      if (startIndex < 0) {
        startIndex = index;
      }
      braceDepth += 1;
      continue;
    }
    if (char === '}' && startIndex >= 0) {
      braceDepth -= 1;
      if (braceDepth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }
  return '';
}

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
          :hasMore="chat.hasMoreHistory.value"
          :historyConversations="chat.historyConversations.value"
          :isLoadingHistory="chat.isLoadingHistory.value"
          @reset="chat.startNewConversation"
          @load-conversation="chat.loadConversation"
          @rename-conversation="({ id, title }) => chat.renameConversation(id, title)"
          @delete-conversation="chat.removeConversation"
          @load-more="chat.loadHistoryList(true)"
        />

        <section class="chat-shell">
          <HistorySessions
            :config="config"
            :messages="chat.messages.value"
            :resolve-message-content="resolveHistoryMessageContent"
            :should-render-markdown-message="shouldRenderHistoryMarkdownMessage"
            @suggest="chat.submitSuggestedQuestion"
          />

          <ChatInput
            v-model="chat.inputValue.value"
            :config="config"
            :isSending="chat.isSending.value"
            :errorMessage="chat.errorMessage.value"
            @cancel="chat.cancelActiveRequest"
            @submit="handleTemplateSubmit"
          />
        </section>

        <aside class="template-side-panel">
          <section class="template-side-card">
            <p class="side-title">模板 JSON</p>
            <label class="form-item">
              <span>JSON 模板</span>
              <textarea
                v-model="jsonTemplateInput"
                class="json-template-textarea"
                rows="4"
                placeholder='例如：{"姓名":"","班级":"一班","评价":""}'
                @blur="formatJsonTemplateInput()"
              />
            </label>
            <div class="upload-row">
              <label class="upload-trigger">
                <input
                  type="file"
                  :disabled="isUploading || isParsingTemplateFile || chat.isSending.value"
                  @change="handleUploadFile"
                />
                {{ isUploading ? '上传中...' : '上传示例文档（必传）' }}
              </label>
              <label class="upload-trigger upload-trigger-secondary">
                <input
                  type="file"
                  :disabled="isUploading || isParsingTemplateFile || chat.isSending.value"
                  @change="handleParseTemplateFile"
                />
                {{ isParsingTemplateFile ? '解析中...' : '本地解析模板JSON' }}
              </label>
              <span v-if="uploadedFileUrl" class="upload-result">
                <a :href="uploadedFileUrl" target="_blank" rel="noopener noreferrer">
                  预览已上传文档
                </a>
              </span>
            </div>
          </section>

          <section class="template-side-card">
            <p class="side-title">结果预览</p>
            <div v-if="latestTemplateItems.length" class="preview-section">
              <p class="preview-title">最近生成人员数据（{{ latestTemplateItems.length }}）</p>
              <div class="preview-list">
                <article
                  v-for="(item, index) in latestTemplateItems"
                  :key="`preview-item-${index}`"
                  class="preview-card"
                >
                  <p class="preview-card-title">第 {{ index + 1 }} 条</p>
                  <pre class="preview-json">{{ formatPreviewValue(item) }}</pre>
                </article>
              </div>
            </div>
            <div v-if="latestTemplatePatches.length" class="preview-section">
              <p class="preview-title">最近 patch（{{ latestTemplatePatches.length }}）</p>
              <div class="preview-list">
                <article
                  v-for="(patch, index) in latestTemplatePatches"
                  :key="`preview-patch-${index}`"
                  class="preview-card"
                >
                  <p class="preview-card-title">
                    {{ patch.targetName }} · {{ patch.field }}
                  </p>
                  <p class="preview-line">
                    新值：{{ formatPreviewValue(patch.newValue) }}
                  </p>
                  <p v-if="patch.reason" class="preview-line">原因：{{ patch.reason }}</p>
                </article>
              </div>
            </div>
            <p
              v-if="!latestTemplateItems.length && !latestTemplatePatches.length"
              class="preview-empty"
            >
              暂无结构化结果，先点击“发送生成请求”。
            </p>
          </section>
        </aside>
      </div>
    </section>
  </main>
</template>

<style scoped>
.agent-page {
  background: var(--agent-page-bg);
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
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
  padding: 1.5rem 1rem calc(2rem + env(safe-area-inset-bottom, 0px));
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.workbench-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 280px minmax(0, 1fr) 280px;
  flex: 1;
  min-height: 0;
  height: 100%;
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
  min-height: 0;
}

.template-side-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-height: 0;
}

.template-side-card {
  background: color-mix(in srgb, var(--agent-panel-bg) 70%, white 30%);
  border: 1px solid color-mix(in srgb, var(--agent-accent) 14%, white 86%);
  border-radius: 1.2rem;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.85rem;
}

.side-title {
  color: #172033;
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-item > span {
  color: #334155;
  font-size: 0.75rem;
  font-weight: 700;
}

.form-item textarea {
  border: 1px solid #dbe4f0;
  border-radius: 0.65rem;
  font: inherit;
  font-size: 0.78rem;
  line-height: 1.5;
  padding: 0.45rem 0.55rem;
  resize: vertical;
}

.json-template-textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  white-space: pre;
}

.upload-row {
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.upload-trigger {
  background: #f8fafc;
  border: 1px solid #dbe4f0;
  border-radius: 999px;
  color: #334155;
  cursor: pointer;
  font-size: 0.76rem;
  padding: 0.35rem 0.7rem;
  position: relative;
}

.upload-trigger-secondary {
  background: #fff;
}

.upload-trigger input {
  display: none;
}

.upload-result {
  color: #475569;
  font-size: 0.76rem;
}

.upload-result a {
  color: #7c3aed;
  word-break: break-all;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.preview-title {
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  margin: 0;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-height: 13rem;
  overflow-y: auto;
  padding-right: 0.1rem;
}

.preview-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.55rem;
}

.preview-card-title {
  color: #1e293b;
  font-size: 0.76rem;
  font-weight: 700;
  margin: 0;
}

.preview-json {
  background: #f8fafc;
  border-radius: 0.5rem;
  font-size: 0.72rem;
  line-height: 1.45;
  margin: 0.4rem 0 0;
  overflow-x: auto;
  padding: 0.42rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.preview-line {
  color: #475569;
  font-size: 0.74rem;
  margin: 0.35rem 0 0;
}

.preview-empty {
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.55;
  margin: 0;
}

@media (max-width: 1080px) {
  .workbench-grid {
    grid-template-columns: 1fr;
  }
  .chat-shell {
    order: 1;
  }

  .template-side-panel {
    order: 2;
  }
}

@media (max-width: 760px) {
  .agent-layout {
    padding: 1rem 0.75rem;
  }
}
</style>

