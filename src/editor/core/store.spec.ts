import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEditorStore } from './store'
import { createProject } from './schema'
import '@/editor/widgets'

function freshStore() {
  setActivePinia(createPinia())
  const store = useEditorStore()
  store.loadProject(createProject())
  return store
}

describe('editor store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds frames and widgets', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0)
    store.mutate(() => store.addWidget('pm-rect', frameId, 10, 20))
    expect(store.activeFrame?.tree).toHaveLength(1)
    expect(store.selectedNode?.type).toBe('pm-rect')
    expect(store.selectedNode?.x).toBe(10)
  })

  it('supports undo and redo', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0)
    store.mutate(() => store.addWidget('pm-rect', frameId, 0, 0))
    expect(store.project.frames[0]?.tree).toHaveLength(1)
    store.undo()
    expect(store.project.frames[0]?.tree).toHaveLength(0)
    store.redo()
    expect(store.project.frames[0]?.tree).toHaveLength(1)
  })

  it('nests widgets inside droppable containers', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0)
    const containerId = store.mutate(() => store.addWidget('pm-container', frameId, 0, 0))
    if (!containerId) throw new Error('container not created')
    store.mutate(() => store.addWidget('pm-text', frameId, 5, 5, containerId))
    expect(store.project.frames[0]?.tree).toHaveLength(1)
    expect(store.project.frames[0]?.tree[0]?.children).toHaveLength(1)
  })

  it('duplicates a frame with its widgets and size, without overlap', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0, { w: 390, h: 844 })
    store.mutate(() => store.addWidget('pm-rect', frameId, 10, 20))
    const copyId = store.mutate(() => store.duplicateFrame(frameId))
    if (!copyId) throw new Error('frame not duplicated')

    const source = store.project.frames[0]
    const copy = store.project.frames[1]
    expect(store.project.frames).toHaveLength(2)
    expect(copy?.w).toBe(390)
    expect(copy?.h).toBe(844)
    expect(copy?.tree).toHaveLength(1)
    expect(copy?.tree[0]?.id).not.toBe(source?.tree[0]?.id)
    expect(copy!.x).toBeGreaterThanOrEqual(source!.x + source!.w)
  })

  it('tracks comments per node', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0)
    const nodeId = store.mutate(() => store.addWidget('pm-rect', frameId, 0, 0))
    if (!nodeId) throw new Error('node not created')
    store.mutate(() => store.addComment(nodeId, '需要补充说明'))
    expect(store.commentCounts[nodeId]).toBe(1)
  })

  it('toggles multi-selection and only returns top-level roots', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0)
    const containerId = store.mutate(() => store.addWidget('pm-container', frameId, 0, 0))
    if (!containerId) throw new Error('container not created')
    const childId = store.mutate(() => store.addWidget('pm-text', frameId, 5, 5, containerId))
    if (!childId) throw new Error('child not created')

    store.select(null)
    store.toggleSelect(containerId)
    store.toggleSelect(childId)
    expect(store.selectedIds).toHaveLength(2)
    expect(store.selectedRootNodes.map((node) => node.id)).toEqual([containerId])

    store.toggleSelect(containerId)
    expect(store.selectedIds).toEqual([childId])
  })

  it('aligns a single node to the page', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0, { w: 1000, h: 600 })
    const nodeId = store.mutate(() => store.addWidget('pm-rect', frameId, 10, 20))
    if (!nodeId) throw new Error('node not created')
    const width = store.selectedNode!.w
    const height = store.selectedNode!.h

    store.alignSelection('right')
    expect(store.selectedNode!.x).toBe(1000 - width)
    store.alignSelection('bottom')
    expect(store.selectedNode!.y).toBe(600 - height)
  })

  it('aligns multiple nodes within the selection box', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0, { w: 1000, h: 600 })
    const first = store.mutate(() => store.addWidget('pm-rect', frameId, 0, 0))
    const second = store.mutate(() => store.addWidget('pm-rect', frameId, 100, 100))
    if (!first || !second) throw new Error('nodes not created')

    store.selectMany([first, second])
    store.alignSelection('right')
    const tree = store.project.frames[0]!.tree
    const firstNode = tree.find((node) => node.id === first)!
    const secondNode = tree.find((node) => node.id === second)!
    expect(firstNode.x).toBe(100)
    expect(secondNode.x).toBe(100)
  })

  it('distributes nodes with equal gaps', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0, { w: 1000, h: 600 })
    const a = store.mutate(() => store.addWidget('pm-rect', frameId, 0, 0))
    const b = store.mutate(() => store.addWidget('pm-rect', frameId, 50, 0))
    const c = store.mutate(() => store.addWidget('pm-rect', frameId, 400, 0))
    if (!a || !b || !c) throw new Error('nodes not created')

    store.selectMany([a, b, c])
    const width = store.selectedNode!.w
    store.distributeSelection('horizontal')

    const tree = store.project.frames[0]!.tree
    const ax = tree.find((node) => node.id === a)!.x
    const bx = tree.find((node) => node.id === b)!.x
    const cx = tree.find((node) => node.id === c)!.x
    expect(ax).toBe(0)
    expect(cx).toBe(400)
    expect(bx - (ax + width)).toBeCloseTo(cx - (bx + width), 6)
  })

  it('duplicates every node in the multi-selection', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0)
    const a = store.mutate(() => store.addWidget('pm-rect', frameId, 0, 0))
    const b = store.mutate(() => store.addWidget('pm-rect', frameId, 200, 0))
    if (!a || !b) throw new Error('nodes not created')

    store.selectMany([a, b])
    store.duplicateSelected()
    expect(store.project.frames[0]!.tree).toHaveLength(4)
    expect(store.selectedIds).toHaveLength(2)
    expect(store.selectedIds).not.toContain(a)
    expect(store.selectedIds).not.toContain(b)
  })

  it('removes descendant comments when deleting a container', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0)
    const containerId = store.mutate(() => store.addWidget('pm-container', frameId, 0, 0))
    if (!containerId) throw new Error('container not created')
    const childId = store.mutate(() => store.addWidget('pm-text', frameId, 5, 5, containerId))
    if (!childId) throw new Error('child not created')
    store.mutate(() => store.addComment(childId, '子节点评论'))
    expect(store.project.annotations[childId]).toHaveLength(1)

    store.mutate(() => store.removeNode(containerId))
    expect(store.project.annotations[childId]).toBeUndefined()
  })
})
