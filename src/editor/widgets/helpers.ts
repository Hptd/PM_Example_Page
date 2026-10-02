import { h, type VNode, type VNodeArrayChildren } from 'vue'
import type { PMNode } from '../core/schema'

export type StyleMap = Record<string, string | number>

export function baseStyle(node: PMNode, extra: StyleMap = {}): StyleMap {
  return {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    ...node.style,
    ...extra
  }
}

export function box(node: PMNode, children: VNodeArrayChildren | string, extra: StyleMap = {}): VNode {
  return h('div', { style: baseStyle(node, extra) }, children)
}

export function str(value: unknown, fallback = ''): string {
  return value === undefined || value === null ? fallback : String(value)
}

export function num(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function splitList(value: unknown): string[] {
  return str(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function centerText(node: PMNode, text: string): VNode {
  return box(node, text, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: node.style?.textAlign === 'center' ? 'center' : 'flex-start',
    padding: '0 8px',
    overflow: 'hidden'
  })
}
