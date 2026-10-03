<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditorStore } from '@/editor/core/store'
import { registry } from '@/editor/core/registry'
import { createProject, parseProject, serializeProject, type Frame } from '@/editor/core/schema'
import { FRAME_SIZE_GROUPS, nextFramePosition, pickDefaultFrameSize } from '@/editor/core/framePresets'
import { findCustomWidget } from '@/editor/core/customWidgets'
import { findFrame } from '@/editor/core/tree'
import { getProject, saveProject } from '@/api/project'
import { ApiError } from '@/api/http'
import { useAutosave } from '@/composables/useAutosave'
import { useEditorShortcuts } from '@/composables/useEditorShortcuts'
import { measureSvg, readPastedSvg, svgToDataUrl } from '@/editor/core/pasteSvg'
import PalettePanel from '@/editor/panels/PalettePanel.vue'
import PropertiesPanel from '@/editor/panels/PropertiesPanel.vue'
import LayersPanel from '@/editor/panels/LayersPanel.vue'
import CommentsPanel from '@/editor/panels/CommentsPanel.vue'
import CanvasView from '@/editor/canvas/CanvasView.vue'
import AlignToolbar from '@/editor/components/AlignToolbar.vue'
import { exportFrame } from '@/editor/export/exportFrame'
import { buildSpec } from '@/editor/export/spec'
import { downloadText, safeFilename } from '@/editor/export/download'

const route = useRoute()
const router = useRouter()
const store = useEditorStore()

const projectId = String(route.params.id)
const rightTab = ref<'props' | 'layers' | 'comments'>('props')
const loading = ref(true)
const canvasRef = ref<InstanceType<typeof CanvasView> | null>(null)

const contextMenu = reactive({ visible: false, x: 0, y: 0, frameId: '' })
const newPageMenu = ref(false)

const defaultFrameSize = computed(() => pickDefaultFrameSize(store.project.frames))

async function persist() {
  const snapshot = serializeProject(store.project)
  await saveProject({ id: projectId, name: store.project.name, content: snapshot })
  if (serializeProject(store.project) === snapshot) store.dirty = false
  else autosave.schedule()
}

const autosave = useAutosave(() => store.dirty, persist)
const saving = autosave.saving
const saveError = autosave.error

function save(): Promise<boolean> {
  return autosave.run()
}

const { onKeydown } = useEditorShortcuts(store, () => void save())

async function onPaste(event: ClipboardEvent) {
  const target = event.target as HTMLElement | null
  if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return

  const svg = await readPastedSvg(event.clipboardData)
  if (svg) {
    event.preventDefault()
    const size = await measureSvg(svg)
    store.pasteSvg(svgToDataUrl(svg), size.w, size.h)
    return
  }

  if (store.clipboard.length) {
    event.preventDefault()
    store.pasteClipboard()
  }
}

onMounted(async () => {
  try {
    const record = await getProject(projectId)
    store.loadProject(record.content ? parseProject(record.content) : createProject(record.name), projectId)
  } catch (error) {
    if (error instanceof ApiError && error.code === 401) return
    window.alert(error instanceof Error ? error.message : '项目加载失败')
    await router.replace('/')
    return
  }
  loading.value = false
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('paste', onPaste)
  window.addEventListener('click', closeMenu)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('click', closeMenu)
  if (store.dirty) void save()
})

async function goBack() {
  const ok = await save()
  if (ok) await router.push('/')
}

function renameProject(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  if (value) store.renameProject(value)
}

function addFrame(size: { w: number; h: number } = defaultFrameSize.value) {
  store.mutate(() => {
    const position = nextFramePosition(store.project.frames)
    store.addFrame(position.x, position.y, size)
  })
  newPageMenu.value = false
}

function duplicateFrame(id: string) {
  store.mutate(() => store.duplicateFrame(id))
}

function addWidgetAtCenter(type: string) {
  if (!store.activeFrameId) addFrame()
  const frame = store.activeFrame
  if (!frame) return
  if (type.startsWith('custom:')) {
    const customId = type.slice('custom:'.length)
    const widget = findCustomWidget(customId)
    const w = widget?.w ?? 120
    const x = Math.max(0, Math.round(frame.w / 2 - w / 2))
    store.mutate(() => store.addCustom(customId, frame.id, x, 40))
    return
  }
  const def = registry.get(type)
  if (!def) return
  const x = Math.max(0, Math.round(frame.w / 2 - def.defaultSize.w / 2))
  const y = 40
  store.mutate(() => store.addWidget(type, frame.id, x, y))
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
  newPageMenu.value = false
}

async function exportAnnotated(frame?: Frame | null) {
  const target = frame ?? store.activeFrame
  if (!target) return
  try {
    const result = await exportFrame(target, store.project)
    downloadText(`${safeFilename(target.name)}-annotated.html`, result.annotatedHtml, 'text/html')
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '导出失败')
  }
}

async function exportClean(frame?: Frame | null) {
  const target = frame ?? store.activeFrame
  if (!target) return
  try {
    const result = await exportFrame(target, store.project)
    downloadText(`${safeFilename(target.name)}.html`, result.cleanHtml, 'text/html')
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '导出失败')
  }
}

function exportSpec() {
  downloadText(`${safeFilename(store.project.name)}-spec.md`, buildSpec(store.project), 'text/markdown')
}

function renameFrame(id: string) {
  const frame = findFrame(store.project.frames, id)
  if (!frame) return
  const name = window.prompt('页面名称', frame.name)
  if (name && name.trim()) store.mutate(() => store.updateFrame(id, { name: name.trim() }))
}

function removeFrame(id: string) {
  if (!window.confirm('确认删除该页面？')) return
  store.mutate(() => store.removeFrame(id))
}
</script>

<template>
  <div class="editor" v-if="!loading">
    <header class="editor-topbar">
      <button class="btn-ghost" @click="goBack">返回</button>
      <input class="editor-title" :value="store.project.name" @change="renameProject" />
      <span class="editor-state" :class="{ dirty: store.dirty }">{{ store.dirty ? '未保存' : saving ? '保存中' : '已保存' }}</span>
      <span v-if="saveError" class="editor-error">{{ saveError }}</span>

      <align-toolbar v-if="store.selectedIds.length >= 2" />

      <div class="editor-topbar__group">
        <button class="btn-ghost" :disabled="!store.canUndo" title="撤销 Ctrl+Z" @click="store.undo()">撤销</button>
        <button class="btn-ghost" :disabled="!store.canRedo" title="重做 Ctrl+Y" @click="store.redo()">重做</button>
        <button class="btn-ghost" @click="canvasRef?.zoomBy(0.9)">－</button>
        <button class="btn-ghost" @click="canvasRef?.resetZoom()">100%</button>
        <button class="btn-ghost" @click="canvasRef?.zoomBy(1.1)">＋</button>
      </div>

      <div class="editor-topbar__group">
        <div class="new-page-menu">
          <button class="btn-ghost" @click.stop="newPageMenu = !newPageMenu">新建页面 ▾</button>
          <div v-if="newPageMenu" class="new-page-menu__dropdown" @click.stop>
            <button class="new-page-menu__item is-default" @click="addFrame()">
              <span>默认尺寸</span>
              <em>{{ defaultFrameSize.w }} × {{ defaultFrameSize.h }}</em>
            </button>
            <template v-for="group in FRAME_SIZE_GROUPS" :key="group.label">
              <div class="new-page-menu__group">{{ group.label }}</div>
              <button
                v-for="preset in group.presets"
                :key="`${preset.label}-${preset.w}`"
                class="new-page-menu__item"
                @click="addFrame(preset)"
              >
                <span>{{ preset.label }}</span>
                <em>{{ preset.w }} × {{ preset.h }}</em>
              </button>
            </template>
          </div>
        </div>
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
      <button @click="duplicateFrame(contextMenu.frameId); closeMenu()">创建副本</button>
      <button @click="exportAnnotated(findFrame(store.project.frames, contextMenu.frameId)); closeMenu()">导出注释 HTML</button>
      <button @click="exportClean(findFrame(store.project.frames, contextMenu.frameId)); closeMenu()">导出干净 HTML</button>
      <button @click="renameFrame(contextMenu.frameId); closeMenu()">重命名页面</button>
      <button class="danger" @click="removeFrame(contextMenu.frameId); closeMenu()">删除页面</button>
    </div>
  </div>

  <div v-else class="editor-loading">加载项目中...</div>
</template>
