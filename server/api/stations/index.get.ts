import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'
import { sanitize } from '~/server/utils/stations'

export default defineEventHandler(async () => {
  await getDb()
  // 排序权重升序（越小越靠前），相同权重按创建时间倒序
  const list = await Station.find().sort({ sort: 1, createdAt: -1 })
  return list.map(sanitize)
})
