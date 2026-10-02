import { h, ref, type VNode } from 'vue'

interface IconSetData {
  width?: number
  height?: number
  icons: Record<string, { body: string }>
}

export type IconPrefix = 'tabler' | 'simple-icons'

const SETS: Partial<Record<IconPrefix, IconSetData>> = {}
const NAME_CACHE = new Map<IconPrefix, string[]>()
const LOADING = new Map<IconPrefix, Promise<void>>()

const iconDataVersion = ref(0)

function isIconPrefix(value: string): value is IconPrefix {
  return value === 'tabler' || value === 'simple-icons'
}

async function loadSet(prefix: IconPrefix): Promise<void> {
  if (SETS[prefix]) return
  const pending = LOADING.get(prefix)
  if (pending) return pending
  const task = (async () => {
    const mod = prefix === 'tabler' ? await import('@iconify-json/tabler') : await import('@iconify-json/simple-icons')
    SETS[prefix] = mod.icons as IconSetData
    NAME_CACHE.delete(prefix)
    iconDataVersion.value += 1
  })().finally(() => LOADING.delete(prefix))
  LOADING.set(prefix, task)
  return task
}

function ensureIconSet(prefix: IconPrefix): void {
  void loadSet(prefix)
}

export async function loadAllIconSets(): Promise<void> {
  await Promise.all((['tabler', 'simple-icons'] as IconPrefix[]).map((prefix) => loadSet(prefix)))
}

function resolveIconName(name: string): string {
  return name.includes(':') ? name : `tabler:${name}`
}

export function iconNames(prefix: IconPrefix): string[] {
  iconDataVersion.value
  const set = SETS[prefix]
  if (!set) {
    ensureIconSet(prefix)
    return []
  }
  const cached = NAME_CACHE.get(prefix)
  if (cached) return cached
  const names = Object.keys(set.icons).map((key) => `${prefix}:${key}`)
  NAME_CACHE.set(prefix, names)
  return names
}

export function iconBody(name: string): { body: string; size: number } | null {
  iconDataVersion.value
  const [prefix, key] = resolveIconName(name).split(':') as [string, string]
  if (!isIconPrefix(prefix)) return null
  const set = SETS[prefix]
  if (!set) {
    ensureIconSet(prefix)
    return null
  }
  const data = set.icons[key]
  if (!data) return null
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
