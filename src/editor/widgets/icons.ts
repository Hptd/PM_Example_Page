import { h, type VNode } from 'vue'
import { icons as tablerSet } from '@iconify-json/tabler'
import { icons as simpleSet } from '@iconify-json/simple-icons'

interface IconSetData {
  width?: number
  height?: number
  icons: Record<string, { body: string }>
}

const SETS: Record<string, IconSetData> = {
  tabler: tablerSet,
  'simple-icons': simpleSet
}

const NAME_CACHE = new Map<string, string[]>()

export function iconNames(prefix: 'tabler' | 'simple-icons'): string[] {
  const cached = NAME_CACHE.get(prefix)
  if (cached) return cached
  const names = Object.keys(SETS[prefix]!.icons).map((key) => `${prefix}:${key}`)
  NAME_CACHE.set(prefix, names)
  return names
}

export function resolveIconName(name: string): string {
  return name.includes(':') ? name : `tabler:${name}`
}

export function iconExists(name: string): boolean {
  const [prefix, key] = resolveIconName(name).split(':') as [string, string]
  return Boolean(SETS[prefix]?.icons[key])
}

export function iconBody(name: string): { body: string; size: number } | null {
  const [prefix, key] = resolveIconName(name).split(':') as [string, string]
  const set = SETS[prefix]
  const data = set?.icons[key]
  if (!set || !data) return null
  return { body: data.body, size: set.width ?? 24 }
}

export function renderIcon(name: string, color?: string, size?: string): VNode {
  const resolved = iconBody(name)
  const base: Record<string, unknown> = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: `0 0 ${resolved?.size ?? 24} ${resolved?.size ?? 24}`,
    style: {
      width: size ?? '100%',
      height: size ?? '100%',
      display: 'block',
      color: color ?? 'currentColor',
      fill: color ?? 'currentColor'
    }
  }
  if (!resolved) {
    return h('svg', base, [
      h('rect', {
        x: 3,
        y: 3,
        width: 18,
        height: 18,
        rx: 3,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.5
      })
    ])
  }
  return h('svg', { ...base, innerHTML: resolved.body })
}
