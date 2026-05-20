<script setup lang="ts">
import { computed } from 'vue';
import { Sender } from 'ant-design-x-vue';
import type { AgentWorkbenchConfig } from '../config/types';

const props = defineProps<{
  config: AgentWorkbenchConfig;
  errorMessage: string;
  isSending: boolean;
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
  (e: 'cancel'): void;
}>();

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const canSubmit = computed(
  () => inputValue.value.trim().length > 0 && !props.isSending,
);

/**
 * 处理 Sender 提交事件，保持原组件对外契约不变。
 *
 * @returns {void}
 */
function handleSenderSubmit(): void {
  if (!canSubmit.value) {
    return;
  }

  emit('submit');
}
</script>

<template>
  <form class="composer-panel" @submit.prevent="handleSenderSubmit">
    <p v-if="errorMessage" class="error-banner">
      {{ errorMessage }}
    </p>

    <div class="composer-box">
      <div class="composer-header">
        <p class="composer-title">{{ config.helperTitle }}</p>
      </div>
      <Sender
        :value="inputValue"
        :loading="isSending"
        :placeholder="config.placeholder || '发消息...'"
        :submit-type="'enter'"
        :allow-speech="false"
        @change="(value) => emit('update:modelValue', value)"
        @submit="handleSenderSubmit"
        @cancel="emit('cancel')"
      />
      <p class="composer-hint">Enter 发送，Shift + Enter 换行</p>
    </div>
  </form>
</template>

<style scoped>
.composer-panel {
  flex-shrink: 0;
  padding: 0 1.35rem 1rem;
}

.error-banner {
  background: #fef2f2;
  border-radius: 1rem;
  color: #b91c1c;
  margin: 0 0 0.8rem;
  padding: 0.9rem 1rem;
}

.composer-box {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1.4rem;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.7rem 0.9rem;
}

.composer-box:focus-within {
  border-color: color-mix(in srgb, var(--agent-accent) 32%, white 68%);
  box-shadow: 0 6px 26px rgba(15, 23, 42, 0.08);
}

.composer-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.composer-title {
  color: #172033;
  font-size: 0.84rem;
  font-weight: 700;
  margin: 0;
}

.composer-hint {
  color: #64748b;
  font-size: 0.72rem;
  margin: 0.1rem 0 0;
  text-align: right;
}

.composer-box :deep(.ant-sender) {
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
}

.composer-box :deep(.ant-sender:focus-within) {
  border-color: color-mix(in srgb, var(--agent-accent) 32%, white 68%);
}

@media (max-width: 760px) {
  .composer-panel {
    padding: 0 1rem 1rem;
  }
}
</style>
