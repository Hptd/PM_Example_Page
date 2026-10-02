<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../core/store'
import { registry, type PropField as PropFieldDef } from '../core/registry'
import PropField from '../components/PropField.vue'

const store = useEditorStore()

const node = computed(() => store.selectedNode)
const frame = computed(() => store.activeFrame)
const def = computed(() => (node.value ? registry.get(node.value.type) : undefined))

const appearanceFields: PropFieldDef[] = [
  { key: 'background', label: '填充', type: 'color' },
  { key: 'border', label: '边框', type: 'text', placeholder: '1px solid #cbd5e1' },
  { key: 'borderRadius', label: '圆角', type: 'text', placeholder: '8px' },
  { key: 'color', label: '文字颜色', type: 'color' },
  { key: 'fontSize', label: '字号', type: 'text', placeholder: '14px' },
  {
    key: 'fontWeight',
    label: '字重',
    type: 'select',
    options: [
      { label: '常规', value: '400' },
      { label: '中等', value: '500' },
      { label: '加粗', value: '600' }
    ]
  },
  {
    key: 'textAlign',
    label: '对齐',
    type: 'select',
    options: [
      { label: '左对齐', value: 'left' },
      { label: '居中', value: 'center' },
      { label: '右对齐', value: 'right' }
    ]
  },
  { key: 'opacity', label: '透明度', type: 'number', min: 0, max: 1, step: 0.1 },
  { key: 'boxShadow', label: '阴影', type: 'text', placeholder: '0 2px 8px rgba(0,0,0,.1)' }
]

function commitGeometry(key: 'x' | 'y' | 'w' | 'h' | 'rotation', value: number) {
  const current = node.value
  if (!current) return
  store.mutate(() => store.updateNodeGeometry(current.id, { [key]: value }))
}

function commitStyle(key: string, value: string | number) {
  const current = node.value
  if (!current) return
  store.mutate(() => store.updateNodeStyle(current.id, { [key]: value }))
}

function commitProp(key: string, value: unknown) {
  const current = node.value
  if (!current) return
  store.mutate(() => store.updateNodeProps(current.id, { [key]: value }))
}

function onGeometryInput(key: 'x' | 'y' | 'w' | 'h' | 'rotation', event: Event) {
  const parsed = Number((event.target as HTMLInputElement).value)
  commitGeometry(key, Number.isFinite(parsed) ? parsed : 0)
}

function commitFrame(patch: { name?: string; w?: number; h?: number; background?: string }) {
  const current = frame.value
  if (!current) return
  store.mutate(() => store.updateFrame(current.id, patch))
}

function onFrameName(event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  if (value) commitFrame({ name: value })
}

function onFrameSize(key: 'w' | 'h', event: Event) {
  const parsed = Number((event.target as HTMLInputElement).value)
  commitFrame({ [key]: Number.isFinite(parsed) ? Math.max(40, parsed) : 100 })
}

function onFrameBackground(event: Event) {
  commitFrame({ background: (event.target as HTMLInputElement).value })
}

function onLayer(direction: 'front' | 'back' | 'up' | 'down') {
  const current = node.value
  if (!current) return
  store.mutate(() => store.reorderNode(current.id, direction))
}
</script>

<template>
  <div class="panel properties">
    <template v-if="!node">
      <p v-if="!frame" class="panel-empty">选中画布中的组件后，可在此编辑属性</p>
      <section v-else class="prop-section">
        <h4>页面设置</h4>
        <label class="field">
          <span class="field__label">名称</span>
          <input class="field__control" :value="frame.name" @change="onFrameName" />
        </label>
        <div class="prop-grid">
          <label>宽<input type="number" :value="frame.w" @change="onFrameSize('w', $event)" /></label>
          <label>高<input type="number" :value="frame.h" @change="onFrameSize('h', $event)" /></label>
        </div>
        <label class="field">
          <span class="field__label">背景</span>
          <input class="field__control field__control--color" type="color" :value="frame.background" @input="onFrameBackground" />
        </label>
      </section>
    </template>

    <template v-else>
      <section class="prop-section">
        <h4>几何</h4>
        <div class="prop-grid">
          <label>X<input type="number" :value="node.x" @change="onGeometryInput('x', $event)" /></label>
          <label>Y<input type="number" :value="node.y" @change="onGeometryInput('y', $event)" /></label>
          <label>宽<input type="number" :value="node.w" @change="onGeometryInput('w', $event)" /></label>
          <label>高<input type="number" :value="node.h" @change="onGeometryInput('h', $event)" /></label>
          <label>旋转<input type="number" :value="node.rotation ?? 0" @change="onGeometryInput('rotation', $event)" /></label>
        </div>
        <div class="prop-layer">
          <button @click="onLayer('back')">置底</button>
          <button @click="onLayer('down')">下移</button>
          <button @click="onLayer('up')">上移</button>
          <button @click="onLayer('front')">置顶</button>
        </div>
      </section>

      <section class="prop-section">
        <h4>外观</h4>
        <prop-field
          v-for="field in appearanceFields"
          :key="field.key"
          :field="field"
          :value="node.style[field.key]"
          @update="commitStyle(field.key, $event as string | number)"
        />
      </section>

      <section v-if="def && def.propSchema.length" class="prop-section">
        <h4>组件属性</h4>
        <prop-field
          v-for="field in def.propSchema"
          :key="field.key"
          :field="field"
          :value="node.props[field.key]"
          @update="commitProp(field.key, $event)"
        />
      </section>
    </template>
  </div>
</template>
