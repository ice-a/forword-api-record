// 服务端私密配置（来自 nuxt.config runtimeConfig / 环境变量）
export function getConfig() {
  const rc = useRuntimeConfig()
  return {
    adminPassword: rc.adminPassword,
    // 全局 AI 默认凭据：来自环境变量 GLOBAL_AI_BASE_URL / GLOBAL_AI_API_KEY / GLOBAL_AI_MODEL
    globalAiBaseUrl: rc.globalAiBaseUrl || '',
    globalAiApiKey: rc.globalAiApiKey || '',
    globalAiModel: rc.globalAiModel || ''
  }
}
