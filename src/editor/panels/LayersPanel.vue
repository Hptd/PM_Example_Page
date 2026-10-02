<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/editor/core/store'
import { displayName, registry } from '@/editor/core/registry'
import { walkTree } from '@/editor/core/tree'
import type { PMNode } from '@/editor/core/schema'
import IconGlyph from '@/editor/components/IconGlyph.vue'

const store = useEditorStore()

interface Row {
  node: PMNode
  depth: number
}

const rows = computed<Row[]>(() => {
  const frame = store.activeFrame
  if (!frame) return []
  const result: Row[] = []
  walkTree(frame.tree, (node, context) => {
    result.push({ node, depth: context.depth })
  })
  return result
})

function iconOf(node: PMNode): string {
  return registry.get(node.type)?.icon ?? 'tabler:box'
}

function toggleHidden(node: PMNode) {
  store.mutate(() => store.updateNodeMeta(node.id, { hidden: !node.hidden }))
}

function toggleLocked(node: PMNode) {
  store.mutate(() => store.updateNodeMeta(node.id, { locked: !node.locked }))
}
</script>

<template>
  <div class="panel layers">
    <div class="layers-frame">
      <select
        :value="store.activeFrameId ?? ''"
        @change="store.activeFrameId = ($event.target as HTMLSelectElement).value || null"
      >
        <option v-for="frame in store.project.frames" :key="frame.id" :value="frame.id">
          {{ frame.name }}
        </option>
      </select>
    </div>

    <p v-if="!rows.length" class="panel-empty">当前页面暂无组件</p>

    <div
      v-for="row in rows"
      :key="row.node.id"
      class="layer-row"
      :class="{ active: store.selectedId === row.node.id, dim: row.node.hidden }"
      :style="{ paddingLeft: `${8 + row.depth * 14}px` }"
      @click="store.select(row.node.id)"
    >
      <icon-glyph :name="iconOf(row.node)" size="16px" />
      <span class="layer-row__name">{{ displayName(row.node) }}</span>
      <button class="layer-row__action" :title="row.node.hidden ? '显示' : '隐藏'" @click.stop="toggleHidden(row.node)">
        <icon-glyph :name="row.node.hidden ? 'tabler:eye-off' : 'tabler:eye'" size="15px" />
      </button>
      <button class="layer-row__action" :title="row.node.locked ? '解锁' : '锁定'" @click.stop="toggleLocked(row.node)">
        <icon-glyph :name="row.node.locked ? 'tabler:lock' : 'tabler:lock-open'" size="15px" />
      </button>
    </div>
  </div>
</template>
