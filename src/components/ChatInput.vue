<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
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

const textareaRef = ref<HTMLTextAreaElement>();

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const canSubmit = computed(
  () => inputValue.value.trim().length > 0 && !props.isSending,
);

function handleTextareaKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || event.shiftKey) {
    return;
  }

  event.preventDefault();
  emit('submit');
}

function syncTextareaHeight(): void {
  if (!textareaRef.value) {
    return;
  }

  textareaRef.value.style.height = '0px';
  textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 240)}px`;
}

watch(
  () => props.modelValue,
  async () => {
    await nextTick();
    syncTextareaHeight();
  },
);

onMounted(() => {
  syncTextareaHeight();
});
</script>

<template>
  <form class="composer-panel" @submit.prevent="emit('submit')">
    <p v-if="errorMessage" class="error-banner">
      {{ errorMessage }}
    </p>

    <div class="composer-box">
      <div class="composer-heading">
        <p class="composer-title">{{ config.helperTitle }}</p>
        <p class="composer-hint">Enter 发送，Shift + Enter 换行</p>
      </div>

      <textarea
        ref="textareaRef"
        v-model="inputValue"
        rows="1"
        :placeholder="config.placeholder || '发消息...'"
        class="composer-input"
        @keydown="handleTextareaKeydown"
      />

      <div class="composer-actions">
        <button
          v-if="isSending"
          type="button"
          class="action-btn action-btn-secondary"
          @click="emit('cancel')"
        >
          停止
        </button>
        <button
          type="submit"
          class="action-btn action-btn-primary"
          :disabled="!canSubmit"
        >
          {{ isSending ? '处理中...' : '发送' }}
        </button>
      </div>
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

.composer-heading {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.composer-title,
.composer-hint {
  margin: 0;
}

.composer-title {
  color: #172033;
  font-size: 0.84rem;
  font-weight: 700;
}

.composer-hint {
  color: #64748b;
  font-size: 0.72rem;
}

.composer-input {
  background: transparent;
  border: 0;
  color: #172033;
  font: inherit;
  line-height: 1.55;
  max-height: 15rem;
  min-height: 2.6rem;
  outline: none;
  overflow-y: auto;
  padding: 0;
  resize: none;
  width: 100%;
}

.composer-input::placeholder {
  color: #94a3b8;
}

.composer-actions {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
}

.action-btn {
  border: 0;
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.action-btn-secondary {
  background: #e2e8f0;
  color: #334155;
}

.action-btn-primary {
  background: #0f172a;
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
}

@media (max-width: 760px) {
  .composer-panel {
    padding: 0 1rem 1rem;
  }

  .composer-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .composer-actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
  }
}
</style>
