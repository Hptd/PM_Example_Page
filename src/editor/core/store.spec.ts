import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEditorStore } from './store'
import { createProject } from './schema'

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

  it('tracks comments per node', () => {
    const store = freshStore()
    const frameId = store.addFrame(0, 0)
    const nodeId = store.mutate(() => store.addWidget('pm-rect', frameId, 0, 0))
    if (!nodeId) throw new Error('node not created')
    store.mutate(() => store.addComment(nodeId, '需要补充说明'))
    expect(store.commentCounts[nodeId]).toBe(1)
  })
})
