import type { AgentWorkbenchConfig } from '../../config/types';

export const weatherConfig: AgentWorkbenchConfig = {
  agentKey: 'weather',
  assistantGreeting:
    '你好，我是天气 Agent。告诉我城市、日期或出行场景，我会直接查询天气并给出建议。',
  badge: 'Weather Agent',
  description:
    '固定路由到 weather 子 Agent，适合天气查询、连续追问和出行场景建议。',
  helperBody:
    '适合处理城市天气、日期追问、穿衣建议和通勤判断，不再混入其他业务能力。',
  helperTitle: '天气场景',
  highlights: ['城市与日期解析', '连续会话追问', '通勤与出行建议'],
  navLabel: '天气工作台',
  placeholder: '请输入天气任务，例如：后天上海会下雨吗，适合骑车去公司吗？',
  route: '/weather',
  suggestedQuestions: [
    '帮我看下今天北京天气，并给一个出行建议',
    '后天上海会下雨吗，适合骑车通勤吗',
    '深圳周末气温如何，适合带孩子户外活动吗',
  ],
  theme: {
    accent: '#0f766e',
    accentSoft: '#ccfbf1',
    accentStrong: '#0b5f57',
    heroBackground: 'linear-gradient(135deg, #134e4a 0%, #0f766e 48%, #14b8a6 100%)',
    pageBackground:
      'radial-gradient(circle at 12% 18%, rgba(20, 184, 166, 0.16), transparent 28%), radial-gradient(circle at 82% 10%, rgba(125, 211, 252, 0.18), transparent 30%), linear-gradient(180deg, #edfdfa 0%, #f8fafc 100%)',
    panelBackground: '#f0fdfa',
    surface: '#ffffff',
  },
  title: '天气业务工作台',
};
