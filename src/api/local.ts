import type { ProjectRecord } from './types'

const PROJECTS_KEY = 'pm_local_projects'

const CREDENTIALS: Record<string, string> = {
  wangzhe: '123456'
}

function createLocalId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function readAll(): ProjectRecord[] {
  const raw = localStorage.getItem(PROJECTS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as ProjectRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: ProjectRecord[]): void {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(records))
  } catch {
    throw new Error('本地存储空间不足，操作未保存')
  }
}

export function localLogin(username: string, password: string): boolean {
  return CREDENTIALS[username] === password
}

export function listProjects(keyword = ''): ProjectRecord[] {
  const kw = keyword.trim().toLowerCase()
  return readAll()
    .filter((record) => !kw || record.name.toLowerCase().includes(kw))
    .sort((a, b) => (b.updateTime ?? '').localeCompare(a.updateTime ?? ''))
}

export function getProject(id: string): ProjectRecord | null {
  return readAll().find((record) => record.id === id) ?? null
}

export function saveProject(record: ProjectRecord): ProjectRecord {
  const records = readAll()
  const now = new Date().toISOString()
  const index = records.findIndex((item) => item.id === record.id)
  if (index >= 0) {
    const merged: ProjectRecord = { ...records[index], ...record, updateTime: now }
    records[index] = merged
    writeAll(records)
    return merged
  }
  const created: ProjectRecord = { ...record, id: record.id || createLocalId(), createTime: now, updateTime: now }
  records.push(created)
  writeAll(records)
  return created
}

export function deleteProject(id: string): void {
  writeAll(readAll().filter((record) => record.id !== id))
}
