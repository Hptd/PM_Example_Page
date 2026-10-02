<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'
import type { Frame } from '@/editor/core/schema'
import { useEditorStore } from '@/editor/core/store'
import { collectAnchors } from '@/editor/core/hitTest'
import { collectNodes } from '@/editor/core/tree'
import { useFrameEditor } from '@/composables/useFrameEditor'
import NodeLayer from './NodeLayer.vue'

const props = defineProps<{ frame: Frame; zoom: number }>()
const emit = defineEmits<{ (e: 'frame-menu', payload: { frameId: string; x: number; y: number }): void }>()

const store = useEditorStore()
const frameEl = ref<HTMLElement | null>(null)

const {
  handles,
  guides,
  editing,
  editEl,
  editorStyle,
  handleStyle,
  onDrop,
  onPointerDown,
  onContextMenu,
  onDblClick,
  onEditInput,
  onEditKeydown,
  commitEdit
} = useFrameEditor(props, frameEl, (payload) => emit('frame-menu', payload))

const frameStyle = computed(() => ({
  left: `${props.frame.x}px`,
  top: `${props.frame.y}px`,
  width: `${props.frame.w}px`,
  height: `${props.frame.h}px`,
  background: props.frame.background
}))

const anchors = computed(() => collectAnchors(props.frame.tree, store.project.annotations))
const isActive = computed(() => store.activeFrameId === props.frame.id)

const selectionBoxes = computed<{ id: string; style: CSSProperties }[]>(() => {
  const px = props.zoom > 0 ? 1 / props.zoom : 1
  const nodes = collectNodes(props.frame, store.selectedIds)
  const boxes: { id: string; style: CSSProperties }[] = []
  for (const id of store.selectedIds) {
    const entry = nodes.get(id)
    if (!entry) continue
    boxes.push({
      id,
      style: {
        left: `${entry.x}px`,
        top: `${entry.y}px`,
        width: `${entry.node.w}px`,
        height: `${entry.node.h}px`,
        borderWidth: `${px}px`
      }
    })
  }
  return boxes
})
</script>

<template>
  <div
    ref="frameEl"
    class="pm-frame"
    :class="{ 'is-active': isActive }"
    :style="frameStyle"
    :data-frame-id="frame.id"
    @pointerdown="onPointerDown"
    @dblclick="onDblClick"
    @contextmenu.prevent="onContextMenu"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <node-layer :nodes="frame.tree" />

    <div v-if="editing" class="pm-inline-editor" :style="editorStyle" @pointerdown.stop @dblclick.stop @click.stop>
      <textarea
        v-if="editing.multiline"
        ref="editEl"
        :value="editing.value"
        @input="onEditInput"
        @keydown="onEditKeydown"
        @blur="commitEdit"
      />
      <input
        v-else
        ref="editEl"
        :value="editing.value"
        @input="onEditInput"
        @keydown="onEditKeydown"
        @blur="commitEdit"
      />
    </div>

    <div v-if="guides.vertical.length || guides.horizontal.length" class="pm-guides">
      <div v-for="(x, index) in guides.vertical" :key="`v${index}`" class="pm-guide-v" :style="{ left: `${x}px` }" />
      <div v-for="(y, index) in guides.horizontal" :key="`h${index}`" class="pm-guide-h" :style="{ top: `${y}px` }" />
    </div>

    <div v-for="box in selectionBoxes" :key="box.id" class="pm-selection" :style="box.style">
      <span
        v-for="handle in store.selectedIds.length === 1 ? handles : []"
        :key="handle"
        class="pm-handle"
        :data-handle="handle"
        :style="handleStyle(handle)"
      />
    </div>

    <button
      v-for="anchor in anchors"
      :key="anchor.nodeId"
      class="pm-comment-pin"
      :style="{ left: `${anchor.x}px`, top: `${anchor.y}px` }"
      @pointerdown.stop
      @click.stop="store.select(anchor.nodeId)"
    >
      {{ anchor.count }}
    </button>

    <div class="pm-frame-label" :style="{ top: `${-20 / zoom}px`, fontSize: `${12 / zoom}px` }">
      {{ frame.name }}
    </div>
  </div>
</template>
