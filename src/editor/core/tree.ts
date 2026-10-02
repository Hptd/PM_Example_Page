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

/** 收集节点及其整棵子树的 id */
export function collectSubtreeIds(root: PMNode): ID[] {
  const ids: ID[] = []
  const visit = (node: PMNode): void => {
    ids.push(node.id)
    node.children?.forEach(visit)
  }
  visit(root)
  return ids
}

function collectParentMap(frames: Frame[]): Map<ID, ID> {
  const parents = new Map<ID, ID>()
  for (const frame of frames) {
    walkTree(frame.tree, (node, context) => {
      if (context.parent) parents.set(node.id, context.parent.id)
    })
  }
  return parents
}

/** 过滤掉已被其它选中节点包含的后代，避免同一子树被重复操作 */
export function topLevelIds(frames: Frame[], ids: ID[]): ID[] {
  const parents = collectParentMap(frames)
  const set = new Set(ids)
  return ids.filter((id) => {
    let parentId = parents.get(id)
    while (parentId) {
      if (set.has(parentId)) return false
      parentId = parents.get(parentId)
    }
    return true
  })
}

/** 返回与给定世界坐标矩形相交的顶层节点 id（用于框选） */
export function nodesInWorldRect(frames: Frame[], rect: { x: number; y: number; w: number; h: number }): ID[] {
  const ids: ID[] = []
  const visit = (node: PMNode, offsetX: number, offsetY: number): void => {
    if (node.hidden) return
    const x = offsetX + node.x
    const y = offsetY + node.y
    const intersects = x < rect.x + rect.w && x + node.w > rect.x && y < rect.y + rect.h && y + node.h > rect.y
    if (intersects) ids.push(node.id)
    if (node.children?.length) {
      for (const child of node.children) visit(child, x, y)
    }
  }
  for (const frame of frames) {
    for (const node of frame.tree) visit(node, frame.x, frame.y)
  }
  return topLevelIds(frames, ids)
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

/** 一次遍历收集多个节点的引用与绝对位置 */
export function collectNodes(frame: Frame, ids: ID[]): Map<ID, { node: PMNode; x: number; y: number }> {
  const result = new Map<ID, { node: PMNode; x: number; y: number }>()
  if (!ids.length) return result
  const wanted = new Set(ids)
  walkTree(frame.tree, (node, context) => {
    if (wanted.has(node.id)) result.set(node.id, { node, x: context.offsetX + node.x, y: context.offsetY + node.y })
  })
  return result
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
