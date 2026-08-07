// 服务端私密配置（来自 nuxt.config runtimeConfig / 环境变量）
export function getConfig() {
  const rc = useRuntimeConfig()
  return {
    adminPassword: rc.adminPassword,
    imgbedUrl: rc.imgbedUrl,
    imgbedAuth: rc.imgbedAuth
  }
}
