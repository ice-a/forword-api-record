import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'
import { requireAdmin, fetchModels, sanitize } from '~/server/utils/stations'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  await getDb()
  const id = getRouterParam(event, 'id')!
  const st = await Station.findById(id)
  if (!st) throw createError({ statusCode: 404, message: '未找到' })

  const models = await fetchModels(st.baseURL, st.apiKey)
  const finalModels = models && models.length ? models : ['gpt-3.5-turbo', 'gpt-4']
  st.models = finalModels
  await st.save()
  return sanitize(st)
})
