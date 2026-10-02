export interface ProjectRecord {
  id: string
  name: string
  description?: string
  cover?: string
  content?: string
  createTime?: string
  updateTime?: string
}

export interface ListResult {
  rows: ProjectRecord[]
  total: number
}

export interface UserInfo {
  userName: string
  nickName?: string
  roles: string[]
  permissions: string[]
}
