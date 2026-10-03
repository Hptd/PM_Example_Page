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

export function fitSize(size: { w: number; h: number }, maxW: number, maxH: number): { w: number; h: number } {
  const w = Math.max(1, Math.round(size.w))
  const h = Math.max(1, Math.round(size.h))
  const scale = Math.min(1, maxW / w, maxH / h)
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) }
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

export function resizeRect(
  rect: Rect,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  minSize = 8,
  keepAspect = false
): Rect {
  let { x, y, w, h } = rect
  const hasE = handle.includes('e')
  const hasW = handle.includes('w')
  const hasS = handle.includes('s')
  const hasN = handle.includes('n')

  if (hasE) w = Math.max(minSize, rect.w + dx)
  if (hasS) h = Math.max(minSize, rect.h + dy)
  if (hasW) {
    const nextW = Math.max(minSize, rect.w - dx)
    x = rect.x + (rect.w - nextW)
    w = nextW
  }
  if (hasN) {
    const nextH = Math.max(minSize, rect.h - dy)
    y = rect.y + (rect.h - nextH)
    h = nextH
  }

  const ratio = rect.h !== 0 ? rect.w / rect.h : 1
  if (keepAspect && ratio > 0) {
    if ((hasE || hasW) && (hasS || hasN)) {
      if (w / ratio >= h) h = w / ratio
      else w = h * ratio
      if (hasW) x = rect.x + rect.w - w
      if (hasN) y = rect.y + rect.h - h
    } else if (hasE || hasW) {
      h = w / ratio
      y = rect.y + (rect.h - h) / 2
    } else if (hasS || hasN) {
      w = h * ratio
      x = rect.x + (rect.w - w) / 2
    }
  }

  return { x, y, w, h }
}
