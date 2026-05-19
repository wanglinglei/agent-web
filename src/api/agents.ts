import type { AgentsStreamOptions, AgentsStreamResult } from '../types/agents';

const AGENTS_STREAM_ENDPOINT = '/ai-agent/agents/query/stream';
const AGENTS_CONVERSATIONS_ENDPOINT = '/ai-agent/agents/conversations';
const HEADER_CONVERSATION_ID = 'X-Conversation-Id';
const HEADER_AGENT_KEY = 'X-Agents-Agent-Key';

interface UnifiedSuccessResponse<T> {
  code?: number;
  data?: T;
  feature?: string;
  success: boolean;
}

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
      Accept: 'application/json',
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

  const conversationId =
    response.headers.get(HEADER_CONVERSATION_ID) ?? options.conversationId;
  const body = (await response.json()) as UnifiedSuccessResponse<{
    agentKey?: AgentsStreamResult['agentKey'];
    conversationId?: string;
    payload?: AgentsStreamResult['payload'];
  }>;
  const data = body.data ?? {};

  return {
    agentKey:
      data.agentKey ??
      (response.headers.get(HEADER_AGENT_KEY) as AgentsStreamResult['agentKey']) ??
      'text',
    conversationId: data.conversationId ?? conversationId,
    payload: data.payload ?? null,
  };
}

export async function fetchAgentConversations(agentKey: string, page: number = 1, pageSize: number = 20): Promise<any[]> {
  const response = await fetch(`${AGENTS_CONVERSATIONS_ENDPOINT}?agentKey=${agentKey}&page=${page}&pageSize=${pageSize}`);
  if (!response.ok) {
    throw new Error('获取历史会话失败');
  }
  const body = await response.json();
  return body.data || body; // Depending on nestjs interceptor
}

export async function fetchConversationMessages(conversationId: string): Promise<any[]> {
  const response = await fetch(`${AGENTS_CONVERSATIONS_ENDPOINT}/${conversationId}/messages`);
  if (!response.ok) {
    throw new Error('获取会话消息失败');
  }
  const body = await response.json();
  return body.data || body;
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
): Promise<any> {
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

  const body = await response.json();
  return body.data || body;
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
