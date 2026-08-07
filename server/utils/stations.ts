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

// 从 baseURL 拉取模型列表
export async function fetchModels(baseURL: string, apiKey: string) {
  const url = baseURL.replace(/\/$/, '') + '/v1/models'
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

// 上传到图床（CloudFlare-ImgBed）
export async function uploadToImgBed(base64: string) {
  const { imgbedUrl, imgbedAuth } = getConfig()
  const mimeMatch = base64.match(/^data:(.*?);base64,/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const pure = base64.replace(/^data:.*?;base64,/, '')
  const buf = Buffer.from(pure, 'base64')
  const blob = new Blob([buf], { type: mime })

  const form = new FormData()
  form.append('file', blob, 'image.png')

  const r = await fetch(`${imgbedUrl}/upload?authCode=${encodeURIComponent(imgbedAuth)}`, {
    method: 'POST',
    body: form
  })
  const data = await r.json()
  let url = data?.result?.source || data?.result?.src || (data?.result && data.result[0]?.src)
  if (!url && data?.result?.publicUrl) url = data.result.publicUrl
  if (!url) url = `${imgbedUrl}/file/${data?.result?.key || ''}`
  return url
}
