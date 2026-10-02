import { http, USE_LOCAL } from './http'
import * as local from './local'
import type { ListResult, ProjectRecord } from './types'

export async function listProjects(keyword = ''): Promise<ListResult> {
  if (USE_LOCAL) {
    const rows = local.listProjects(keyword)
    return { rows, total: rows.length }
  }
  return http<ListResult>({ url: `/pm/project/list?pageNum=1&pageSize=200&name=${encodeURIComponent(keyword)}` })
}

export async function getProject(id: string): Promise<ProjectRecord> {
  if (USE_LOCAL) {
    const record = local.getProject(id)
    if (!record) throw new Error('项目不存在')
    return record
  }
  const response = await http<{ data: ProjectRecord }>({ url: `/pm/project/${id}` })
  return response.data
}

export async function saveProject(record: ProjectRecord): Promise<ProjectRecord> {
  if (USE_LOCAL) return local.saveProject(record)
  const method = record.id ? 'PUT' : 'POST'
  const response = await http<{ data: ProjectRecord }>({ method, url: '/pm/project', body: record })
  return response.data ?? record
}

export async function deleteProject(id: string): Promise<void> {
  if (USE_LOCAL) {
    local.deleteProject(id)
    return
  }
  await http({ method: 'DELETE', url: `/pm/project/${id}` })
}
