import { defineEventHandler } from 'h3'
import { resolveGlobalAi } from '../../utils/globalAi'

// 公开：前端判断是否有可用的全局 AI（回退环境变量）
export default defineEventHandler(async () => {
  const g = await resolveGlobalAi()
  return {
    name: g?.name || '全局 AI',
    ready: !!g,
    source: g?.source || null,
    models: g?.models || []
  }
})
