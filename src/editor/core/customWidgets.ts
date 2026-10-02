import { ref } from 'vue'
import { getStoredUser } from '@/api/http'
import { createId, type ID, type PMNode } from './schema'
import { cloneNode } from './tree'

export type CustomWidgetKind = 'svg' | 'node'

export interface CustomWidget {
  id: ID
  name: string
  kind: CustomWidgetKind
  w: number
  h: number
  svg?: string
  node?: PMNode
  createdAt: number
}

const BASE_KEY = 'pm_custom_widgets'

function storageKey(): string {
  return `${BASE_KEY}:${getStoredUser() || 'anonymous'}`
}

function read(): CustomWidget[] {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(storageKey())
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as CustomWidget[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(list: CustomWidget[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(storageKey(), JSON.stringify(list))
  } catch {
    throw new Error('本地存储空间不足，自定义组件未保存')
  }
}

export const customWidgets = ref<CustomWidget[]>(read())

export function reloadCustomWidgets(): void {
  customWidgets.value = read()
}

export function findCustomWidget(id: ID): CustomWidget | undefined {
  return customWidgets.value.find((item) => item.id === id)
}

export function addCustomSvg(name: string, svg: string, w: number, h: number): CustomWidget {
  const widget: CustomWidget = { id: createId('cw'), name, kind: 'svg', svg, w: Math.round(w), h: Math.round(h), createdAt: Date.now() }
  customWidgets.value = [...customWidgets.value, widget]
  write(customWidgets.value)
  return widget
}

export function addCustomNode(name: string, node: PMNode): CustomWidget {
  const widget: CustomWidget = {
    id: createId('cw'),
    name,
    kind: 'node',
    w: node.w,
    h: node.h,
    node: JSON.parse(JSON.stringify(node)) as PMNode,
    createdAt: Date.now()
  }
  customWidgets.value = [...customWidgets.value, widget]
  write(customWidgets.value)
  return widget
}

export function removeCustomWidget(id: ID): void {
  customWidgets.value = customWidgets.value.filter((item) => item.id !== id)
  write(customWidgets.value)
}

export function buildCustomNode(widget: CustomWidget, id: ID, x: number, y: number): PMNode {
  if (widget.kind === 'node' && widget.node) {
    const node = cloneNode(widget.node, createId)
    node.id = id
    node.x = Math.round(x)
    node.y = Math.round(y)
    return node
  }
  return {
    id,
    type: 'pm-custom',
    x: Math.round(x),
    y: Math.round(y),
    w: widget.w,
    h: widget.h,
    props: { name: widget.name, svg: widget.svg ?? '' },
    style: { background: 'transparent' }
  }
}
