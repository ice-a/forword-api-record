import { defineEventHandler } from 'h3'
import { GlobalAi } from '../../models/globalAi'
import { getConfig } from '../../utils/config'
import { requireAdmin } from '../../utils/stations'
import { getDb } from '../../utils/db'

// 管理员读取全局 AI 配置；合并环境变量默认值，便于前端编辑时展示「默认」
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await getDb()
  const envBase = getConfig().globalAiBaseUrl || ''
  const envKey = getConfig().globalAiApiKey || ''
  const envModel = getConfig().globalAiModel || ''
  const gai = await GlobalAi.findOne()

  return {
    name: gai?.name || '全局 AI',
    baseURL: gai?.baseURL || '',
    apiKey: gai?.apiKey || '',
    models: gai?.models || [],
    defaults: { baseURL: envBase, apiKey: envKey, model: envModel },
    envConfigured: !!(envBase && envKey)
  }
})
