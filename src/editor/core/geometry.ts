export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Easing {
  x: number
  y: number
  zoom: number
}

export function screenToWorld(point: Point, view: Easing): Point {
  return {
    x: point.x / view.zoom + view.x,
    y: point.y / view.zoom + view.y
  }
}

export function worldToScreen(point: Point, view: Easing): Point {
  return {
    x: (point.x - view.x) * view.zoom,
    y: (point.y - view.y) * view.zoom
  }
}

export function clampZoom(zoom: number): number {
  return Math.min(4, Math.max(0.1, zoom))
}

export interface SnapResult {
  x: number
  y: number
  guides: { vertical: number[]; horizontal: number[] }
}

export interface SnapBox {
  x: number
  y: number
  w: number
  h: number
}

export function snapRect(target: SnapBox, others: SnapBox[], threshold: number): SnapResult {
  const guides: { vertical: number[]; horizontal: number[] } = { vertical: [], horizontal: [] }
  let x = target.x
  let y = target.y
  let bestX = threshold
  let bestY = threshold

  const targetVx = [target.x, target.x + target.w / 2, target.x + target.w]
  const targetHy = [target.y, target.y + target.h / 2, target.y + target.h]

  for (const other of others) {
    const otherVx = [other.x, other.x + other.w / 2, other.x + other.w]
    const otherHy = [other.y, other.y + other.h / 2, other.y + other.h]

    for (const tv of targetVx) {
      for (const ov of otherVx) {
        const diff = ov - tv
        if (Math.abs(diff) < bestX) {
          bestX = Math.abs(diff)
          x = target.x + diff
        }
      }
    }
    for (const th of targetHy) {
      for (const oh of otherHy) {
        const diff = oh - th
        if (Math.abs(diff) < bestY) {
          bestY = Math.abs(diff)
          y = target.y + diff
        }
      }
    }
  }

  if (bestX < threshold) guides.vertical.push(x, x + target.w / 2, x + target.w)
  if (bestY < threshold) guides.horizontal.push(y, y + target.h / 2, y + target.h)

  return { x, y, guides }
}

export const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const
export type ResizeHandle = (typeof RESIZE_HANDLES)[number]

export function resizeRect(rect: Rect, handle: ResizeHandle, dx: number, dy: number, minSize = 8): Rect {
  let { x, y, w, h } = rect
  if (handle.includes('e')) w = Math.max(minSize, rect.w + dx)
  if (handle.includes('s')) h = Math.max(minSize, rect.h + dy)
  if (handle.includes('w')) {
    const nextW = Math.max(minSize, rect.w - dx)
    x = rect.x + (rect.w - nextW)
    w = nextW
  }
  if (handle.includes('n')) {
    const nextH = Math.max(minSize, rect.h - dy)
    y = rect.y + (rect.h - nextH)
    h = nextH
  }
  return { x, y, w, h }
}
