import type { AgentWorkbenchConfig } from '../../config/types';

export const emailConfig: AgentWorkbenchConfig = {
  agentKey: 'email',
  assistantGreeting:
    '你好，我是邮件 Agent。告诉我收件人、主题和目标，我会直接帮你起草或继续补全邮件。',
  badge: 'Email Agent',
  description:
    '固定路由到 email 子 Agent，专注邮件起草、补参确认和发送前预览。',
  helperBody:
    '适合写正式邮件、补充收件人和主题、预览正文，并保持当前邮件上下文连续处理。',
  helperTitle: '邮件场景',
  highlights: ['邮件草稿生成', '补参确认', '发送前预览'],
  navLabel: '邮件工作台',
  placeholder:
    '请输入邮件任务，例如：给产品团队发一封周会调整通知，语气正式一些',
  route: '/email',
  suggestedQuestions: [
    '给产品团队发一封周会延期通知，语气正式一些',
    '帮我回复客户邮件，说明本周五前交付测试环境',
    '写一封内部邮件，汇报这个月的里程碑进展',
  ],
  theme: {
    accent: '#9a3412',
    accentSoft: '#ffedd5',
    accentStrong: '#7c2d12',
    heroBackground: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 44%, #fb923c 100%)',
    pageBackground:
      'radial-gradient(circle at 18% 10%, rgba(251, 146, 60, 0.18), transparent 30%), radial-gradient(circle at 86% 16%, rgba(253, 186, 116, 0.22), transparent 30%), linear-gradient(180deg, #fff7ed 0%, #f8fafc 100%)',
    panelBackground: '#fff7ed',
    surface: '#ffffff',
  },
  title: '邮件业务工作台',
};
