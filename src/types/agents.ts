export type AgentsMessageRole = 'assistant' | 'user';

export type AgentsMessageStatus = 'error' | 'loading' | 'sent' | 'streaming';
export type AgentsAgentKey = 'boundary-svg' | 'email' | 'text' | 'weather';
export type AgentsPreferredAgentKey = Exclude<AgentsAgentKey, 'text'>;
export type AgentsMessageRenderType = 'email' | 'svg' | 'text';
export type AgentsPayloadType = 'email' | 'svg' | 'text';

export interface AgentsBoundarySvgPayload {
  answer: string;
  ext: {
    fileName: string;
    svg?: string;
  };
  type: 'svg';
}

export interface AgentsEmailPayload {
  answer: string;
  ext: {
    body?: string;
    cc?: string[];
    preview: string;
    subject: string;
    to?: string[];
  };
  type: 'email';
}

export interface AgentsTextPayload {
  answer: string;
  ext: Record<string, never>;
  type: 'text';
}

export type AgentsStructuredPayload =
  | AgentsBoundarySvgPayload
  | AgentsEmailPayload
  | AgentsTextPayload;

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
  signal?: AbortSignal;
}

export interface AgentsStreamResult {
  agentKey: AgentsAgentKey;
  conversationId?: string;
  payload: AgentsStructuredPayload | null;
}
