export const TOKEN_KEY = 'pm_token'
export const USER_KEY = 'pm_user'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/dev-api'

export const USE_LOCAL = (import.meta.env.VITE_USE_LOCAL as string | undefined) !== 'false'

export class ApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): string {
  return localStorage.getItem(USER_KEY) ?? ''
}

export function setStoredUser(name: string): void {
  localStorage.setItem(USER_KEY, name)
}

interface HttpOptions {
  method?: string
  url: string
  body?: unknown
  auth?: boolean
}

const REQUEST_TIMEOUT = 15000

export async function http<T>(options: HttpOptions): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.auth !== false) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  let response: Response
  try {
    response = await fetch(BASE + options.url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(-1, '请求超时，请稍后重试')
    }
    throw new ApiError(-1, '无法连接后端服务，请确认后端已启动')
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 401) {
    clearToken()
    throw new ApiError(401, '登录状态已失效，请重新登录')
  }

  const text = await response.text()
  let payload: Record<string, unknown> = {}
  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>
    } catch {
      payload = {}
    }
  }

  const code = typeof payload.code === 'number' ? payload.code : undefined
  if (code !== undefined && code !== 200) {
    throw new ApiError(code, typeof payload.msg === 'string' ? payload.msg : '请求失败')
  }
  if (!response.ok && code === undefined) {
    throw new ApiError(response.status, `请求失败（${response.status}）`)
  }

  return payload as T
}
