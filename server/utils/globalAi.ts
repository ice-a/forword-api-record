import { getConfig } from './config'
import { getDb } from './db'
import { GlobalAi } from '../models/globalAi'

// 解析「全局 AI」最终生效配置：
// 优先级 = 数据库覆盖值（用户在页面改过） > 环境变量默认值
// - 数据库 baseURL 为空  -> 回退环境变量 GLOBAL_AI_BASE_URL
// - 数据库 apiKey 为空   -> 回退环境变量 GLOBAL_AI_API_KEY
// 当环境变量已配置、但数据库不可用时，优雅降级为仅使用环境变量（无需 DB 也能生成 AI）
export interface ResolvedGlobalAi {
  baseURL: string
  apiKey: string
  models: string[]
  name: string
  source: 'db' | 'env'
}

export async function resolveGlobalAi(): Promise<ResolvedGlobalAi | null> {
  const envBase = getConfig().globalAiBaseUrl?.trim() || ''
  const envKey = getConfig().globalAiApiKey?.trim() || ''
  const envModel = getConfig().globalAiModel?.trim() || ''

  let dbBase = ''
  let dbKey = ''
  let dbName = ''
  let dbModels: string[] = []
  try {
    await getDb()
    const gai = await GlobalAi.findOne()
    dbBase = (gai?.baseURL || '').trim()
    dbKey = (gai?.apiKey || '').trim()
    dbName = gai?.name || ''
    dbModels = gai?.models || []
  } catch {
    // 数据库不可用：若环境变量已配置，则降级使用环境变量
  }

  const baseURL = dbBase || envBase
  const apiKey = dbKey || envKey
  if (!baseURL || !apiKey) return null

  // 生效模型优先级：数据库选中模型（models[0]） > 环境变量 GLOBAL_AI_MODEL
  const models = [...dbModels]
  if (!models.length && envModel) models.push(envModel)
  else if (envModel && !models.includes(envModel)) models.push(envModel)

  return {
    baseURL,
    apiKey,
    models,
    name: dbName || '全局 AI',
    source: dbBase || dbKey ? 'db' : 'env'
  }
}
