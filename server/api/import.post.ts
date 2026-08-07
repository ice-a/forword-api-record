import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'
import { requireAdmin } from '~/server/utils/stations'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  await getDb()
  const list = await readBody(event)
  if (!Array.isArray(list)) throw createError({ statusCode: 400, message: '数据格式错误' })

  let count = 0
  for (const item of list) {
    if (!item?.baseURL) continue
    await Station.create({
      name: item.name || '未命名',
      baseURL: item.baseURL,
      siteURL: item.siteURL || '',
      apiKey: item.apiKey || '',
      keyId: item.keyId || crypto.randomUUID(),
      models: Array.isArray(item.models) ? item.models : [],
      balance: item.balance || '',
      status: item.status || 'active',
      remark: item.remark || ''
    })
    count++
  }
  return { ok: true, count }
})
