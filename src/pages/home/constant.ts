import type { AgentWorkbenchTheme } from '../../config/types';

export interface HomePageCardConfig {
  badge: string;
  description: string;
  highlights: string[];
  navLabel: string;
  route: string;
  theme: AgentWorkbenchTheme;
  title: string;
}

export const HOME_PAGE_CARD_LIST: HomePageCardConfig[] = [
  {
    badge: 'Weather Agent',
    title: '天气查询助手',
    description:
      '聚合天气问答、城市识别与出行建议，适合处理实时天气、穿衣建议和短期行程规划。',
    highlights: ['天气问答', '出行建议', '城市识别'],
    navLabel: '打开天气工作台',
    route: '/weather',
    theme: {
      accent: '#2563eb',
      accentSoft: '#dbeafe',
      accentStrong: '#1d4ed8',
      heroBackground:
        'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(125, 211, 252, 0.18))',
      pageBackground: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)',
      panelBackground:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(239, 246, 255, 0.95))',
      surface: '#ffffff',
    },
  },
  {
    badge: 'Email Agent',
    title: '邮件撰写助手',
    description:
      '用于生成商务邮件、跟进回复和主题建议，减少重复沟通成本并统一表达风格。',
    highlights: ['邮件草拟', '回复优化', '主题建议'],
    navLabel: '打开邮件工作台',
    route: '/email',
    theme: {
      accent: '#f97316',
      accentSoft: '#ffedd5',
      accentStrong: '#ea580c',
      heroBackground:
        'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.18))',
      pageBackground: 'linear-gradient(180deg, #fff7ed 0%, #fffaf5 100%)',
      panelBackground:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 237, 213, 0.95))',
      surface: '#ffffff',
    },
  },
  {
    badge: 'Boundary SVG Agent',
    title: '边界 SVG 助手',
    description:
      '面向行政区边界查询与 SVG 生产，适合快速生成地图边界素材和批量处理图形任务。',
    highlights: ['边界查询', 'SVG 生成', '批量处理'],
    navLabel: '打开 SVG 工作台',
    route: '/boundary-svg',
    theme: {
      accent: '#0f766e',
      accentSoft: '#ccfbf1',
      accentStrong: '#0f766e',
      heroBackground:
        'linear-gradient(135deg, rgba(15, 118, 110, 0.2), rgba(45, 212, 191, 0.18))',
      pageBackground: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%)',
      panelBackground:
        'linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(204, 251, 241, 0.95))',
      surface: '#ffffff',
    },
  },
];
