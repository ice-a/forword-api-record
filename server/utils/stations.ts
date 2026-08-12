import { H3Event, getHeader, createError } from 'h3'
import { getConfig } from './config'

// 鉴权中间件：校验 x-admin-password
export function requireAdmin(event: H3Event) {
  const pwd = getHeader(event, 'x-admin-password')
  if (pwd !== getConfig().adminPassword) {
    throw createError({ statusCode: 401, message: '密码错误或未登录' })
  }
}

// 脱敏：移除原始 apiKey，保留 keyId
export function sanitize(s: any) {
  const o = s.toObject ? s.toObject() : { ...s }
  delete o.apiKey
  return o
}

// 规范化 baseURL：去掉结尾的 /v1 或 / ，避免拼出 /v1/v1/...
export function normBase(baseURL: string) {
  return baseURL.trim().replace(/\/v1\/?$/, '').replace(/\/+$/, '')
}

// 从 baseURL 拉取模型列表
export async function fetchModels(baseURL: string, apiKey: string) {
  const url = normBase(baseURL) + '/v1/models'
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: ctrl.signal
    })
    if (!r.ok) return null
    const data = await r.json()
    return (data.data || []).map((m: any) => m.id).filter(Boolean)
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
