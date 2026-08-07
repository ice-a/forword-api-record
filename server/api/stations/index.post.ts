import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'
import { requireAdmin, fetchModels, sanitize } from '~/server/utils/stations'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  await getDb()
  const body = await readBody(event)

  const models = await fetchModels(body.baseURL, body.apiKey)
  const finalModels = models && models.length
    ? models
    : ['gpt-3.5-turbo', 'gpt-4']

  const st = await Station.create({
    name: body.name,
    baseURL: body.baseURL,
    apiKey: body.apiKey || '',
    keyId: body.keyId || crypto.randomUUID(),
    models: finalModels,
    balance: body.balance || '',
    status: body.status || 'active',
    remark: body.remark || ''
  })
  return sanitize(st)
})
