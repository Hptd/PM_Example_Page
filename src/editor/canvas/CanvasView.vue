<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useEditorStore } from '@/editor/core/store'
import { clampZoom, screenToWorld, type Point } from '@/editor/core/geometry'
import { nodesInWorldRect } from '@/editor/core/tree'
import FrameView from './FrameView.vue'

const emit = defineEmits<{ (e: 'frame-menu', payload: { frameId: string; x: number; y: number }): void }>()

const store = useEditorStore()
const viewportEl = ref<HTMLElement | null>(null)
const viewportSize = ref({ w: 0, h: 0 })

const CULL_MARGIN = 400

const visibleFrames = computed(() => {
  const frames = store.project.frames
  const { w, h } = viewportSize.value
  if (!w || !h) return frames
  const { x, y, zoom } = store.project.viewport
  return frames.filter((frame) => {
    const left = (frame.x - x) * zoom
    const top = (frame.y - y) * zoom
    return (
      left + frame.w * zoom > -CULL_MARGIN &&
      left < w + CULL_MARGIN &&
      top + frame.h * zoom > -CULL_MARGIN &&
      top < h + CULL_MARGIN
    )
  })
})

function updateViewportSize() {
  const el = viewportEl.value
  if (el) viewportSize.value = { w: el.clientWidth, h: el.clientHeight }
}

onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
})

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

const marquee = ref<{ x: number; y: number; w: number; h: number } | null>(null)
let marqueeStart: Point | null = null

function viewportPoint(event: PointerEvent): Point {
  const el = viewportEl.value
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function onPointerDown(event: PointerEvent) {
  if (event.button === 1) {
    const view = store.project.viewport
    pan = { startX: event.clientX, startY: event.clientY, viewX: view.x, viewY: view.y }
    window.addEventListener('pointermove', onPanMove)
    window.addEventListener('pointerup', onPanUp)
    event.preventDefault()
    return
  }
  if (event.button !== 0) return

  marqueeStart = viewportPoint(event)
  marquee.value = { x: marqueeStart.x, y: marqueeStart.y, w: 0, h: 0 }
  window.addEventListener('pointermove', onMarqueeMove)
  window.addEventListener('pointerup', onMarqueeUp)
}

function selectInMarquee(start: Point, point: Point) {
  const view = store.project.viewport
  const startWorld = screenToWorld(start, view)
  const endWorld = screenToWorld(point, view)
  const world = {
    x: Math.min(startWorld.x, endWorld.x),
    y: Math.min(startWorld.y, endWorld.y),
    w: Math.abs(endWorld.x - startWorld.x),
    h: Math.abs(endWorld.y - startWorld.y)
  }
  const ids = nodesInWorldRect(store.project.frames, world)
  if (ids.length) store.selectMany(ids)
  else store.select(null)
}

function onMarqueeMove(event: PointerEvent) {
  if (!marqueeStart) return
  const point = viewportPoint(event)
  marquee.value = {
    x: Math.min(marqueeStart.x, point.x),
    y: Math.min(marqueeStart.y, point.y),
    w: Math.abs(point.x - marqueeStart.x),
    h: Math.abs(point.y - marqueeStart.y)
  }
  selectInMarquee(marqueeStart, point)
}

function onMarqueeUp(event: PointerEvent) {
  const start = marqueeStart
  marqueeStart = null
  marquee.value = null
  window.removeEventListener('pointermove', onMarqueeMove)
  window.removeEventListener('pointerup', onMarqueeUp)
  if (!start) return
  const point = viewportPoint(event)
  if (Math.abs(point.x - start.x) < 3 && Math.abs(point.y - start.y) < 3) {
    store.select(null)
    return
  }
  selectInMarquee(start, point)
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

onBeforeUnmount(() => {
  onPanUp()
  window.removeEventListener('resize', updateViewportSize)
  window.removeEventListener('pointermove', onMarqueeMove)
  window.removeEventListener('pointerup', onMarqueeUp)
})
</script>

<template>
  <div ref="viewportEl" class="canvas-viewport" @wheel.prevent="onWheel" @pointerdown="onPointerDown">
    <div class="canvas-world" :style="worldStyle">
      <frame-view
        v-for="frame in visibleFrames"
        :key="frame.id"
        :frame="frame"
        :zoom="store.project.viewport.zoom"
        @frame-menu="emit('frame-menu', $event)"
      />
    </div>

    <div
      v-if="marquee"
      class="canvas-marquee"
      :style="{
        left: `${marquee.x}px`,
        top: `${marquee.y}px`,
        width: `${marquee.w}px`,
        height: `${marquee.h}px`
      }"
    />

    <div v-if="!store.project.frames.length" class="canvas-empty">
      <p>画布为空</p>
      <p class="canvas-empty__hint">点击左上角「新建页面」创建第一块页面设计区域</p>
    </div>
  </div>
</template>
