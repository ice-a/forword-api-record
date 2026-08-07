import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'
import { requireAdmin } from '~/server/utils/stations'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  await getDb()
  const id = getRouterParam(event, 'id')!
  const st = await Station.findByIdAndDelete(id)
  if (!st) throw createError({ statusCode: 404, message: '未找到' })
  return { ok: true }
})
