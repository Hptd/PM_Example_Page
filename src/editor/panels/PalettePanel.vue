<script setup lang="ts">
import { computed, ref } from 'vue'
import { registry, WIDGET_CATEGORIES, type WidgetDef } from '../core/registry'
import IconGlyph from '../components/IconGlyph.vue'

const emit = defineEmits<{ (e: 'add', type: string): void }>()

const keyword = ref('')

const groups = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return WIDGET_CATEGORIES.map((category) => ({
    ...category,
    items: registry
      .list(category.key)
      .filter((def) => !kw || def.name.toLowerCase().includes(kw) || def.type.includes(kw))
  })).filter((group) => group.items.length > 0)
})

function onDragStart(event: DragEvent, def: WidgetDef) {
  event.dataTransfer?.setData('application/x-pm-widget', def.type)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <div class="panel palette">
    <input v-model="keyword" class="palette-search" placeholder="搜索组件" />
    <div v-for="group in groups" :key="group.key" class="palette-group">
      <div class="palette-group__title">{{ group.name }}</div>
      <div class="palette-grid">
        <div
          v-for="item in group.items"
          :key="item.type"
          class="palette-item"
          draggable="true"
          :title="`${item.name}（拖拽到画布，或点击添加）`"
          @dragstart="onDragStart($event, item)"
          @click="emit('add', item.type)"
        >
          <icon-glyph :name="item.icon" size="22px" />
          <span>{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
