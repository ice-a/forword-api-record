// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-08-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '中转站管理',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: '中转站信息管理面板' }
      ],
      link: [{ rel: 'icon', href: 'data:,' }]
    }
  },
  runtimeConfig: {
    // 服务端私密配置（仅服务端可读）
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/relay_station',
    adminPassword: process.env.ADMIN_PASSWORD || 'change_me_strong_password',
    imgbedUrl: process.env.IMGBED_URL || 'https://img.020417.xyz',
    imgbedAuth: process.env.IMGBED_AUTH || 'muzi'
  },
  // Nitro（服务端引擎）配置：Vercel 部署相关
  nitro: {
    preset: 'vercel'
  }
})
