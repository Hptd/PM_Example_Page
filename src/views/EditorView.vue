<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditorStore } from '../editor/core/store'
import { registry } from '../editor/core/registry'
import { createProject, parseProject, serializeProject, type Frame } from '../editor/core/schema'
import { getProject, saveProject } from '../api/project'
import PalettePanel from '../editor/panels/PalettePanel.vue'
import PropertiesPanel from '../editor/panels/PropertiesPanel.vue'
import LayersPanel from '../editor/panels/LayersPanel.vue'
import CommentsPanel from '../editor/panels/CommentsPanel.vue'
import CanvasView from '../editor/canvas/CanvasView.vue'
import { exportFrame } from '../editor/export/exportFrame'
import { buildSpec } from '../editor/export/spec'
import { downloadText, safeFilename } from '../editor/export/download'

const route = useRoute()
const router = useRouter()
const store = useEditorStore()

const projectId = String(route.params.id)
const rightTab = ref<'props' | 'layers' | 'comments'>('props')
const loading = ref(true)
const saving = ref(false)
const canvasRef = ref<InstanceType<typeof CanvasView> | null>(null)

const contextMenu = reactive({ visible: false, x: 0, y: 0, frameId: '' })

onMounted(async () => {
  try {
    const record = await getProject(projectId)
    store.loadProject(record.content ? parseProject(record.content) : createProject(record.name), projectId)
  } catch {
    store.loadProject(createProject('未命名项目'), projectId)
  }
  loading.value = false
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('click', closeMenu)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('click', closeMenu)
})

async function save() {
  saving.value = true
  try {
    await saveProject({ id: projectId, name: store.project.name, content: serializeProject(store.project) })
    store.dirty = false
  } finally {
    saving.value = false
  }
}

async function goBack() {
  await save()
  await router.push('/')
}

function renameProject(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  if (value) store.renameProject(value)
}

function addFrame() {
  store.mutate(() => {
    const count = store.project.frames.length
    store.addFrame(60 + count * 40, 60 + count * 40)
  })
}

function addWidgetAtCenter(type: string) {
  if (!store.activeFrameId) store.mutate(() => store.addFrame(60, 60))
  const frame = store.activeFrame
  if (!frame) return
  const def = registry.get(type)
  if (!def) return
  const x = Math.max(0, Math.round(frame.w / 2 - def.defaultSize.w / 2))
  const y = 40
  store.mutate(() => store.addWidget(type, frame.id, x, y))
}

function findFrame(id: string): Frame | undefined {
  return store.project.frames.find((frame) => frame.id === id)
}

function onFrameMenu(payload: { frameId: string; x: number; y: number }) {
  contextMenu.visible = true
  contextMenu.x = payload.x
  contextMenu.y = payload.y
  contextMenu.frameId = payload.frameId
  store.activeFrameId = payload.frameId
}

function closeMenu() {
  contextMenu.visible = false
}

async function exportAnnotated(frame?: Frame) {
  const target = frame ?? store.activeFrame
  if (!target) return
  const result = await exportFrame(target, store.project)
  downloadText(`${safeFilename(target.name)}-annotated.html`, result.annotatedHtml, 'text/html')
}

async function exportClean(frame?: Frame) {
  const target = frame ?? store.activeFrame
  if (!target) return
  const result = await exportFrame(target, store.project)
  downloadText(`${safeFilename(target.name)}.html`, result.cleanHtml, 'text/html')
}

function exportSpec() {
  downloadText(`${safeFilename(store.project.name)}-spec.md`, buildSpec(store.project), 'text/markdown')
}

function renameFrame(id: string) {
  const frame = findFrame(id)
  if (!frame) return
  const name = window.prompt('页面名称', frame.name)
  if (name && name.trim()) store.mutate(() => store.updateFrame(id, { name: name.trim() }))
}

function removeFrame(id: string) {
  if (!window.confirm('确认删除该页面？')) return
  store.mutate(() => store.removeFrame(id))
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
  const mod = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()

  if (mod && key === 's') {
    event.preventDefault()
    void save()
    return
  }
  if (typing) return

  if (mod && key === 'z') {
    event.preventDefault()
    if (event.shiftKey) store.redo()
    else store.undo()
    return
  }
  if (mod && key === 'y') {
    event.preventDefault()
    store.redo()
    return
  }
  if (mod && key === 'd') {
    event.preventDefault()
    store.duplicateSelected()
    return
  }
  if (mod && key === 'c') {
    store.copySelected()
    return
  }
  if (mod && key === 'v') {
    store.pasteClipboard()
    return
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    store.removeSelected()
    return
  }
  if (event.key === 'Escape') store.select(null)
}
</script>

<template>
  <div class="editor" v-if="!loading">
    <header class="editor-topbar">
      <button class="btn-ghost" @click="goBack">返回</button>
      <input class="editor-title" :value="store.project.name" @change="renameProject" />
      <span class="editor-state" :class="{ dirty: store.dirty }">{{ store.dirty ? '未保存' : saving ? '保存中' : '已保存' }}</span>

      <div class="editor-topbar__group">
        <button class="btn-ghost" :disabled="!store.canUndo" title="撤销 Ctrl+Z" @click="store.undo()">撤销</button>
        <button class="btn-ghost" :disabled="!store.canRedo" title="重做 Ctrl+Y" @click="store.redo()">重做</button>
        <button class="btn-ghost" @click="canvasRef?.zoomBy(0.9)">－</button>
        <button class="btn-ghost" @click="canvasRef?.resetZoom()">100%</button>
        <button class="btn-ghost" @click="canvasRef?.zoomBy(1.1)">＋</button>
      </div>

      <div class="editor-topbar__group">
        <button class="btn-ghost" @click="addFrame">新建页面</button>
        <button class="btn-ghost" :disabled="!store.activeFrame" @click="exportClean()">导出 HTML</button>
        <button class="btn-ghost" :disabled="!store.activeFrame" @click="exportAnnotated()">导出注释 HTML</button>
        <button class="btn-ghost" @click="exportSpec">导出说明 MD</button>
        <button class="btn-primary" @click="save">保存</button>
      </div>
    </header>

    <div class="editor-body">
      <aside class="editor-left">
        <palette-panel @add="addWidgetAtCenter" />
      </aside>

      <main class="editor-canvas">
        <canvas-view ref="canvasRef" @frame-menu="onFrameMenu" />
      </main>

      <aside class="editor-right">
        <div class="tabs">
          <button :class="{ active: rightTab === 'props' }" @click="rightTab = 'props'">属性</button>
          <button :class="{ active: rightTab === 'layers' }" @click="rightTab = 'layers'">图层</button>
          <button :class="{ active: rightTab === 'comments' }" @click="rightTab = 'comments'">评论</button>
        </div>
        <properties-panel v-show="rightTab === 'props'" />
        <layers-panel v-show="rightTab === 'layers'" />
        <comments-panel v-show="rightTab === 'comments'" />
      </aside>
    </div>

    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
    >
      <button @click="exportAnnotated(findFrame(contextMenu.frameId)); closeMenu()">导出注释 HTML</button>
      <button @click="exportClean(findFrame(contextMenu.frameId)); closeMenu()">导出干净 HTML</button>
      <button @click="renameFrame(contextMenu.frameId); closeMenu()">重命名页面</button>
      <button class="danger" @click="removeFrame(contextMenu.frameId); closeMenu()">删除页面</button>
    </div>
  </div>

  <div v-else class="editor-loading">加载项目中...</div>
</template>
