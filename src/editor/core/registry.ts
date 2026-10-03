import type { VNode } from 'vue'
import type { PMNode } from './schema'

export type PropFieldType = 'text' | 'textarea' | 'number' | 'color' | 'select' | 'boolean' | 'icon'

export interface PropField {
  key: string
  label: string
  type: PropFieldType
  options?: { label: string; value: string | number }[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
  iconSet?: 'tabler' | 'simple-icons' | 'all'
}

export type WidgetCategory = 'basic' | 'form' | 'data' | 'nav' | 'custom'

export interface TextEditorDef {
  key: string
  multiline?: boolean
  align?: 'left' | 'center'
}

export interface WidgetDef {
  type: string
  name: string
  category: WidgetCategory
  icon: string
  order: number
  defaultSize: { w: number; h: number }
  defaultProps: Record<string, unknown>
  defaultStyle: Record<string, string | number>
  droppable?: boolean
  textEditor?: TextEditorDef
  propSchema: PropField[]
  render(node: PMNode, children: VNode[]): VNode
}

export const WIDGET_CATEGORIES: { key: WidgetCategory; name: string }[] = [
  { key: 'basic', name: '基础绘图' },
  { key: 'form', name: '表单控件' },
  { key: 'data', name: '数据展示' },
  { key: 'nav', name: '导航容器' }
]

class WidgetRegistry {
  private defs = new Map<string, WidgetDef>()

  register(def: WidgetDef): void {
    if (this.defs.has(def.type)) {
      throw new Error(`重复注册组件类型：${def.type}`)
    }
    this.defs.set(def.type, def)
  }

  get(type: string): WidgetDef | undefined {
    return this.defs.get(type)
  }

  has(type: string): boolean {
    return this.defs.has(type)
  }

  list(category?: WidgetCategory): WidgetDef[] {
    const all = [...this.defs.values()].sort((a, b) => a.order - b.order)
    return category ? all.filter((def) => def.category === category) : all
  }
}

export const registry = new WidgetRegistry()

export function displayName(node: PMNode): string {
  return node.name || registry.get(node.type)?.name || node.type
}
