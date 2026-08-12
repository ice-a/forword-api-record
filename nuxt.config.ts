// 显式加载 .env（确保在读取 process.env 前环境变量已就绪）
import { config as loadDotenv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadDotenv({ path: resolve(__dirname, '.env') })

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-08-01',
  devtools: { enabled: false },
  // 纯 SPA 模式：后台管理工具无需 SEO，避免 SSR 水合闪烁与浏览器 API 报错
  ssr: false,
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'AI 资源台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: 'AI 资源台：中转站 / 工具 / Skills / VPN 聚合管理' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },
  runtimeConfig: {
    // 服务端私密配置（仅服务端可读）
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/relay_station',
    adminPassword: process.env.ADMIN_PASSWORD || 'change_me_strong_password',
    // 全局 AI 默认凭据：环境变量 GLOBAL_AI_BASE_URL / GLOBAL_AI_API_KEY / GLOBAL_AI_MODEL
    // 若未设置，则需在页面手动填写
    globalAiBaseUrl: process.env.GLOBAL_AI_BASE_URL || '',
    globalAiApiKey: process.env.GLOBAL_AI_API_KEY || '',
    globalAiModel: process.env.GLOBAL_AI_MODEL || ''
  },
  // Nitro（服务端引擎）配置：Vercel 部署相关
  nitro: {
    preset: 'vercel'
  }
})
