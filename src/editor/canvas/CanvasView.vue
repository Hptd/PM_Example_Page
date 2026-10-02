<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useEditorStore } from '@/editor/core/store'
import { clampZoom } from '@/editor/core/geometry'
import FrameView from './FrameView.vue'

const emit = defineEmits<{ (e: 'frame-menu', payload: { frameId: string; x: number; y: number }): void }>()

const store = useEditorStore()
const viewportEl = ref<HTMLElement | null>(null)

const worldStyle = computed(() => {
  const { x, y, zoom } = store.project.viewport
  return {
    transform: `translate(${-x * zoom}px, ${-y * zoom}px) scale(${zoom})`,
    transformOrigin: '0 0'
  }
})

function onWheel(event: WheelEvent) {
  const view = store.project.viewport
  const el = viewportEl.value
  if (!el) return

  if (event.ctrlKey || event.metaKey) {
    const rect = el.getBoundingClientRect()
    const cx = event.clientX - rect.left
    const cy = event.clientY - rect.top
    const worldX = cx / view.zoom + view.x
    const worldY = cy / view.zoom + view.y
    const nextZoom = clampZoom(view.zoom * (event.deltaY < 0 ? 1.1 : 0.9))
    store.setViewport({
      x: worldX - cx / nextZoom,
      y: worldY - cy / nextZoom,
      zoom: nextZoom
    })
    return
  }

  store.setViewport({
    x: view.x + event.deltaX / view.zoom,
    y: view.y + event.deltaY / view.zoom,
    zoom: view.zoom
  })
}

let pan: { startX: number; startY: number; viewX: number; viewY: number } | null = null

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 && event.button !== 1) return
  const view = store.project.viewport
  pan = { startX: event.clientX, startY: event.clientY, viewX: view.x, viewY: view.y }
  store.select(null)
  window.addEventListener('pointermove', onPanMove)
  window.addEventListener('pointerup', onPanUp)
}

function onPanMove(event: PointerEvent) {
  if (!pan) return
  const zoom = store.project.viewport.zoom
  store.setViewport({
    x: pan.viewX - (event.clientX - pan.startX) / zoom,
    y: pan.viewY - (event.clientY - pan.startY) / zoom,
    zoom
  })
}

function onPanUp() {
  pan = null
  window.removeEventListener('pointermove', onPanMove)
  window.removeEventListener('pointerup', onPanUp)
}

function zoomBy(factor: number) {
  const view = store.project.viewport
  const el = viewportEl.value
  const cx = el ? el.clientWidth / 2 : 0
  const cy = el ? el.clientHeight / 2 : 0
  const worldX = cx / view.zoom + view.x
  const worldY = cy / view.zoom + view.y
  const nextZoom = clampZoom(view.zoom * factor)
  store.setViewport({ x: worldX - cx / nextZoom, y: worldY - cy / nextZoom, zoom: nextZoom })
}

function resetZoom() {
  store.setViewport({ x: store.project.viewport.x, y: store.project.viewport.y, zoom: 1 })
}

defineExpose({ zoomBy, resetZoom })

onBeforeUnmount(onPanUp)
</script>

<template>
  <div ref="viewportEl" class="canvas-viewport" @wheel.prevent="onWheel" @pointerdown="onPointerDown">
    <div class="canvas-world" :style="worldStyle">
      <frame-view
        v-for="frame in store.project.frames"
        :key="frame.id"
        :frame="frame"
        :zoom="store.project.viewport.zoom"
        @frame-menu="emit('frame-menu', $event)"
      />
    </div>

    <div v-if="!store.project.frames.length" class="canvas-empty">
      <p>画布为空</p>
      <p class="canvas-empty__hint">点击左上角「新建页面」创建第一块页面设计区域</p>
    </div>
  </div>
</template>
