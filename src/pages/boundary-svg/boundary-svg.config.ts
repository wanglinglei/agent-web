import type { AgentWorkbenchConfig } from '../../config/types';

export const boundarySvgConfig: AgentWorkbenchConfig = {
  agentKey: 'boundary-svg',
  assistantGreeting:
    '你好，我是边界 SVG Agent。告诉我城市或行政区名称，我会直接帮你查询并生成 SVG 边界结果。',
  badge: 'Boundary SVG Agent',
  description:
    '固定路由到 boundary-svg 子 Agent，适合行政区边界查询、批量边界生成和 SVG 预览下载。',
  helperBody:
    '适合做行政区边界素材、地图可视化底图和 SVG 文件导出，不再受统一编排干扰。',
  helperTitle: '边界场景',
  highlights: ['行政区边界查询', 'SVG 预览下载', '地图素材生成'],
  navLabel: '边界工作台',
  placeholder:
    '请输入边界任务，例如：查询扬州市边界并生成适合大屏展示的 svg',
  route: '/boundary-svg',
  suggestedQuestions: [
    '请先查一下扬州市边界数据，生成 svg 图片',
    '帮我导出杭州市行政区边界，适合深色底图展示',
    '给我一个南京市边界 svg，线条细一点，颜色更清爽',
  ],
  theme: {
    accent: '#4338ca',
    accentSoft: '#e0e7ff',
    accentStrong: '#312e81',
    heroBackground: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #60a5fa 100%)',
    pageBackground:
      'radial-gradient(circle at 14% 14%, rgba(99, 102, 241, 0.18), transparent 30%), radial-gradient(circle at 84% 12%, rgba(96, 165, 250, 0.2), transparent 30%), linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%)',
    panelBackground: '#eef2ff',
    surface: '#ffffff',
  },
  title: '边界 SVG 工作台',
};
