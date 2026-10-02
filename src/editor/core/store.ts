import { defineStore } from 'pinia'
import '@/editor/widgets'
import { registry } from './registry'
import {
  createFrame,
  createId,
  createProject,
  type Comment,
  type Frame,
  type ID,
  type PMNode,
  type Project,
  type Viewport
} from './schema'
import { cloneNode, findFrame, findNode, removeFromTree } from './tree'
import { nextFramePosition } from './framePresets'
import { buildCustomNode, findCustomWidget } from './customWidgets'

const HISTORY_LIMIT = 100

function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project)) as Project
}

export const useEditorStore = defineStore('editor', {
  state: () => ({
    project: createProject(),
    projectFileId: null as string | null,
    selectedId: null as ID | null,
    activeFrameId: null as ID | null,
    clipboard: null as PMNode | null,
    past: [] as Project[],
    future: [] as Project[],
    dirty: false
  }),

  getters: {
    selectedNode(state): PMNode | null {
      if (!state.selectedId) return null
      return findNode(state.project.frames, state.selectedId)?.node ?? null
    },
    selectedLocation(state) {
      if (!state.selectedId) return null
      return findNode(state.project.frames, state.selectedId)
    },
    activeFrame(state): Frame | null {
      return state.activeFrameId ? findFrame(state.project.frames, state.activeFrameId) : null
    },
    canUndo(state): boolean {
      return state.past.length > 0
    },
    canRedo(state): boolean {
      return state.future.length > 0
    },
    commentCounts(state): Record<ID, number> {
      const counts: Record<ID, number> = {}
      for (const [nodeId, list] of Object.entries(state.project.annotations)) {
        if (list.length) counts[nodeId] = list.length
      }
      return counts
    }
  },

  actions: {
    loadProject(project: Project, fileId: string | null = null) {
      this.project = project
      this.projectFileId = fileId
      this.past = []
      this.future = []
      this.selectedId = null
      this.activeFrameId = project.frames[0]?.id ?? null
      this.clipboard = null
      this.dirty = false
    },

    pushHistory() {
      this.past.push(cloneProject(this.project))
      if (this.past.length > HISTORY_LIMIT) this.past.shift()
      this.future = []
      this.dirty = true
    },

    mutate<T>(fn: () => T): T {
      this.pushHistory()
      return fn()
    },

    undo() {
      const previous = this.past.pop()
      if (!previous) return
      this.future.push(cloneProject(this.project))
      this.project = previous
      this.dirty = true
      this.ensureSelection()
    },

    redo() {
      const next = this.future.pop()
      if (!next) return
      this.past.push(cloneProject(this.project))
      this.project = next
      this.dirty = true
      this.ensureSelection()
    },

    ensureSelection() {
      if (this.selectedId && !findNode(this.project.frames, this.selectedId)) {
        this.selectedId = null
      }
      if (this.activeFrameId && !findFrame(this.project.frames, this.activeFrameId)) {
        this.activeFrameId = this.project.frames[0]?.id ?? null
      }
    },

    select(id: ID | null) {
      this.selectedId = id
      if (id) {
        const location = findNode(this.project.frames, id)
        if (location) this.activeFrameId = location.frame.id
      }
    },

    setViewport(viewport: Viewport) {
      this.project.viewport = viewport
    },

    renameProject(name: string) {
      this.project.name = name
    },

    addFrame(x = 40, y = 40, size: { w: number; h: number } = { w: 1280, h: 800 }): ID {
      const frame = createFrame({ x, y, w: size.w, h: size.h })
      this.project.frames.push(frame)
      this.activeFrameId = frame.id
      this.selectedId = null
      this.dirty = true
      return frame.id
    },

    duplicateFrame(id: ID): ID | null {
      const source = findFrame(this.project.frames, id)
      if (!source) return null
      const position = nextFramePosition(this.project.frames)
      const copy: Frame = {
        ...source,
        id: createId('f'),
        name: `${source.name} 副本`,
        x: position.x,
        y: position.y,
        tree: source.tree.map((node) => cloneNode(node, createId))
      }
      this.project.frames.push(copy)
      this.activeFrameId = copy.id
      this.selectedId = null
      this.dirty = true
      return copy.id
    },

    removeFrame(id: ID) {
      const index = this.project.frames.findIndex((frame) => frame.id === id)
      if (index < 0) return
      this.project.frames.splice(index, 1)
      if (this.activeFrameId === id) this.activeFrameId = this.project.frames[0]?.id ?? null
      this.dirty = true
    },

    updateFrame(id: ID, patch: Partial<Frame>) {
      const frame = findFrame(this.project.frames, id)
      if (frame) {
        Object.assign(frame, patch)
        this.dirty = true
      }
    },

    addWidget(type: string, frameId: ID, x: number, y: number, parentId: ID | null = null): ID | null {
      const def = registry.get(type)
      if (!def) return null
      const node: PMNode = {
        id: createId('n'),
        type,
        x: Math.round(x),
        y: Math.round(y),
        w: def.defaultSize.w,
        h: def.defaultSize.h,
        props: { ...def.defaultProps },
        style: { ...def.defaultStyle }
      }
      if (def.droppable) node.children = []
      this.addNode(frameId, node, parentId)
      this.select(node.id)
      this.dirty = true
      return node.id
    },

    addCustom(customId: ID, frameId: ID, x: number, y: number, parentId: ID | null = null): ID | null {
      const widget = findCustomWidget(customId)
      if (!widget) return null
      const id = createId('n')
      this.addNode(frameId, buildCustomNode(widget, id, x, y), parentId)
      this.select(id)
      this.dirty = true
      return id
    },

    addNode(frameId: ID, node: PMNode, parentId: ID | null = null) {
      const frame = findFrame(this.project.frames, frameId)
      if (!frame) return
      if (parentId) {
        const location = findNode(this.project.frames, parentId)
        if (location && registry.get(location.node.type)?.droppable) {
          if (!location.node.children) location.node.children = []
          location.node.children.push(node)
          return
        }
      }
      frame.tree.push(node)
    },

    removeNode(id: ID) {
      removeFromTree(this.project.frames, id)
      delete this.project.annotations[id]
      if (this.selectedId === id) this.selectedId = null
      this.dirty = true
    },

    removeSelected() {
      const id = this.selectedId
      if (!id) return
      this.mutate(() => this.removeNode(id))
    },

    moveNode(id: ID, x: number, y: number) {
      const location = findNode(this.project.frames, id)
      if (!location || location.node.locked) return
      location.node.x = Math.round(x)
      location.node.y = Math.round(y)
      this.dirty = true
    },

    resizeNode(id: ID, rect: { x: number; y: number; w: number; h: number }) {
      const location = findNode(this.project.frames, id)
      if (!location || location.node.locked) return
      location.node.x = Math.round(rect.x)
      location.node.y = Math.round(rect.y)
      location.node.w = Math.round(rect.w)
      location.node.h = Math.round(rect.h)
      this.dirty = true
    },

    updateNodeGeometry(id: ID, patch: Partial<Pick<PMNode, 'x' | 'y' | 'w' | 'h' | 'rotation'>>) {
      const location = findNode(this.project.frames, id)
      if (!location) return
      if (patch.x !== undefined) location.node.x = Math.round(patch.x)
      if (patch.y !== undefined) location.node.y = Math.round(patch.y)
      if (patch.w !== undefined) location.node.w = Math.max(8, Math.round(patch.w))
      if (patch.h !== undefined) location.node.h = Math.max(8, Math.round(patch.h))
      if (patch.rotation !== undefined) location.node.rotation = patch.rotation
      this.dirty = true
    },

    updateNodeProps(id: ID, patch: Record<string, unknown>) {
      const location = findNode(this.project.frames, id)
      if (!location) return
      Object.assign(location.node.props, patch)
      this.dirty = true
    },

    updateNodeStyle(id: ID, patch: Record<string, string | number>) {
      const location = findNode(this.project.frames, id)
      if (!location) return
      for (const [key, value] of Object.entries(patch)) {
        if (value === '' || value === undefined) delete location.node.style[key]
        else location.node.style[key] = value
      }
      this.dirty = true
    },

    updateNodeMeta(id: ID, patch: Partial<Pick<PMNode, 'name' | 'locked' | 'hidden' | 'rotation'>>) {
      const location = findNode(this.project.frames, id)
      if (!location) return
      Object.assign(location.node, patch)
      this.dirty = true
    },

    reorderNode(id: ID, direction: 'front' | 'back' | 'up' | 'down') {
      const location = findNode(this.project.frames, id)
      if (!location) return
      const { siblings, index } = location
      let target = index
      if (direction === 'front') target = siblings.length - 1
      else if (direction === 'back') target = 0
      else if (direction === 'up') target = Math.min(siblings.length - 1, index + 1)
      else target = Math.max(0, index - 1)
      if (target === index) return
      const [node] = siblings.splice(index, 1)
      if (node) siblings.splice(target, 0, node)
      this.dirty = true
    },

    copySelected() {
      const location = this.selectedLocation
      if (location) this.clipboard = cloneNode(location.node, createId)
    },

    pasteClipboard() {
      if (!this.clipboard || !this.activeFrameId) return
      const copy = cloneNode(this.clipboard, createId)
      copy.x += 16
      copy.y += 16
      this.mutate(() => this.addNode(this.activeFrameId!, copy))
      this.select(copy.id)
    },

    duplicateSelected() {
      const location = this.selectedLocation
      if (!location || !this.activeFrameId) return
      const copy = cloneNode(location.node, createId)
      copy.x += 16
      copy.y += 16
      this.mutate(() => this.addNode(location.frame.id, copy))
      this.select(copy.id)
    },

    updateNodeSize(id: ID, w: number, h: number) {
      const location = findNode(this.project.frames, id)
      if (!location) return
      location.node.w = Math.max(8, Math.round(w))
      location.node.h = Math.max(8, Math.round(h))
      this.dirty = true
    },

    addComment(nodeId: ID, text: string, author = '我'): Comment | null {
      const trimmed = text.trim()
      if (!trimmed) return null
      const comment: Comment = {
        id: createId('c'),
        text: trimmed,
        author,
        createdAt: Date.now(),
        resolved: false
      }
      const list = this.project.annotations[nodeId] ?? []
      list.push(comment)
      this.project.annotations[nodeId] = list
      this.dirty = true
      return comment
    },

    removeComment(nodeId: ID, commentId: ID) {
      const list = this.project.annotations[nodeId]
      if (!list) return
      const index = list.findIndex((comment) => comment.id === commentId)
      if (index >= 0) list.splice(index, 1)
      if (!list.length) delete this.project.annotations[nodeId]
      this.dirty = true
    },

    toggleCommentResolved(nodeId: ID, commentId: ID) {
      const comment = this.project.annotations[nodeId]?.find((item) => item.id === commentId)
      if (comment) {
        comment.resolved = !comment.resolved
        this.dirty = true
      }
    }
  }
})
