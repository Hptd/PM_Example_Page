import type { PMNode } from './schema'
import type { Point } from './geometry'

export function hitTest(nodes: PMNode[], point: Point): PMNode | null {
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index]!
    if (node.hidden) continue
    if (point.x >= node.x && point.x <= node.x + node.w && point.y >= node.y && point.y <= node.y + node.h) {
      if (node.children?.length) {
        const child = hitTest(node.children, { x: point.x - node.x, y: point.y - node.y })
        if (child) return child
      }
      return node
    }
  }
  return null
}

export interface Anchor {
  nodeId: string
  x: number
  y: number
  count: number
}

export function collectAnchors(nodes: PMNode[], annotations: Record<string, unknown[]>, offsetX = 0, offsetY = 0): Anchor[] {
  const result: Anchor[] = []
  for (const node of nodes) {
    const count = annotations[node.id]?.length ?? 0
    if (count) result.push({ nodeId: node.id, x: offsetX + node.x + node.w, y: offsetY + node.y, count })
    if (node.children?.length) {
      result.push(...collectAnchors(node.children, annotations, offsetX + node.x, offsetY + node.y))
    }
  }
  return result
}
