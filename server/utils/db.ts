import mongoose from 'mongoose'

// Serverless 环境下复用 MongoDB 连接，避免每次冷启动都新建连接
const MONGODB_URI = useRuntimeConfig().mongodbUri

let cached: Promise<typeof mongoose> | null = null

export function getDb() {
  if (!cached) {
    cached = mongoose.connect(MONGODB_URI).then((m) => m)
  }
  return cached
}
