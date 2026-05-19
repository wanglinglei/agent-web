<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  config: any;
  modelValue: string;
  isSending: boolean;
  errorMessage: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
}>();

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
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
</script>

<template>
  <form class="composer-panel" @submit.prevent="emit('submit')">
    <p v-if="errorMessage" class="error-banner">
      {{ errorMessage }}
    </p>

    <div class="composer-box">
      <div class="composer-actions">
        <button type="button" class="action-btn">
          <span class="icon">+</span>
        </button>
        <button type="button" class="action-btn">
          <span class="icon">⚡️</span> 快速
        </button>
      </div>
      
      <div class="input-wrapper">
        <textarea
          v-model="inputValue"
          rows="1"
          :placeholder="config.placeholder || '发消息...'"
          class="composer-input"
          @keydown="handleTextareaKeydown"
        />
      </div>

      <div class="composer-actions right">
        <button
          type="submit"
          class="composer-submit"
          :disabled="!canSubmit"
        >
          <span class="icon">↑</span>
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.composer-panel {
  padding: 0 1.35rem 1.35rem;
  flex-shrink: 0;
}

.error-banner {
  background: #fef2f2;
  border-radius: 1rem;
  color: #b91c1c;
  margin: 0 0 0.8rem;
  padding: 0.9rem 1rem;
}

.composer-box {
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

.composer-box:focus-within {
  border-color: #cbd5e1;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
}

.composer-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}

.composer-input {
  background: transparent;
  border: 0;
  color: #172033;
  width: 100%;
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  outline: none;
  resize: none;
  padding: 0;
  height: 1.5rem;
}

.composer-input::placeholder {
  color: #94a3b8;
}

.composer-submit {
  background: #f1f5f9;
  border: 0;
  border-radius: 50%;
  color: #94a3b8;
  width: 2.2rem;
  height: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.composer-submit:not(:disabled) {
  background: #0f172a;
  color: white;
}

.composer-submit:not(:disabled):hover {
  background: #1e293b;
}

@media (max-width: 760px) {
  .composer-box {
    flex-wrap: wrap;
    border-radius: 1.5rem;
    padding: 0.75rem;
  }
  
  .input-wrapper {
    width: 100%;
    order: -1;
    margin-bottom: 0.5rem;
  }
}
</style>
