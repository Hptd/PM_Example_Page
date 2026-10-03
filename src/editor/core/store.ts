import { defineStore } from 'pinia'
import { registry } from './registry'
import {
  countComments,
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
import {
  absolutePosition,
  cloneNode,
  collectSubtreeIds,
  findFrame,
  findNode,
  removeFromTree,
  topLevelIds
} from './tree'
import { nextFramePosition } from './framePresets'
import { fitSize } from './geometry'
import { buildCustomNode, findCustomWidget } from './customWidgets'

const HISTORY_LIMIT = 100

export type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom'
export type DistributeAxis = 'horizontal' | 'vertical'

interface SelectionTarget {
  node: PMNode
  offsetX: number
  offsetY: number
}

function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project)) as Project
}

export const useEditorStore = defineStore('editor', {
  state: () => ({
    project: createProject(),
    projectFileId: null as string | null,
    selectedIds: [] as ID[],
    activeFrameId: null as ID | null,
    clipboard: [] as PMNode[],
    past: [] as Project[],
    future: [] as Project[],
    dirty: false
  }),

  getters: {
    selectedId(state): ID | null {
      return state.selectedIds.length ? state.selectedIds[state.selectedIds.length - 1]! : null
    },
    selectedNode(state): PMNode | null {
      const id = state.selectedIds[state.selectedIds.length - 1]
      return id ? findNode(state.project.frames, id)?.node ?? null : null
    },
    selectedLocation(state) {
      const id = state.selectedIds[state.selectedIds.length - 1]
      return id ? findNode(state.project.frames, id) : null
    },
    selectedNodes(state): PMNode[] {
      return state.selectedIds
        .map((id) => findNode(state.project.frames, id)?.node)
        .filter((node): node is PMNode => Boolean(node))
    },
    selectedRootNodes(state): PMNode[] {
      return topLevelIds(state.project.frames, state.selectedIds)
        .map((id) => findNode(state.project.frames, id)?.node)
        .filter((node): node is PMNode => Boolean(node))
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
      return countComments(state.project.annotations)
    }
  },

  actions: {
    loadProject(project: Project, fileId: string | null = null) {
      this.project = project
      this.projectFileId = fileId
      this.past = []
      this.future = []
      this.selectedIds = []
      this.activeFrameId = project.frames[0]?.id ?? null
      this.clipboard = []
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
      this.selectedIds = this.selectedIds.filter((id) => findNode(this.project.frames, id))
      if (this.activeFrameId && !findFrame(this.project.frames, this.activeFrameId)) {
        this.activeFrameId = this.project.frames[0]?.id ?? null
      }
    },

    select(id: ID | null) {
      this.selectedIds = id ? [id] : []
      if (id) {
        const location = findNode(this.project.frames, id)
        if (location) this.activeFrameId = location.frame.id
      }
    },

    toggleSelect(id: ID) {
      const has = this.selectedIds.includes(id)
      this.selectedIds = has ? this.selectedIds.filter((item) => item !== id) : [...this.selectedIds, id]
      if (!has) {
        const location = findNode(this.project.frames, id)
        if (location) this.activeFrameId = location.frame.id
      }
    },

    selectMany(ids: ID[]) {
      this.selectedIds = [...ids]
      const location = ids.length ? findNode(this.project.frames, ids[0]!) : null
      if (location) this.activeFrameId = location.frame.id
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
      this.selectedIds = []
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
      this.selectedIds = []
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
      this.addNodeAndSelect(frameId, node, parentId)
      return node.id
    },

    addCustom(customId: ID, frameId: ID, x: number, y: number, parentId: ID | null = null): ID | null {
      const widget = findCustomWidget(customId)
      if (!widget) return null
      const id = createId('n')
      this.addNodeAndSelect(frameId, buildCustomNode(widget, id, x, y), parentId)
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

    addNodeAndSelect(frameId: ID, node: PMNode, parentId: ID | null = null) {
      this.addNode(frameId, node, parentId)
      this.select(node.id)
      this.dirty = true
    },

    removeNode(id: ID) {
      const location = findNode(this.project.frames, id)
      if (!location) return
      const removedIds = collectSubtreeIds(location.node)
      removeFromTree(this.project.frames, id)
      for (const removedId of removedIds) delete this.project.annotations[removedId]
      const removed = new Set(removedIds)
      this.selectedIds = this.selectedIds.filter((item) => !removed.has(item))
      this.dirty = true
    },

    removeSelected() {
      if (!this.selectedIds.length) return
      this.mutate(() => {
        for (const id of [...this.selectedIds]) this.removeNode(id)
      })
    },

    insertNodeCopy(id: ID, dx = 0, dy = 0): ID | null {
      const location = findNode(this.project.frames, id)
      if (!location) return null
      const copy = cloneNode(location.node, createId)
      copy.x = location.node.x + dx
      copy.y = location.node.y + dy
      location.siblings.splice(location.index + 1, 0, copy)
      this.dirty = true
      return copy.id
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
      const frame = this.activeFrame
      if (!frame) return
      this.clipboard = this.selectedRootLocations(frame).map((location) => cloneNode(location.node, createId))
    },

    pasteClipboard() {
      if (!this.clipboard.length || !this.activeFrameId) return
      const frameId = this.activeFrameId
      const copies = this.clipboard.map((node) => {
        const copy = cloneNode(node, createId)
        copy.x += 16
        copy.y += 16
        return copy
      })
      this.mutate(() => {
        for (const copy of copies) this.addNode(frameId, copy)
      })
      this.selectMany(copies.map((copy) => copy.id))
    },

    pasteSvg(svg: string, w: number, h: number): ID | null {
      this.pushHistory()
      let frame = this.activeFrame
      if (!frame) {
        const position = nextFramePosition(this.project.frames)
        this.addFrame(position.x, position.y)
        frame = this.activeFrame
      }
      if (!frame) return null
      const def = registry.get('pm-custom')
      if (!def) return null
      const size = fitSize({ w, h }, frame.w, frame.h)
      const node: PMNode = {
        id: createId('n'),
        type: def.type,
        x: Math.max(0, Math.round((frame.w - size.w) / 2)),
        y: Math.max(0, Math.round((frame.h - size.h) / 2)),
        w: size.w,
        h: size.h,
        props: { ...def.defaultProps, name: 'SVG 图标', svg },
        style: { ...def.defaultStyle }
      }
      this.addNodeAndSelect(frame.id, node)
      return node.id
    },

    duplicateSelected() {
      const frame = this.activeFrame
      if (!frame) return
      const locations = this.selectedRootLocations(frame)
      if (!locations.length) return
      const copies = locations.map((location) => {
        const copy = cloneNode(location.node, createId)
        copy.x += 16
        copy.y += 16
        return copy
      })
      this.mutate(() => {
        for (const copy of copies) this.addNode(frame.id, copy)
      })
      this.selectMany(copies.map((copy) => copy.id))
    },

    selectedRootLocations(frame: Frame) {
      return topLevelIds(this.project.frames, this.selectedIds)
        .map((id) => findNode(this.project.frames, id))
        .filter((location): location is NonNullable<typeof location> => Boolean(location) && location!.frame.id === frame.id)
    },

    selectionTargets(frame: Frame): SelectionTarget[] {
      return this.selectedRootLocations(frame)
        .map((location) => {
          const abs = absolutePosition(frame, location.node.id) ?? { x: location.node.x, y: location.node.y }
          return { node: location.node, offsetX: abs.x - location.node.x, offsetY: abs.y - location.node.y }
        })
    },

    alignSelection(mode: AlignMode) {
      const frame = this.activeFrame
      if (!frame) return
      const targets = this.selectionTargets(frame)
      if (!targets.length) return
      let ref: { x: number; y: number; w: number; h: number }
      if (targets.length > 1) {
        const rects = targets.map((target) => ({
          x: target.offsetX + target.node.x,
          y: target.offsetY + target.node.y,
          w: target.node.w,
          h: target.node.h
        }))
        const minX = Math.min(...rects.map((rect) => rect.x))
        const minY = Math.min(...rects.map((rect) => rect.y))
        const maxX = Math.max(...rects.map((rect) => rect.x + rect.w))
        const maxY = Math.max(...rects.map((rect) => rect.y + rect.h))
        ref = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
      } else {
        ref = { x: 0, y: 0, w: frame.w, h: frame.h }
      }
      this.pushHistory()
      for (const target of targets) {
        const { node, offsetX, offsetY } = target
        const absX = offsetX + node.x
        const absY = offsetY + node.y
        let nextX = absX
        let nextY = absY
        if (mode === 'left') nextX = ref.x
        else if (mode === 'hcenter') nextX = ref.x + (ref.w - node.w) / 2
        else if (mode === 'right') nextX = ref.x + ref.w - node.w
        else if (mode === 'top') nextY = ref.y
        else if (mode === 'vcenter') nextY = ref.y + (ref.h - node.h) / 2
        else if (mode === 'bottom') nextY = ref.y + ref.h - node.h
        node.x = Math.round(nextX - offsetX)
        node.y = Math.round(nextY - offsetY)
      }
      this.dirty = true
    },

    distributeSelection(axis: DistributeAxis) {
      const frame = this.activeFrame
      if (!frame) return
      const targets = this.selectionTargets(frame)
      if (targets.length < 3) return
      const measured = targets.map((target) => {
        const absX = target.offsetX + target.node.x
        const absY = target.offsetY + target.node.y
        return {
          target,
          start: axis === 'horizontal' ? absX : absY,
          size: axis === 'horizontal' ? target.node.w : target.node.h
        }
      })
      measured.sort((a, b) => a.start - b.start)
      const first = measured[0]!
      const last = measured[measured.length - 1]!
      const spanStart = first.start
      const spanEnd = last.start + last.size
      const totalSize = measured.reduce((sum, item) => sum + item.size, 0)
      const gap = (spanEnd - spanStart - totalSize) / (measured.length - 1)
      this.pushHistory()
      let cursor = spanStart
      for (const item of measured) {
        if (axis === 'horizontal') item.target.node.x = Math.round(cursor - item.target.offsetX)
        else item.target.node.y = Math.round(cursor - item.target.offsetY)
        cursor += item.size + gap
      }
      this.dirty = true
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
