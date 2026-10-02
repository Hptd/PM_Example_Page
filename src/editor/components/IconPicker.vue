<script setup lang="ts">
import { computed, ref } from 'vue'
import { iconNames } from '../widgets/icons'
import IconGlyph from './IconGlyph.vue'

const props = defineProps<{
  set: 'tabler' | 'simple-icons' | 'all'
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'close'): void
}>()

const keyword = ref('')
const activeSet = ref<'tabler' | 'simple-icons'>(props.set === 'all' ? 'tabler' : props.set)

const matches = computed(() => {
  const kw = keyword.value.trim().toLowerCase().replace(/^[^:]*:/, '')
  const names = iconNames(activeSet.value)
  const filtered = kw ? names.filter((name) => name.slice(name.indexOf(':') + 1).includes(kw)) : names
  return filtered.slice(0, 240)
})

function choose(name: string) {
  emit('update:modelValue', name)
  emit('close')
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="icon-picker">
      <header class="icon-picker__head">
        <div v-if="set === 'all'" class="icon-picker__tabs">
          <button :class="{ active: activeSet === 'tabler' }" @click="activeSet = 'tabler'">图标</button>
          <button :class="{ active: activeSet === 'simple-icons' }" @click="activeSet = 'simple-icons'">品牌</button>
        </div>
        <input v-model="keyword" class="icon-picker__search" placeholder="搜索图标名称，如 github / arrow" />
        <button class="icon-picker__close" @click="emit('close')">关闭</button>
      </header>
      <div class="icon-picker__body">
        <button
          v-for="name in matches"
          :key="name"
          class="icon-cell"
          :class="{ active: name === modelValue }"
          :title="name"
          @click="choose(name)"
        >
          <icon-glyph :name="name" size="22px" />
        </button>
        <p v-if="!matches.length" class="icon-picker__empty">没有匹配的图标</p>
      </div>
    </div>
  </div>
</template>
