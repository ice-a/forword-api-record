import { requireAdmin, fetchModels } from '~/server/utils/stations'
import { getDb } from '~/server/utils/db'
import { Station } from '~/server/models/station'

// 表单内即时探测模型列表：无需先保存站点
// 编辑态若未重新填写 apiKey，则复用库中已存的 key
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)

  const baseURL = (body?.baseURL || '').trim()
  if (!baseURL) throw createError({ statusCode: 400, message: '请先填写 Base URL' })

  let apiKey = (body?.apiKey || '').trim()
  if (!apiKey && body?.id) {
    await getDb()
    const st = await Station.findById(body.id)
    if (st) apiKey = st.apiKey || ''
  }

  const models = await fetchModels(baseURL, apiKey)
  if (!models) throw createError({ statusCode: 502, message: '拉取失败，请检查 Base URL 与 API Key' })
  if (!models.length) throw createError({ statusCode: 404, message: '接口返回空模型列表' })

  return { models }
})
