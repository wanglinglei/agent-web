import type { AgentsStreamOptions, AgentsStreamResult } from '../types/agents';

const AGENTS_STREAM_ENDPOINT = '/ai-agent/agents/query/stream';
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
