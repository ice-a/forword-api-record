import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'
import { requireAdmin, uploadToImgBed } from '~/server/utils/stations'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  await getDb()
  const body = await readBody(event)
  const { stationId, apiKey, prompt, size = '1024x1024', quality = 'standard', n = 1, upload = true } = body

  if (!stationId || !prompt) throw createError({ statusCode: 400, message: '缺少 stationId 或 prompt' })
  const st = await Station.findById(stationId)
  if (!st) throw createError({ statusCode: 404, message: '中转站不存在' })

  const baseURL = st.baseURL
  const finalKey = (apiKey && apiKey.trim()) ? apiKey.trim() : st.apiKey
  const model = body.model || (st.models && st.models[0]) || 'gpt-image-1'
  if (!finalKey) throw createError({ statusCode: 400, message: '缺少 API Key' })

  const url = baseURL.replace(/\/$/, '') + '/v1/images/generations'
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 60000)
  let data
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${finalKey}`
      },
      body: JSON.stringify({ model, prompt, n: Number(n) || 1, size, quality }),
      signal: ctrl.signal
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      throw createError({ statusCode: r.status, message: err?.error?.message || err?.error || '生图请求失败' })
    }
    data = await r.json()
  } finally {
    clearTimeout(t)
  }

  const items = []
  for (const it of (data.data || [])) {
    const b64 = it.b64_json
    const item: any = { b64 }
    if (upload) {
      try { item.imgbedUrl = await uploadToImgBed('data:image/png;base64,' + b64) }
      catch (e) { item.imgbedUrl = '' }
    }
    items.push(item)
  }
  return { images: items, model }
})
