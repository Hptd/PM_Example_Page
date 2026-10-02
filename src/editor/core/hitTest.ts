import type { PMNode } from './schema'
import type { Point } from './geometry'
import { walkTree } from './tree'

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
  walkTree(
    nodes,
    (node, context) => {
      const count = annotations[node.id]?.length ?? 0
      if (count) result.push({ nodeId: node.id, x: context.offsetX + node.x + node.w, y: context.offsetY + node.y, count })
    },
    { offsetX, offsetY }
  )
  return result
}
