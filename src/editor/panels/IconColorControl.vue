<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/editor/core/store'
import type { PMNode } from '@/editor/core/schema'
import { analyzeSvgColors, decodeSvgDataUrl, normalizeColor } from '@/editor/core/svgColor'

const props = defineProps<{ node: PMNode }>()
const store = useEditorStore()

const bulkColor = ref('#2563eb')

const decoded = computed(() => decodeSvgDataUrl(String(props.node.props.svg ?? '')))
const analysis = computed(() => (decoded.value?.kind === 'svg' ? analyzeSvgColors(decoded.value.source) : null))
const iconColor = computed(() => String(props.node.props.iconColor ?? ''))
const colorMap = computed(() => (props.node.props.colorMap as Record<string, string> | undefined) ?? {})
const hasOverride = computed(() => Boolean(iconColor.value) || Object.keys(colorMap.value).length > 0)

function setIconColor(value: string) {
  store.mutate(() => store.updateNodeProps(props.node.id, { iconColor: value }))
}

function setColor(original: string, value: string) {
  store.mutate(() => store.updateNodeProps(props.node.id, { colorMap: { ...colorMap.value, [normalizeColor(original)]: value } }))
}

function applyBulk(value: string) {
  const next: Record<string, string> = {}
  for (const color of analysis.value?.colors ?? []) next[normalizeColor(color)] = value
  store.mutate(() => store.updateNodeProps(props.node.id, { colorMap: next }))
}

function reset() {
  store.mutate(() => store.updateNodeProps(props.node.id, { iconColor: '', colorMap: {} }))
}
</script>

<template>
  <template v-if="analysis && analysis.mode === 'mono'">
    <label class="field">
      <span class="field__label">图标颜色</span>
      <input
        class="field__control field__control--color"
        type="color"
        :value="iconColor || analysis.colors[0] || '#000000'"
        @input="setIconColor(($event.target as HTMLInputElement).value)"
      />
    </label>
  </template>

  <div v-else-if="analysis && analysis.mode === 'multi'" class="icon-colors">
    <div v-for="color in analysis.colors" :key="color" class="icon-color-row">
      <span class="icon-color-swatch" :style="{ background: color }" />
      <span class="icon-color-name">{{ color }}</span>
      <input
        class="field__control field__control--color"
        type="color"
        :value="colorMap[normalizeColor(color)] || color"
        @input="setColor(color, ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div class="icon-color-bulk">
      <input v-model="bulkColor" class="field__control field__control--color" type="color" />
      <button class="btn-ghost" type="button" @click="applyBulk(bulkColor)">整体单色化</button>
    </div>
  </div>

  <p v-else-if="analysis" class="prop-tip">该图标含样式表或位图，无法逐色修改。</p>
  <p v-else class="prop-tip">位图不支持改色。</p>

  <button v-if="hasOverride" class="btn-ghost icon-color-reset" type="button" @click="reset">重置改色</button>
</template>
