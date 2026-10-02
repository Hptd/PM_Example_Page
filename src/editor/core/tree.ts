import type { Frame, ID, PMNode } from './schema'

export interface NodeLocation {
  frame: Frame
  node: PMNode
  parent: PMNode | null
  siblings: PMNode[]
  index: number
}

export interface WalkContext {
  parent: PMNode | null
  siblings: PMNode[]
  index: number
  offsetX: number
  offsetY: number
  depth: number
}

export function walkTree(
  nodes: PMNode[],
  visit: (node: PMNode, context: WalkContext) => boolean | void,
  context: Partial<WalkContext> = {}
): boolean {
  const parent = context.parent ?? null
  const offsetX = context.offsetX ?? 0
  const offsetY = context.offsetY ?? 0
  const depth = context.depth ?? 0
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!
    if (visit(node, { parent, siblings: nodes, index, offsetX, offsetY, depth }) === true) return true
    if (node.children?.length) {
      const stopped = walkTree(node.children, visit, {
        parent: node,
        offsetX: offsetX + node.x,
        offsetY: offsetY + node.y,
        depth: depth + 1
      })
      if (stopped) return true
    }
  }
  return false
}

export function findNode(frames: Frame[], id: ID): NodeLocation | null {
  for (const frame of frames) {
    let found: NodeLocation | null = null
    walkTree(frame.tree, (node, context) => {
      if (node.id !== id) return false
      found = { frame, node, parent: context.parent, siblings: context.siblings, index: context.index }
      return true
    })
    if (found) return found
  }
  return null
}

export function findFrame(frames: Frame[], id: ID): Frame | null {
  return frames.find((frame) => frame.id === id) ?? null
}

export function removeFromTree(frames: Frame[], id: ID): NodeLocation | null {
  const location = findNode(frames, id)
  if (!location) return null
  location.siblings.splice(location.index, 1)
  return location
}

export function isDescendant(root: PMNode, candidateId: ID): boolean {
  return walkTree(root.children ?? [], (node) => node.id === candidateId)
}

export function absolutePosition(frame: Frame, nodeId: ID): { x: number; y: number } | null {
  let found: { x: number; y: number } | null = null
  walkTree(frame.tree, (node, context) => {
    if (node.id !== nodeId) return false
    found = { x: context.offsetX + node.x, y: context.offsetY + node.y }
    return true
  })
  return found
}

export function cloneNode(node: PMNode, makeId: (prefix?: string) => ID): PMNode {
  const copy: PMNode = {
    ...node,
    id: makeId('n'),
    props: { ...node.props },
    style: { ...node.style }
  }
  if (node.children?.length) copy.children = node.children.map((child) => cloneNode(child, makeId))
  return copy
}
