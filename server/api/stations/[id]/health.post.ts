import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'
import { fetchModels } from '~/server/utils/stations'

// 健康检查：探测 /v1/models 是否可达（公开，仅探测不暴露 key）
export default defineEventHandler(async (event) => {
  await getDb()
  const id = getRouterParam(event, 'id')!
  const st = await Station.findById(id)
  if (!st) throw createError({ statusCode: 404, message: '未找到' })

  const models = await fetchModels(st.baseURL, st.apiKey)
  return { ok: models !== null }
})
