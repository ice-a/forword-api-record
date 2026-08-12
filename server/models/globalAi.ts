import mongoose from 'mongoose'

const globalAiSchema = new mongoose.Schema({
  name: { type: String, default: '全局 AI' },
  // baseURL / apiKey 允许为空：为空时回退环境变量 GLOBAL_AI_BASE_URL / GLOBAL_AI_API_KEY
  baseURL: { type: String, default: '' },
  apiKey: { type: String, default: '' },
  // 通过页面「获取模型」按钮探测得到，持久化
  models: { type: [String], default: [] }
})

export const GlobalAi = mongoose.models.GlobalAi || mongoose.model('GlobalAi', globalAiSchema)
