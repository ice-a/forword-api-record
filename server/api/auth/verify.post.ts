import { getConfig } from '~/server/utils/config'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (body?.password === getConfig().adminPassword) return { ok: true }
  throw createError({ statusCode: 401, message: '密码错误' })
})
