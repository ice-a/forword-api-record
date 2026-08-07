import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'
import { requireAdmin, sanitize } from '~/server/utils/stations'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  await getDb()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const update: any = {}
  for (const k of ['name', 'baseURL', 'apiKey', 'keyId', 'models', 'balance', 'status', 'remark']) {
    if (body[k] !== undefined) update[k] = body[k]
  }

  const st = await Station.findByIdAndUpdate(id, update, { new: true })
  if (!st) throw createError({ statusCode: 404, message: '未找到' })
  return sanitize(st)
})
