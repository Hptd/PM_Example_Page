<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, type CSSProperties } from 'vue'
import type { Frame, PMNode } from '@/editor/core/schema'
import { useEditorStore } from '@/editor/core/store'
import { registry } from '@/editor/core/registry'
import { collectAnchors, hitTest } from '@/editor/core/hitTest'
import { absolutePosition, findNode } from '@/editor/core/tree'
import {
  RESIZE_HANDLES,
  resizeRect,
  snapRect,
  type Point,
  type ResizeHandle,
  type SnapBox
} from '@/editor/core/geometry'
import NodeLayer from './NodeLayer.vue'

const props = defineProps<{ frame: Frame; zoom: number }>()
const emit = defineEmits<{ (e: 'frame-menu', payload: { frameId: string; x: number; y: number }): void }>()

const store = useEditorStore()
const frameEl = ref<HTMLElement | null>(null)
const handles = RESIZE_HANDLES
const guides = ref<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] })

interface DragState {
  mode: 'move' | 'resize'
  nodeId: string
  handle?: ResizeHandle
  start: Point
  rect: { x: number; y: number; w: number; h: number }
  pushed: boolean
}

let drag: DragState | null = null

interface EditingState {
  nodeId: string
  key: string
  value: string
  multiline: boolean
  x: number
  y: number
  w: number
  h: number
  fontSize: string
  textAlign: string
  color: string
}

const editing = ref<EditingState | null>(null)
const editEl = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

const editorStyle = computed<CSSProperties>(() => {
  const state = editing.value
  if (!state) return {}
  return {
    left: `${state.x}px`,
    top: `${state.y}px`,
    width: `${state.w}px`,
    height: `${state.h}px`,
    fontSize: state.fontSize,
    textAlign: state.textAlign as CSSProperties['textAlign'],
    color: state.color
  }
})

const frameStyle = computed(() => ({
  left: `${props.frame.x}px`,
  top: `${props.frame.y}px`,
  width: `${props.frame.w}px`,
  height: `${props.frame.h}px`,
  background: props.frame.background
}))

const selectedInFrame = computed(() => store.selectedLocation?.frame.id === props.frame.id)
const selected = computed(() => (selectedInFrame.value ? store.selectedLocation?.node ?? null : null))
const anchors = computed(() => collectAnchors(props.frame.tree, store.project.annotations))
const isActive = computed(() => store.activeFrameId === props.frame.id)

const selectionStyle = computed(() => {
  const node = selected.value
  if (!node) return {}
  const position = absolutePosition(props.frame, node.id) ?? { x: node.x, y: node.y }
  const px = props.zoom > 0 ? 1 / props.zoom : 1
  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${node.w}px`,
    height: `${node.h}px`,
    borderWidth: `${px}px`
  }
})

const HANDLE_ANCHORS: Record<ResizeHandle, [number, number]> = {
  nw: [0, 0],
  n: [0.5, 0],
  ne: [1, 0],
  e: [1, 0.5],
  se: [1, 1],
  s: [0.5, 1],
  sw: [0, 1],
  w: [0, 0.5]
}

function handleStyle(handle: ResizeHandle) {
  const size = 8 / props.zoom
  const half = size / 2
  const [fx, fy] = HANDLE_ANCHORS[handle]
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `calc(${fx * 100}% - ${half}px)`,
    top: `calc(${fy * 100}% - ${half}px)`
  }
}

function localPoint(event: MouseEvent): Point {
  const el = frameEl.value
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  return { x: (event.clientX - rect.left) / props.zoom, y: (event.clientY - rect.top) / props.zoom }
}

function resolveDrop(point: Point): { parentId: string | null; x: number; y: number } {
  const target = hitTest(props.frame.tree, point)
  if (target && registry.get(target.type)?.droppable) {
    const position = absolutePosition(props.frame, target.id)
    if (position) return { parentId: target.id, x: point.x - position.x, y: point.y - position.y }
  }
  return { parentId: null, x: point.x, y: point.y }
}

function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('application/x-pm-widget') ?? ''
  if (type.startsWith('custom:')) {
    const customId = type.slice('custom:'.length)
    const drop = resolveDrop(localPoint(event))
    store.mutate(() => store.addCustom(customId, props.frame.id, drop.x, drop.y, drop.parentId))
    return
  }
  if (!type || !registry.has(type)) return
  const drop = resolveDrop(localPoint(event))
  store.mutate(() => store.addWidget(type, props.frame.id, drop.x, drop.y, drop.parentId))
}

function snapMove(nodeId: string, rect: { x: number; y: number; w: number; h: number }) {
  const threshold = 6 / props.zoom
  const location = store.selectedLocation
  const siblings = location?.parent?.children ?? props.frame.tree
  const others: SnapBox[] = siblings
    .filter((item) => item.id !== nodeId && !item.hidden)
    .map((item) => ({ x: item.x, y: item.y, w: item.w, h: item.h }))
  if (!others.length) return { x: rect.x, y: rect.y, guides: { vertical: [], horizontal: [] } }
  return snapRect(rect, others, threshold)
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  const target = event.target as HTMLElement
  const handle = target.dataset.handle as ResizeHandle | undefined
  const point = localPoint(event)
  const location = store.selectedLocation

  if (handle && location && location.frame.id === props.frame.id) {
    drag = {
      mode: 'resize',
      nodeId: location.node.id,
      handle,
      start: point,
      rect: { x: location.node.x, y: location.node.y, w: location.node.w, h: location.node.h },
      pushed: false
    }
  } else {
    const node = hitTest(props.frame.tree, point)
    if (!node) {
      store.select(null)
      event.stopPropagation()
      return
    }
    store.select(node.id)
    drag = {
      mode: 'move',
      nodeId: node.id,
      start: point,
      rect: { x: node.x, y: node.y, w: node.w, h: node.h },
      pushed: false
    }
  }

  event.stopPropagation()
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event: PointerEvent) {
  if (!drag) return
  if (!drag.pushed) {
    store.pushHistory()
    drag.pushed = true
  }
  const point = localPoint(event)
  const dx = point.x - drag.start.x
  const dy = point.y - drag.start.y

  if (drag.mode === 'resize' && drag.handle) {
    store.resizeNode(drag.nodeId, resizeRect(drag.rect, drag.handle, dx, dy))
    return
  }

  const candidate = { x: drag.rect.x + dx, y: drag.rect.y + dy, w: drag.rect.w, h: drag.rect.h }
  const result = snapMove(drag.nodeId, candidate)
  store.moveNode(drag.nodeId, result.x, result.y)
  guides.value = result.guides
}

function onPointerUp() {
  drag = null
  guides.value = { vertical: [], horizontal: [] }
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function onContextMenu(event: MouseEvent) {
  emit('frame-menu', { frameId: props.frame.id, x: event.clientX, y: event.clientY })
}

function activateEditor(state: EditingState) {
  editing.value = state
  store.select(state.nodeId)
  void nextTick(() => {
    editEl.value?.focus()
    editEl.value?.select?.()
  })
}

function propOf(node: PMNode, key: string): string {
  return node.props[key] === undefined ? '' : String(node.props[key])
}

function onClickedEditTarget(event: MouseEvent): boolean {
  const target = event.target as HTMLElement | null
  const key = target?.dataset?.pmEdit
  if (!key || !target) return false
  const nodeEl = target.closest('[data-pm-id]') as HTMLElement | null
  const nodeId = nodeEl?.dataset.pmId
  const node = nodeId ? findNode([props.frame], nodeId)?.node : undefined
  if (!node) return false
  const zoom = props.zoom || 1
  const frameRect = frameEl.value?.getBoundingClientRect()
  const rect = target.getBoundingClientRect()
  const computed = window.getComputedStyle(target)
  activateEditor({
    nodeId: node.id,
    key,
    value: propOf(node, key),
    multiline: false,
    x: frameRect ? (rect.left - frameRect.left) / zoom : node.x,
    y: frameRect ? (rect.top - frameRect.top) / zoom : node.y,
    w: rect.width / zoom || node.w,
    h: rect.height / zoom || node.h,
    fontSize: computed.fontSize,
    textAlign: computed.textAlign,
    color: computed.color
  })
  return true
}

function onDblClick(event: MouseEvent) {
  if (onClickedEditTarget(event)) return

  const node = hitTest(props.frame.tree, localPoint(event))
  if (!node) return
  const def = registry.get(node.type)
  if (!def?.textEditor) return
  const position = absolutePosition(props.frame, node.id) ?? { x: node.x, y: node.y }
  activateEditor({
    nodeId: node.id,
    key: def.textEditor.key,
    value: propOf(node, def.textEditor.key),
    multiline: def.textEditor.multiline ?? false,
    x: position.x,
    y: position.y,
    w: node.w,
    h: node.h,
    fontSize: node.style?.fontSize !== undefined ? String(node.style.fontSize) : '14px',
    textAlign: node.style?.textAlign !== undefined ? String(node.style.textAlign) : 'left',
    color: node.style?.color !== undefined ? String(node.style.color) : '#1f2937'
  })
}

function onEditInput(event: Event) {
  if (!editing.value) return
  editing.value.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function onEditKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    editing.value = null
    return
  }
  const multiline = editing.value?.multiline ?? false
  if (event.key === 'Enter' && (!multiline || event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    commitEdit()
  }
}

function commitEdit() {
  const state = editing.value
  editing.value = null
  if (!state) return
  const node = findNode([props.frame], state.nodeId)?.node
  const previous = node?.props[state.key] === undefined ? '' : String(node?.props[state.key])
  if (!node || previous === state.value) return
  store.mutate(() => store.updateNodeProps(state.nodeId, { [state.key]: state.value }))
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
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

    <div v-if="selected" class="pm-selection" :style="selectionStyle">
      <span
        v-for="handle in handles"
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
