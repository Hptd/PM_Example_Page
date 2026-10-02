<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { displayName, registry, WIDGET_CATEGORIES } from '@/editor/core/registry'
import IconGlyph from '@/editor/components/IconGlyph.vue'
import {
  addCustomNode,
  addCustomSvg,
  customWidgets,
  reloadCustomWidgets,
  removeCustomWidget,
  type CustomWidget
} from '@/editor/core/customWidgets'
import { useEditorStore } from '@/editor/core/store'
import type { PMNode } from '@/editor/core/schema'

const emit = defineEmits<{ (e: 'add', type: string): void }>()

const store = useEditorStore()
const keyword = ref('')
const collapsed = reactive<Record<string, boolean>>({})

const searching = computed(() => keyword.value.trim().length > 0)

const groups = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return WIDGET_CATEGORIES.map((category) => ({
    ...category,
    items: registry
      .list(category.key)
      .filter((def) => !kw || def.name.toLowerCase().includes(kw) || def.type.includes(kw))
  })).filter((group) => group.items.length > 0)
})

const visibleCustom = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return customWidgets.value.filter((item) => !kw || item.name.toLowerCase().includes(kw))
})

function isCollapsed(key: string): boolean {
  return !searching.value && collapsed[key] === true
}

function toggle(key: string): void {
  collapsed[key] = !collapsed[key]
}

function onDragStart(event: DragEvent, type: string) {
  event.dataTransfer?.setData('application/x-pm-widget', type)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
}

onMounted(reloadCustomWidgets)

const dialog = reactive({
  visible: false,
  tab: 'file' as 'file' | 'svg' | 'node',
  name: '',
  svgCode: '',
  error: ''
})
const pending = ref<{ src: string; w: number; h: number } | null>(null)

const selectedName = computed(() => (store.selectedNode ? displayName(store.selectedNode) : ''))

function openDialog() {
  dialog.visible = true
  dialog.tab = 'file'
  dialog.name = ''
  dialog.svgCode = ''
  dialog.error = ''
  pending.value = null
}

function closeDialog() {
  dialog.visible = false
}

function measure(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth || 120, h: img.naturalHeight || 120 })
    img.onerror = () => resolve({ w: 120, h: 120 })
    img.src = src
  })
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async () => {
    const src = String(reader.result)
    const size = await measure(src)
    pending.value = { src, ...size }
    if (!dialog.name) dialog.name = file.name.replace(/\.[^.]+$/, '')
  }
  reader.readAsDataURL(file)
}

async function confirmDialog() {
  const name = dialog.name.trim()
  dialog.error = ''
  if (!name) {
    dialog.error = '请输入组件名称'
    return
  }
  if (dialog.tab === 'file') {
    if (!pending.value) {
      dialog.error = '请选择图片或 SVG 文件'
      return
    }
    addCustomSvg(name, pending.value.src, pending.value.w, pending.value.h)
  } else if (dialog.tab === 'svg') {
    const code = dialog.svgCode.trim()
    if (!code) {
      dialog.error = '请粘贴 SVG 代码'
      return
    }
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(code)}`
    const size = await measure(src)
    addCustomSvg(name, src, size.w, size.h)
  } else {
    const node = store.selectedNode
    if (!node) {
      dialog.error = '请先在画布中选中一个组件'
      return
    }
    addCustomNode(name, JSON.parse(JSON.stringify(node)) as PMNode)
  }
  closeDialog()
}

function removeCustom(event: Event, widget: CustomWidget) {
  event.stopPropagation()
  if (window.confirm(`删除自定义组件「${widget.name}」？`)) removeCustomWidget(widget.id)
}
</script>

<template>
  <div class="panel palette">
    <input v-model="keyword" class="palette-search" placeholder="搜索组件" />

    <div class="palette-group">
      <div class="palette-group__title palette-group__title--toggle" @click="toggle('custom')">
        <span>我的-自定义</span>
        <span class="palette-caret" :class="{ 'is-collapsed': isCollapsed('custom') }">▾</span>
      </div>
      <div v-show="!isCollapsed('custom')">
        <div class="palette-grid">
          <div class="palette-item palette-item--add" title="新增自定义组件" @click="openDialog">＋</div>
          <div
            v-for="item in visibleCustom"
            :key="item.id"
            class="palette-item palette-item--custom"
            draggable="true"
            :title="`${item.name}（拖拽到画布，或点击添加）`"
            @dragstart="onDragStart($event, `custom:${item.id}`)"
            @click="emit('add', `custom:${item.id}`)"
          >
            <button class="palette-item__remove" title="删除" @click="removeCustom($event, item)">×</button>
            <img v-if="item.kind === 'svg' && item.svg" :src="item.svg" alt="" class="palette-item__thumb" />
            <icon-glyph v-else name="tabler:box" size="22px" />
            <span>{{ item.name }}</span>
          </div>
        </div>
        <p v-if="!visibleCustom.length && !searching" class="palette-hint">点击 ＋ 导入 SVG，或保存画布中选中的组件</p>
      </div>
    </div>

    <div v-for="group in groups" :key="group.key" class="palette-group">
      <div class="palette-group__title palette-group__title--toggle" @click="toggle(group.key)">
        <span>{{ group.name }}</span>
        <span class="palette-caret" :class="{ 'is-collapsed': isCollapsed(group.key) }">▾</span>
      </div>
      <div v-show="!isCollapsed(group.key)" class="palette-grid">
        <div
          v-for="item in group.items"
          :key="item.type"
          class="palette-item"
          draggable="true"
          :title="`${item.name}（拖拽到画布，或点击添加）`"
          @dragstart="onDragStart($event, item.type)"
          @click="emit('add', item.type)"
        >
          <icon-glyph :name="item.icon" size="22px" />
          <span>{{ item.name }}</span>
        </div>
      </div>
    </div>

    <div v-if="dialog.visible" class="custom-dialog__mask" @click.self="closeDialog">
      <div class="custom-dialog">
        <h3 class="custom-dialog__title">新增自定义组件</h3>
        <div class="custom-dialog__tabs">
          <button :class="{ active: dialog.tab === 'file' }" @click="dialog.tab = 'file'; dialog.error = ''">导入文件</button>
          <button :class="{ active: dialog.tab === 'svg' }" @click="dialog.tab = 'svg'; dialog.error = ''">粘贴 SVG</button>
          <button :class="{ active: dialog.tab === 'node' }" @click="dialog.tab = 'node'; dialog.error = ''">保存选中组件</button>
        </div>

        <div class="custom-dialog__body">
          <template v-if="dialog.tab === 'file'">
            <input type="file" accept="image/svg+xml,image/png,image/jpeg" @change="onFileChange" />
            <img v-if="pending" :src="pending.src" alt="" class="custom-dialog__preview" />
          </template>
          <template v-else-if="dialog.tab === 'svg'">
            <textarea v-model="dialog.svgCode" class="custom-dialog__code" placeholder="粘贴 &lt;svg&gt;…&lt;/svg&gt; 代码"></textarea>
          </template>
          <template v-else>
            <p class="custom-dialog__hint">{{ selectedName ? `将保存：${selectedName}` : '请先在画布中选中一个组件' }}</p>
          </template>

          <label class="custom-dialog__field">
            <span>名称</span>
            <input v-model="dialog.name" type="text" placeholder="组件名称" />
          </label>
          <p v-if="dialog.error" class="custom-dialog__error">{{ dialog.error }}</p>
        </div>

        <div class="custom-dialog__actions">
          <button class="btn-ghost" @click="closeDialog">取消</button>
          <button class="btn-primary" @click="confirmDialog">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>
