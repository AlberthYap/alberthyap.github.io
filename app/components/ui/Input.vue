<script setup lang="ts">
import { computed, useId } from 'vue'

interface Props {
  /** v-model binding. */
  modelValue: string
  /** HTML input type. */
  type?: 'text' | 'email' | 'password' | 'url' | 'search' | 'tel' | 'number'
  /** Visible label REQUIRED for screen readers (paired via for/id). */
  label: string
  /** Placeholder text. Hints expected shape; never a label replacement. */
  placeholder?: string
  /** Disabled state. */
  disabled?: boolean
  /** Error message. Marks `aria-invalid="true"` and announces the message. */
  error?: string
  /** Helper text shown below the input, distinct from `error`. */
  hint?: string
  /** Adds an asterisk to the label and `aria-required` to the input. */
  required?: boolean
  /** Override the auto-generated id when wiring multiple inputs with explicit labels. */
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
})

const model = defineModel<string>({ required: true })

const autoId = useId()
const inputId = computed(() => props.id ?? autoId)
const hintId = computed(() => `${inputId.value}-hint`)
const errorId = computed(() => `${inputId.value}-error`)

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.hint) ids.push(hintId.value)
  if (props.error) ids.push(errorId.value)
  return ids.length > 0 ? ids.join(' ') : undefined
})

const inputClasses = computed(() => [
  'h-11 rounded-md border bg-surface px-4 text-base text-text',
  'placeholder:text-muted',
  'transition-colors duration-[var(--motion-micro)] ease-[var(--motion-easing)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  'disabled:cursor-not-allowed disabled:opacity-50',
  props.error
    ? 'border-danger focus-visible:ring-danger'
    : 'border-border focus-visible:ring-primary focus-visible:border-primary',
])

function onInput(event: Event) {
  // Assigning to the model ref triggers `update:modelValue` automatically via
  // defineModel — no manual emit needed (avoids double-fire).
  model.value = (event.target as HTMLInputElement).value
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label
      :for="inputId"
      class="text-sm font-medium text-text inline-flex items-center gap-1"
    >
      <span>{{ props.label }}</span>
      <span v-if="props.required" aria-hidden="true" class="text-danger">*</span>
    </label>
    <input
      :id="inputId"
      :type="props.type"
      :value="model"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :required="props.required"
      :aria-invalid="props.error ? 'true' : undefined"
      :aria-describedby="describedBy"
      :aria-required="props.required ? 'true' : undefined"
      :class="inputClasses"
      @input="onInput"
    >
    <p v-if="props.hint" :id="hintId" class="text-xs text-muted">
      {{ props.hint }}
    </p>
    <p v-if="props.error" :id="errorId" role="alert" class="text-xs text-danger">
      {{ props.error }}
    </p>
  </div>
</template>
