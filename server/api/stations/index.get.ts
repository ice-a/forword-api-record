import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'
import { sanitize } from '~/server/utils/stations'

export default defineEventHandler(async () => {
  await getDb()
  const list = await Station.find().sort({ createdAt: -1 })
  return list.map(sanitize)
})
