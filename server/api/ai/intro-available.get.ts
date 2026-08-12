import { defineEventHandler } from 'h3'
import { resolveGlobalAi } from '../../utils/globalAi'

// 公开：是否可用全局 AI 生成简介（回退环境变量）
export default defineEventHandler(async () => {
  const g = await resolveGlobalAi()
  return { available: !!g }
})
