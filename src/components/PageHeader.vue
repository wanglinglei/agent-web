<script setup lang="ts">
import { IconHome } from '../assets/svg';
import type { AgentWorkbenchConfig } from '../config/types';

defineProps<{
  config: AgentWorkbenchConfig;
}>();
</script>

<template>
  <header class="hero-panel">
    <div class="hero-copy">
      <RouterLink to="/" class="crumb-link">
        <span class="icon-home" v-html="IconHome"></span>
        返回首页
      </RouterLink>
      <div class="hero-title-group">
        <p class="hero-badge">{{ config.badge }}</p>
        <div>
          <h1>{{ config.title }}</h1>
          <p class="hero-description">{{ config.description }}</p>
        </div>
      </div>
    </div>

    <div class="hero-meta">
      <p class="hero-meta-label">固定调用入口</p>
      <p class="hero-meta-value">/ai-agent/agents/query/stream</p>
      <p class="hero-meta-inline">agentKey: {{ config.agentKey }}</p>
    </div>
  </header>
</template>

<style scoped>
.hero-panel {
  align-items: center;
  background: var(--agent-hero-bg);
  border-radius: 1rem;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.1);
  color: white;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  overflow: hidden;
  padding: 1rem 1.75rem;
  position: relative;
}

.hero-panel::after {
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.12), transparent 48%),
    radial-gradient(circle at 100% 0, rgba(255, 255, 255, 0.22), transparent 34%);
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.hero-copy,
.hero-meta {
  position: relative;
  z-index: 1;
}

.hero-copy {
  align-items: center;
  display: flex;
  gap: 1.5rem;
}

.hero-title-group {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
}

.crumb-link {
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  font-size: 0.8rem;
  gap: 0.4rem;
  padding: 0.3rem 0.8rem;
  text-decoration: none;
}

.icon-home {
  align-items: center;
  display: flex;
  height: 14px;
  width: 14px;
}

.icon-home :deep(svg) {
  height: 100%;
  width: 100%;
}

.hero-badge {
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  margin: 0;
  opacity: 0.8;
  padding-right: 1rem;
  text-transform: uppercase;
  white-space: nowrap;
}

.hero-copy h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.hero-description {
  font-size: 0.88rem;
  line-height: 1.65;
  margin: 0.45rem 0 0;
  max-width: 40rem;
  opacity: 0.9;
}

.hero-meta {
  align-items: center;
  backdrop-filter: blur(14px);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
}

.hero-meta-label {
  display: none;
}

.hero-meta-value {
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0;
}

.hero-meta-inline {
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.9;
  padding-left: 1rem;
}

@media (max-width: 1080px) {
  .hero-panel {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
  }

  .hero-copy {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 760px) {
  .hero-panel {
    padding: 1rem;
  }

  .hero-title-group {
    flex-direction: column;
    gap: 0.65rem;
  }

  .hero-badge {
    border-right: 0;
    padding-right: 0;
  }

  .hero-meta {
    align-items: flex-start;
    border-radius: 1rem;
    flex-direction: column;
  }

  .hero-meta-inline {
    border-left: 0;
    padding-left: 0;
  }
}
</style>
