<script setup lang="ts">
import { HOME_PAGE_CARD_LIST } from './constant';
import type { HomePageCardConfig } from './constant';

function resolveCardStyle(config: HomePageCardConfig): Record<string, string> {
  return {
    '--home-card-accent': config.theme.accent,
    '--home-card-accent-soft': config.theme.accentSoft,
    '--home-card-accent-strong': config.theme.accentStrong,
    '--home-card-hero': config.theme.heroBackground,
  };
}
</script>

<template>
  <main class="agents-home">
    <div class="home-glow home-glow-left" />
    <div class="home-glow home-glow-right" />

    <section class="home-shell">
      <header class="home-hero">
        <div class="home-copy">
          <p class="home-kicker">Agent Web</p>
          <h1>Agent 工作台</h1>
          <p class="home-description">
            选择一个子 Agent 直接进入对应业务页。天气、邮件、边界 SVG、模板扩展
            现在独立运行，并固定携带对应 <code>agentKey</code> 调用后端。
          </p>
        </div>

        <div class="home-panel">
          <p class="home-panel-label">当前前端策略</p>
          <p class="home-panel-title">首页分发 + 子 Agent 独立业务页</p>
          <p class="home-panel-copy">
            保留后端统一编排兜底能力，但主入口改成前端明确路由。
          </p>
        </div>
      </header>

      <section class="home-grid">
        <RouterLink
          v-for="agent in HOME_PAGE_CARD_LIST"
          :key="agent.route"
          :to="agent.route"
          class="agent-card"
          :style="resolveCardStyle(agent)"
        >
          <div class="agent-card-top">
            <p class="agent-card-badge">{{ agent.badge }}</p>
            <span class="agent-card-arrow">进入</span>
          </div>
          <h2>{{ agent.title }}</h2>
          <p class="agent-card-description">{{ agent.description }}</p>
          <div class="agent-card-tags">
            <span
              v-for="highlight in agent.highlights"
              :key="highlight"
              class="agent-card-tag"
            >
              {{ highlight }}
            </span>
          </div>
          <div class="agent-card-footer">
            <span>{{ agent.navLabel }}</span>
            <strong>{{ agent.route }}</strong>
          </div>
        </RouterLink>
      </section>

      <section class="home-note-grid">
        <article class="home-note">
          <p class="home-note-title">页面职责</p>
          <p>
            每个业务页都复用同一套聊天工作台，但会带不同的业务文案、示例任务和固定
            agentKey。
          </p>
        </article>
        <article class="home-note">
          <p class="home-note-title">会话隔离</p>
          <p>
            不同子 Agent 页面独立开启和重置会话，减少统一编排时上下文串线的问题。
          </p>
        </article>
        <article class="home-note">
          <p class="home-note-title">接口保持不变</p>
          <p>
            仍然走 <code>/ai-agent/agents/query/stream</code>，只是由前端明确指定目标子
            Agent。
          </p>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.agents-home {
  background:
    radial-gradient(circle at 8% 12%, rgba(251, 191, 36, 0.18), transparent 24%),
    radial-gradient(circle at 85% 10%, rgba(96, 165, 250, 0.18), transparent 26%),
    linear-gradient(180deg, #fffaf0 0%, #f8fafc 100%);
  min-height: 100vh;
  overflow: hidden;
  position: relative;
}

.home-glow {
  border-radius: 999px;
  filter: blur(20px);
  position: absolute;
}

.home-glow-left {
  background: rgba(251, 191, 36, 0.18);
  height: 18rem;
  left: -4rem;
  top: 2rem;
  width: 18rem;
}

.home-glow-right {
  background: rgba(96, 165, 250, 0.2);
  height: 22rem;
  right: -4rem;
  top: 5rem;
  width: 22rem;
}

.home-shell {
  margin: 0 auto;
  max-width: 1240px;
  padding: 1.05rem 1rem 1.55rem;
  position: relative;
  z-index: 1;
}

.home-hero {
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92)),
    linear-gradient(120deg, #f59e0b 0%, #2563eb 100%);
  border-radius: 1.85rem;
  color: white;
  display: grid;
  align-items: end;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) 280px;
  min-height: 220px;
  padding: 1.2rem 1.35rem;
  position: relative;
  box-shadow: 0 32px 80px rgba(15, 23, 42, 0.18);
}

.home-hero::after {
  background:
    linear-gradient(125deg, rgba(255, 255, 255, 0.08), transparent 42%),
    radial-gradient(circle at 100% 0, rgba(255, 255, 255, 0.16), transparent 36%);
  content: '';
  inset: 0;
  position: absolute;
}

.home-copy,
.home-panel {
  position: relative;
  z-index: 1;
}

.home-kicker {
  font-size: 0.76rem;
  letter-spacing: 0.18em;
  margin: 0;
  opacity: 0.72;
  text-transform: uppercase;
}

.home-copy h1 {
  font-size: clamp(2.1rem, 3.3vw, 3rem);
  line-height: 1.08;
  margin: 0.42rem 0 0;
  max-width: none;
}

.home-description {
  font-size: 0.9rem;
  line-height: 1.62;
  margin: 0.72rem 0 0;
  max-width: 36rem;
  opacity: 0.88;
}

.home-description code {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  padding: 0.15rem 0.45rem;
}

.home-panel {
  align-self: end;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 1.3rem;
  max-width: 260px;
  padding: 0.8rem 0.9rem;
  backdrop-filter: blur(14px);
}

.home-panel-label {
  font-size: 0.74rem;
  margin: 0;
  opacity: 0.72;
}

.home-panel-title {
  font-size: 0.92rem;
  font-weight: 700;
  margin: 0.35rem 0 0;
}

.home-panel-copy {
  font-size: 0.84rem;
  line-height: 1.55;
  margin: 0.5rem 0 0;
  opacity: 0.86;
}

.home-grid {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 0.95rem;
}

.agent-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82)),
    white;
  border: 1px solid color-mix(in srgb, var(--home-card-accent) 16%, white 84%);
  border-radius: 1.4rem;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  color: #172033;
  display: flex;
  flex-direction: column;
  gap: 0.82rem;
  min-height: 272px;
  overflow: hidden;
  padding: 1rem;
  position: relative;
  text-decoration: none;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.agent-card::before {
  background: var(--home-card-hero);
  content: '';
  height: 0.35rem;
  inset: 0 0 auto;
  position: absolute;
}

.agent-card:hover {
  border-color: color-mix(in srgb, var(--home-card-accent) 42%, white 58%);
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.14);
  transform: translateY(-2px);
}

.agent-card-top {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-top: 0.15rem;
}

.agent-card-badge {
  color: var(--home-card-accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.agent-card-arrow {
  background: color-mix(in srgb, var(--home-card-accent-soft) 70%, white 30%);
  border-radius: 0.9rem;
  color: var(--home-card-accent-strong);
  font-size: 0.74rem;
  padding: 0.28rem 0.62rem;
}

.agent-card h2 {
  font-size: 1.42rem;
  line-height: 1.18;
  margin: 0;
}

.agent-card-description {
  color: #475569;
  font-size: 0.94rem;
  line-height: 1.66;
  margin: 0;
}

.agent-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: auto;
}

.agent-card-tag {
  background: color-mix(in srgb, var(--home-card-accent-soft) 68%, white 32%);
  border-radius: 0.9rem;
  color: var(--home-card-accent-strong);
  font-size: 0.74rem;
  padding: 0.34rem 0.58rem;
}

.agent-card-footer {
  border-top: 1px solid color-mix(in srgb, var(--home-card-accent) 12%, white 88%);
  color: #334155;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  margin-top: 0.15rem;
  padding-top: 0.78rem;
  font-size: 0.9rem;
}

.agent-card-footer strong {
  color: var(--home-card-accent-strong);
  font-size: 0.86rem;
  word-break: break-all;
}

.home-note-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 0.9rem;
}

.home-note {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 1.15rem;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.66;
  padding: 0.85rem 0.92rem;
}

.home-note-title {
  color: #172033;
  font-size: 0.88rem;
  font-weight: 700;
  margin: 0 0 0.42rem;
}

.home-note code {
  background: #e2e8f0;
  border-radius: 999px;
  color: #0f172a;
  padding: 0.1rem 0.4rem;
}

@media (max-width: 1080px) {
  .home-hero,
  .home-grid,
  .home-note-grid {
    grid-template-columns: 1fr;
  }

  .home-hero {
    min-height: auto;
  }

  .home-panel {
    max-width: none;
  }
}

@media (max-width: 760px) {
  .home-shell {
    padding: 0.9rem 0.75rem 1.25rem;
  }

  .home-hero {
    border-radius: 1.35rem;
    padding: 1.1rem;
  }

  .home-copy h1 {
    font-size: clamp(1.85rem, 10vw, 2.5rem);
    max-width: none;
  }

  .agent-card {
    min-height: 0;
    padding: 0.9rem;
  }
}
</style>
