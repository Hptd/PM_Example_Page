import { clearToken, getStoredUser, http, setStoredUser, setToken, USE_LOCAL } from './http'
import * as local from './local'
import type { UserInfo } from './types'

export async function login(username: string, password: string): Promise<void> {
  if (USE_LOCAL) {
    if (!local.localLogin(username, password)) throw new Error('账号或密码错误')
    setToken(`local-${username}`)
    setStoredUser(username)
    return
  }
  const response = await http<{ token?: string }>({
    method: 'POST',
    url: '/login',
    body: { username, password },
    auth: false
  })
  if (!response.token) throw new Error('登录失败：未返回令牌')
  setToken(response.token)
  setStoredUser(username)
}

export async function logout(): Promise<void> {
  if (!USE_LOCAL) {
    try {
      await http({ method: 'POST', url: '/logout' })
    } catch {
      // 忽略登出接口异常，本地令牌仍需清理
    }
  }
  clearToken()
}

export async function getInfo(): Promise<UserInfo> {
  if (USE_LOCAL) {
    const name = getStoredUser() || 'wangzhe'
    return { userName: name, nickName: name, roles: ['pm_user'], permissions: [] }
  }
  return http<UserInfo>({ url: '/getInfo' })
}
