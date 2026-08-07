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
  remark: { type: String, default: '' }
}, { timestamps: true })

export const Station = mongoose.models.Station || mongoose.model('Station', stationSchema)
