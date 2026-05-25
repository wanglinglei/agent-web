import type { AgentWorkbenchConfig } from "../../config/types";

export const templateDataConfig: AgentWorkbenchConfig = {
  agentKey: "template-data",
  assistantGreeting: "",
  badge: "Template Data Agent",
  description:
    "固定路由到 template-data 子 Agent，适合批量生成人员模板数据与语义化 patch 修改。",
  helperBody:
    "支持“先生成后修改”的结构化流程：首轮按人生成模板项，二轮根据自然语言只返回补丁。",
  helperTitle: "模板扩展场景",
  highlights: ["按人批量生成", "仅填空字段", "语义化批量修改"],
  navLabel: "模板扩展工作台",
  placeholder:
    "可直接输入 JSON 请求，也可在下方表单生成请求，例如：上传文档后生成人员评价模板",
  route: "/template-data",
  suggestedQuestions: [
    "根据示例文档和名单，生成每个同学的评价模板",
    "把所有人的评价改为优秀，只返回 patch",
    "把前三位同学的评价改为良好",
  ],
  theme: {
    accent: "#7c3aed",
    accentSoft: "#ede9fe",
    accentStrong: "#5b21b6",
    heroBackground:
      "linear-gradient(135deg, #5b21b6 0%, #7c3aed 48%, #a78bfa 100%)",
    pageBackground:
      "radial-gradient(circle at 12% 18%, rgba(139, 92, 246, 0.16), transparent 28%), radial-gradient(circle at 82% 10%, rgba(196, 181, 253, 0.2), transparent 30%), linear-gradient(180deg, #f5f3ff 0%, #f8fafc 100%)",
    panelBackground: "#f5f3ff",
    surface: "#ffffff",
  },
  title: "模板扩展工作台",
};
