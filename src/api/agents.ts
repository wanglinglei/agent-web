import type {
  AgentApiEnvelope,
  AgentsSseEvent,
  AgentsConversationMessage,
  AgentsConversationSummary,
  AgentsStreamOptions,
  AgentsStreamResult,
} from '../types/agents';
import { XStream } from 'ant-design-x-vue';

const AGENTS_STREAM_ENDPOINT = '/ai-agent/agents/query/stream';
const AGENTS_CONVERSATIONS_ENDPOINT = '/ai-agent/agents/conversations';
const HEADER_CONVERSATION_ID = 'X-Conversation-Id';
const HEADER_AGENT_KEY = 'X-Agents-Agent-Key';

/**
 * Requests a structured multi-agent response.
 *
 * @param options Request options.
 * @returns Structured result from unified response wrapper.
 */
export async function fetchAgentsAnswerStream(
  options: AgentsStreamOptions,
): Promise<AgentsStreamResult> {
  const response = await fetch(AGENTS_STREAM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      agentKey: options.agentKey,
      message: options.message,
      conversationId: options.conversationId,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response));
  }

  if (!response.body) {
    throw new Error('服务端未返回可读流。');
  }

  let finalResult: AgentsStreamResult = {
    agentKey:
      (response.headers.get(HEADER_AGENT_KEY) as AgentsStreamResult['agentKey']) ??
      'text',
    conversationId:
      response.headers.get(HEADER_CONVERSATION_ID) ?? options.conversationId,
    payload: null,
  };

  for await (const streamEvent of XStream({
    readableStream: response.body,
  })) {
    const normalized = normalizeSseEvent(streamEvent as AgentsSseEvent);
    if (!normalized) {
      continue;
    }

    if (normalized.event === 'chunk') {
      const chunkData = parseJsonRecord(normalized.data);
      const chunkText = readStringField(chunkData, 'chunk');
      if (chunkText) {
        options.onChunk?.(chunkText);
      }
      continue;
    }

    if (normalized.event === 'meta') {
      const metaData = parseJsonRecord(normalized.data);
      const metaConversationId = readStringField(metaData, 'conversationId');
      if (metaConversationId) {
        finalResult = {
          ...finalResult,
          conversationId: metaConversationId,
        };
      }
      continue;
    }

    if (normalized.event === 'error') {
      const errorData = parseJsonRecord(normalized.data);
      const message = readStringField(errorData, 'message');
      throw new Error(message || '办公任务处理失败，请稍后再试。');
    }

    if (normalized.event === 'done') {
      const doneData = parseJsonRecord(normalized.data);
      finalResult = {
        agentKey:
          (readStringField(doneData, 'agentKey') as AgentsStreamResult['agentKey']) ||
          finalResult.agentKey,
        conversationId:
          readStringField(doneData, 'conversationId') ||
          finalResult.conversationId,
        payload: resolveDonePayload(doneData),
      };
    }
  }

  return finalResult;
}

export async function fetchAgentConversations(
  agentKey: string,
  page = 1,
  pageSize = 20,
): Promise<AgentsConversationSummary[]> {
  const response = await fetch(
    `${AGENTS_CONVERSATIONS_ENDPOINT}?agentKey=${encodeURIComponent(agentKey)}&page=${page}&pageSize=${pageSize}`,
  );
  if (!response.ok) {
    throw new Error('获取历史会话失败');
  }
  const body = (await response.json()) as
    | AgentApiEnvelope<AgentsConversationSummary[]>
    | AgentsConversationSummary[];

  return Array.isArray(body) ? body : (body.data ?? []);
}

export async function fetchConversationMessages(
  conversationId: string,
): Promise<AgentsConversationMessage[]> {
  const response = await fetch(
    `${AGENTS_CONVERSATIONS_ENDPOINT}/${conversationId}/messages`,
  );
  if (!response.ok) {
    throw new Error('获取会话消息失败');
  }
  const body = (await response.json()) as
    | AgentApiEnvelope<AgentsConversationMessage[]>
    | AgentsConversationMessage[];

  return Array.isArray(body) ? body : (body.data ?? []);
}

/**
 * 更新历史会话标题。
 *
 * @param conversationId 会话 ID。
 * @param title 新标题。
 * @returns 更新后的会话对象。
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<AgentsConversationSummary | null> {
  const response = await fetch(
    `${AGENTS_CONVERSATIONS_ENDPOINT}/${conversationId}/title`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    },
  );

  if (!response.ok) {
    throw new Error('重命名会话失败');
  }

  const body = (await response.json()) as
    | AgentApiEnvelope<AgentsConversationSummary>
    | AgentsConversationSummary;

  if ('id' in body) {
    return body;
  }

  return body.data ?? null;
}

/**
 * 删除历史会话（软删除）。
 *
 * @param conversationId 会话 ID。
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${AGENTS_CONVERSATIONS_ENDPOINT}/${conversationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('删除会话失败');
  }
}

/**
 * Builds a readable error message from a failed agents response.
 *
 * @param response Failed fetch response.
 * @returns Message text for chat UI.
 */
async function resolveErrorMessage(response: Response): Promise<string> {
  const fallback = `办公 Agent 请求失败（${response.status}）。`;

  try {
    const contentType = response.headers.get('Content-Type') ?? '';

    if (contentType.includes('application/json')) {
      const body = (await response.json()) as { message?: string };
      return body.message ?? fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

/**
 * 标准化 XStream 解析出的 SSE 事件。
 *
 * @param streamEvent XStream 原始事件对象。
 * @returns 标准化事件，不可用时返回 null。
 */
function normalizeSseEvent(
  streamEvent: AgentsSseEvent,
): { data: string; event: string } | null {
  const event = streamEvent.event?.trim();
  const data = streamEvent.data?.trim();
  if (!event || !data) {
    return null;
  }

  return {
    data,
    event,
  };
}

/**
 * 将 JSON 字符串解析为对象，失败时返回空对象。
 *
 * @param value JSON 字符串。
 * @returns 解析后的对象。
 */
function parseJsonRecord(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * 从对象字段中读取字符串值。
 *
 * @param source 来源对象。
 * @param key 字段名。
 * @returns 字段字符串值。
 */
function readStringField(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

/**
 * 从对象字段中读取对象值。
 *
 * @param source 来源对象。
 * @param key 字段名。
 * @returns 对象字段值。
 */
function readRecordField(
  source: Record<string, unknown>,
  key: string,
): Record<string, unknown> | undefined {
  const value = source[key];
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

/**
 * 解析 done 事件中的结构化 payload。
 *
 * @param source done 事件数据。
 * @returns 标准化 payload。
 */
function resolveDonePayload(
  source: Record<string, unknown>,
): AgentsStreamResult['payload'] {
  const payload = readRecordField(source, 'payload');
  if (!payload) {
    return null;
  }

  const type = readStringField(payload, 'type');
  const answer = readStringField(payload, 'answer');
  const ext = readRecordField(payload, 'ext');
  if (!type || !answer || !ext) {
    return null;
  }

  return payload as unknown as AgentsStreamResult['payload'];
}
