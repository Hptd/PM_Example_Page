<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useEditorStore, type AlignMode, type DistributeAxis } from '@/editor/core/store'
import IconGlyph from './IconGlyph.vue'

const store = useEditorStore()
const open = ref(false)

const ALIGN_ITEMS: { mode: AlignMode; label: string; icon: string }[] = [
  { mode: 'left', label: '左对齐', icon: 'tabler:layout-align-left' },
  { mode: 'hcenter', label: '垂直居中', icon: 'tabler:layout-align-center' },
  { mode: 'right', label: '右对齐', icon: 'tabler:layout-align-right' },
  { mode: 'top', label: '顶部对齐', icon: 'tabler:layout-align-top' },
  { mode: 'vcenter', label: '水平居中', icon: 'tabler:layout-align-middle' },
  { mode: 'bottom', label: '底部对齐', icon: 'tabler:layout-align-bottom' }
]

function align(mode: AlignMode) {
  store.alignSelection(mode)
  open.value = false
}

function distribute(axis: DistributeAxis) {
  store.distributeSelection(axis)
}

function close() {
  open.value = false
}

onMounted(() => window.addEventListener('click', close))
onBeforeUnmount(() => window.removeEventListener('click', close))
</script>

<template>
  <div class="align-toolbar">
    <div class="align-dropdown">
      <button class="align-btn" :class="{ active: open }" @click.stop="open = !open">
        <icon-glyph name="tabler:layout-align-left" size="16px" />
        <span>对齐</span>
        <span class="align-btn__caret">▾</span>
      </button>
      <div v-if="open" class="align-menu" @click.stop>
        <button
          v-for="item in ALIGN_ITEMS"
          :key="item.mode"
          class="align-menu__item"
          @click.stop="align(item.mode)"
        >
          <icon-glyph :name="item.icon" size="16px" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>

    <button class="align-btn" title="水平均匀分布" @click.stop="distribute('horizontal')">
      <icon-glyph name="tabler:layout-distribute-horizontal" size="16px" />
      <span>水平均匀分布</span>
    </button>
    <button class="align-btn" title="垂直均匀分布" @click.stop="distribute('vertical')">
      <icon-glyph name="tabler:layout-distribute-vertical" size="16px" />
      <span>垂直均匀分布</span>
    </button>
  </div>
</template>
