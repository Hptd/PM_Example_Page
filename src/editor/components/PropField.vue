<script setup lang="ts">
import { ref } from 'vue'
import type { PropField } from '../core/registry'
import IconGlyph from './IconGlyph.vue'
import IconPicker from './IconPicker.vue'

defineProps<{ field: PropField; value: unknown }>()
const emit = defineEmits<{ (e: 'update', value: unknown): void }>()

const pickerOpen = ref(false)

function onText(event: Event) {
  emit('update', (event.target as HTMLInputElement).value)
}

function onNumber(event: Event) {
  const parsed = Number((event.target as HTMLInputElement).value)
  emit('update', Number.isFinite(parsed) ? parsed : 0)
}

function onColor(event: Event) {
  emit('update', (event.target as HTMLInputElement).value)
}

function onBoolean(event: Event) {
  emit('update', (event.target as HTMLInputElement).checked)
}

function onSelect(event: Event) {
  emit('update', (event.target as HTMLSelectElement).value)
}

function onIconPicked(name: string) {
  emit('update', name)
}
</script>

<template>
  <label class="field">
    <span class="field__label">{{ field.label }}</span>

    <textarea
      v-if="field.type === 'textarea'"
      class="field__control"
      :value="(value as string) ?? ''"
      :placeholder="field.placeholder"
      rows="3"
      @change="onText"
    />

    <input
      v-else-if="field.type === 'text'"
      class="field__control"
      type="text"
      :value="(value as string) ?? ''"
      :placeholder="field.placeholder"
      @change="onText"
    />

    <input
      v-else-if="field.type === 'number'"
      class="field__control"
      type="number"
      :value="(value as number) ?? 0"
      :min="field.min"
      :max="field.max"
      :step="field.step"
      @change="onNumber"
    />

    <input
      v-else-if="field.type === 'color'"
      class="field__control field__control--color"
      type="color"
      :value="(value as string) ?? '#000000'"
      @input="onColor"
    />

    <select
      v-else-if="field.type === 'select'"
      class="field__control"
      :value="(value as string) ?? ''"
      @change="onSelect"
    >
      <option v-for="option in field.options" :key="String(option.value)" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <input
      v-else-if="field.type === 'boolean'"
      class="field__checkbox"
      type="checkbox"
      :checked="Boolean(value)"
      @change="onBoolean"
    />

    <button v-else-if="field.type === 'icon'" class="field__icon" @click="pickerOpen = true">
      <icon-glyph v-if="value" :name="String(value)" size="20px" />
      <span class="field__icon-name">{{ value || '选择图标' }}</span>
    </button>

    <icon-picker
      v-if="pickerOpen"
      :set="field.iconSet ?? 'all'"
      :model-value="value as string"
      @update:model-value="onIconPicked"
      @close="pickerOpen = false"
    />
  </label>
</template>
