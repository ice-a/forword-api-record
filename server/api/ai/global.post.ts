import { defineEventHandler, readBody } from 'h3'
import { GlobalAi } from '../../models/globalAi'
import { requireAdmin } from '../../utils/stations'
import { getDb } from '../../utils/db'

// 保存全局 AI 配置（管理员）。baseURL / apiKey 允许为空，表示「使用环境变量默认」
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await getDb()
  const body = await readBody(event)
  const name = (body.name || '全局 AI').toString().trim()
  const baseURL = (body.baseURL || '').toString().trim()
  const apiKey = (body.apiKey || '').toString().trim()
  const models = Array.isArray(body.models) ? body.models.map(String).filter(Boolean) : []

  // 若显式标记为「使用默认」，则清空覆盖值，回退环境变量
  const useDefault = body.useDefault === true
  const finalBase = useDefault ? '' : baseURL
  const finalKey = useDefault ? '' : apiKey

  await GlobalAi.deleteMany({})
  const doc = await GlobalAi.create({ name, baseURL: finalBase, apiKey: finalKey, models })
  return { ok: true, name: doc.name, baseURL: doc.baseURL, apiKey: doc.apiKey, models: doc.models }
})
