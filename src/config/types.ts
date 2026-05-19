import type { AgentsPreferredAgentKey } from '../types/agents';

export interface AgentWorkbenchTheme {
  accent: string;
  accentSoft: string;
  accentStrong: string;
  heroBackground: string;
  pageBackground: string;
  panelBackground: string;
  surface: string;
}

export interface AgentWorkbenchConfig {
  agentKey: AgentsPreferredAgentKey;
  assistantGreeting: string;
  badge: string;
  description: string;
  helperBody: string;
  helperTitle: string;
  highlights: string[];
  navLabel: string;
  placeholder: string;
  route: string;
  suggestedQuestions: string[];
  theme: AgentWorkbenchTheme;
  title: string;
}
