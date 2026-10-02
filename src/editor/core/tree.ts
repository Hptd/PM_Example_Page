import type { Frame, ID, PMNode } from './schema'

export interface NodeLocation {
  frame: Frame
  node: PMNode
  parent: PMNode | null
  siblings: PMNode[]
  index: number
}

export function walk(nodes: PMNode[], visit: (node: PMNode, parent: PMNode | null) => void, parent: PMNode | null = null): void {
  for (const node of nodes) {
    visit(node, parent)
    if (node.children?.length) walk(node.children, visit, node)
  }
}

export function findNode(frames: Frame[], id: ID): NodeLocation | null {
  for (const frame of frames) {
    const found = findInList(frame.tree, id, frame, null)
    if (found) return found
  }
  return null
}

function findInList(list: PMNode[], id: ID, frame: Frame, parent: PMNode | null): NodeLocation | null {
  for (let index = 0; index < list.length; index += 1) {
    const node = list[index]!
    if (node.id === id) return { frame, node, parent, siblings: list, index }
    if (node.children?.length) {
      const found = findInList(node.children, id, frame, node)
      if (found) return found
    }
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
  if (!root.children?.length) return false
  for (const child of root.children) {
    if (child.id === candidateId) return true
    if (isDescendant(child, candidateId)) return true
  }
  return false
}

export function absolutePosition(frame: Frame, nodeId: ID): { x: number; y: number } | null {
  function walk(nodes: PMNode[], offsetX: number, offsetY: number): { x: number; y: number } | null {
    for (const node of nodes) {
      if (node.id === nodeId) return { x: offsetX + node.x, y: offsetY + node.y }
      if (node.children?.length) {
        const found = walk(node.children, offsetX + node.x, offsetY + node.y)
        if (found) return found
      }
    }
    return null
  }
  return walk(frame.tree, 0, 0)
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
