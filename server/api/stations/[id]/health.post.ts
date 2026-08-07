import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'

// 健康检查：探测「直达地址」（siteURL，未填则回退 baseURL）是否连通（公开，不暴露 key）
export default defineEventHandler(async (event) => {
  await getDb()
  const id = getRouterParam(event, 'id')!
  const st = await Station.findById(id)
  if (!st) throw createError({ statusCode: 404, message: '未找到' })

  // 优先使用直达地址，未填写则回退 baseURL
  const target = (st.siteURL || '').trim() || (st.baseURL || '').trim()
  return { ok: await isReachable(target) }
})

// 仅探测地址是否可达（HTTP 能连接并返回响应即视为有效）
async function isReachable(rawUrl: string): Promise<boolean> {
  if (!rawUrl) return false
  const url = rawUrl.replace(/\/$/, '')
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 15000)
  try {
    const r = await fetch(url, { method: 'GET', signal: ctrl.signal })
    return r.status < 500
  } catch {
    return false
  } finally {
    clearTimeout(t)
  }
}
