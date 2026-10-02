export type ID = string

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface Comment {
  id: ID
  text: string
  author: string
  createdAt: number
  resolved?: boolean
}

export interface Project {
  id: ID
  name: string
  version: number
  viewport: Viewport
  frames: Frame[]
  annotations: Record<ID, Comment[]>
}

export interface Frame {
  id: ID
  name: string
  x: number
  y: number
  w: number
  h: number
  background: string
  tree: PMNode[]
}

export interface PMNode {
  id: ID
  type: string
  x: number
  y: number
  w: number
  h: number
  props: Record<string, unknown>
  style: Record<string, string | number>
  children?: PMNode[]
  name?: string
  locked?: boolean
  hidden?: boolean
  rotation?: number
}

export const PROJECT_VERSION = 1

let idCounter = 0

export function createId(prefix = 'n'): ID {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`
}

export function createProject(name = '未命名项目'): Project {
  return {
    id: createId('p'),
    name,
    version: PROJECT_VERSION,
    viewport: { x: 0, y: 0, zoom: 1 },
    frames: [],
    annotations: {}
  }
}

export function createFrame(partial: Partial<Frame> = {}): Frame {
  return {
    id: createId('f'),
    name: partial.name ?? '页面',
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    w: partial.w ?? 1280,
    h: partial.h ?? 800,
    background: partial.background ?? '#ffffff',
    tree: partial.tree ?? []
  }
}

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function parseProject(raw: string): Project {
  const data = JSON.parse(raw) as Partial<Project>
  if (!data || typeof data !== 'object' || !Array.isArray(data.frames)) {
    throw new Error('无效的项目文件：缺少 frames 字段')
  }
  const base = createProject(data.name ?? '未命名项目')
  const project: Project = {
    id: data.id ?? base.id,
    name: data.name ?? base.name,
    version: data.version ?? PROJECT_VERSION,
    viewport: {
      x: data.viewport?.x ?? 0,
      y: data.viewport?.y ?? 0,
      zoom: data.viewport?.zoom ?? 1
    },
    frames: data.frames.map((frame) => normalizeFrame(frame)),
    annotations: normalizeAnnotations(data.annotations)
  }
  return project
}

function normalizeAnnotations(raw: Record<ID, Comment[]> | undefined): Record<ID, Comment[]> {
  if (!raw || typeof raw !== 'object') return {}
  const result: Record<ID, Comment[]> = {}
  for (const [nodeId, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue
    result[nodeId] = list
      .filter((comment) => comment && typeof comment.text === 'string')
      .map((comment) => ({
        id: comment.id ?? createId('c'),
        text: comment.text,
        author: comment.author ?? '匿名',
        createdAt: comment.createdAt ?? Date.now(),
        resolved: comment.resolved ?? false
      }))
  }
  return result
}

function normalizeFrame(frame: Partial<Frame>): Frame {
  return createFrame({
    id: frame.id,
    name: frame.name,
    x: toFinite(frame.x, 0),
    y: toFinite(frame.y, 0),
    w: Math.max(40, toFinite(frame.w, 1280)),
    h: Math.max(40, toFinite(frame.h, 800)),
    background: frame.background,
    tree: Array.isArray(frame.tree) ? frame.tree.map((node) => normalizeNode(node)) : []
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toFinite(value: unknown, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

export function countComments(annotations: Record<ID, Comment[]>): Record<ID, number> {
  const counts: Record<ID, number> = {}
  for (const [nodeId, list] of Object.entries(annotations)) {
    if (list.length) counts[nodeId] = list.length
  }
  return counts
}

function normalizeNode(node: Partial<PMNode>): PMNode {
  const normalized: PMNode = {
    id: node.id ?? createId('n'),
    type: node.type ?? 'pm-rect',
    x: toFinite(node.x, 0),
    y: toFinite(node.y, 0),
    w: Math.max(8, toFinite(node.w, 100)),
    h: Math.max(8, toFinite(node.h, 40)),
    props: isRecord(node.props) ? node.props : {},
    style: isRecord(node.style) ? (node.style as PMNode['style']) : {}
  }
  if (node.name !== undefined) normalized.name = node.name
  if (node.locked !== undefined) normalized.locked = node.locked
  if (node.hidden !== undefined) normalized.hidden = node.hidden
  if (node.rotation !== undefined) normalized.rotation = node.rotation
  if (Array.isArray(node.children)) normalized.children = node.children.map((child) => normalizeNode(child))
  return normalized
}
