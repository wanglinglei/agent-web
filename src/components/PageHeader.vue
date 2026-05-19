<script setup lang="ts">
import { IconHome } from '../assets/svg';

const props = defineProps<{
  config: any;
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
        <h1>{{ config.title }}</h1>
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
  color: white;
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  padding: 1rem 1.75rem;
  position: relative;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.1);
  margin-bottom: 1.25rem;
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

.hero-copy {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.hero-title-group {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.crumb-link {
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  padding: 0.3rem 0.8rem;
  text-decoration: none;
}

.icon-home {
  display: flex;
  align-items: center;
  width: 14px;
  height: 14px;
}

.icon-home :deep(svg) {
  width: 100%;
  height: 100%;
}

.hero-badge {
  letter-spacing: 0.1em;
  margin: 0;
  opacity: 0.8;
  text-transform: uppercase;
  font-size: 0.7rem;
  padding-right: 1rem;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}

.hero-copy h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.hero-description {
  display: none;
}

.hero-meta {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 0.5rem 1rem;
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  gap: 1rem;
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
  font-size: 0.8rem;
  margin: 0;
  opacity: 0.9;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  padding-left: 1rem;
}
</style>
