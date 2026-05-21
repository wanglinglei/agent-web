export type AgentsMessageRole = 'assistant' | 'user';

export type AgentsMessageStatus = 'error' | 'loading' | 'sent' | 'streaming';
export type AgentsAgentKey = 'boundary-svg' | 'email' | 'text' | 'weather';
export type AgentsPreferredAgentKey = Exclude<AgentsAgentKey, 'text'>;
export type AgentsMessageRenderType = 'email' | 'svg' | 'text';
export interface AgentsMessageRenderMeta {
  emailPreview?: string;
  emailSubject?: string;
  renderType: AgentsMessageRenderType;
  svgFileName?: string;
  svgSummary?: string;
  svgText?: string;
}

export interface AgentsChatMessage {
  content: string;
  createdAt: number;
  id: string;
  renderMeta?: AgentsMessageRenderMeta;
  role: AgentsMessageRole;
  status: AgentsMessageStatus;
}

export interface AgentsConversationSummary {
  id: string;
  title?: string;
  updatedAt: string;
}

export interface AgentsConversationMessage {
  content: string;
  createdAt: string;
  id: string;
  metadata?: {
    renderMeta?: AgentsMessageRenderMeta;
  };
  role: AgentsMessageRole;
  status: AgentsMessageStatus;
}

export interface AgentApiEnvelope<T> {
  code?: number;
  data?: T;
  feature?: string;
  success?: boolean;
}

export interface AgentsStreamRequest {
  agentKey?: AgentsPreferredAgentKey;
  conversationId?: string;
  message: string;
}

export interface AgentsStreamOptions extends AgentsStreamRequest {
  onChunk?: (chunk: string) => void;
  onDone?: (result: AgentsStreamResult) => void;
  onMeta?: (meta: AgentsStreamMeta) => void;
  signal?: AbortSignal;
}

export type AgentsSseEventName = 'chunk' | 'done' | 'error' | 'meta';

export interface AgentsSseEvent {
  data?: string;
  event?: AgentsSseEventName | string;
  id?: string;
  retry?: string;
}

export interface AgentsStreamMeta {
  conversationId?: string;
  preferredAgentKey?: AgentsPreferredAgentKey | null;
}

export interface AgentsStreamResult {
  agentKey: AgentsAgentKey;
  conversationId?: string;
}
