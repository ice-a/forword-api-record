import mongoose from 'mongoose'

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  baseURL: { type: String, required: true },
  // 直达地址（站点主页/控制台），留空则回退使用 baseURL
  siteURL: { type: String, default: '' },
  apiKey: { type: String, default: '' },
  keyId: { type: String, default: '' },
  models: { type: [String], default: [] },
  balance: { type: String, default: '' },
  status: { type: String, default: 'active' },
  // 排序权重：数值越小越靠前，相同则按创建时间倒序
  sort: { type: Number, default: 0 },
  // 描述：展示在卡片与详情中
  desc: { type: String, default: '' },
  remark: { type: String, default: '' }
}, { timestamps: true })

export const Station = mongoose.models.Station || mongoose.model('Station', stationSchema)
