import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'

// 公开：根据探活结果更新状态（仅可置 active/inactive，不暴露 key）
export default defineEventHandler(async (event) => {
  await getDb()
  const id = getRouterParam(event, 'id')!

  const body = await readBody(event)
  const status = body?.status
  if (status !== 'active' && status !== 'inactive') {
    throw createError({ statusCode: 400, message: 'status 只能是 active 或 inactive' })
  }
  const res = await Station.updateOne({ _id: id }, { $set: { status } })
  if (res.matchedCount === 0) throw createError({ statusCode: 404, message: '未找到' })
  return { id, status }
})
