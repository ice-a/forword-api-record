import mongoose from 'mongoose'

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  baseURL: { type: String, required: true },
  apiKey: { type: String, default: '' },
  keyId: { type: String, default: '' },
  models: { type: [String], default: [] },
  balance: { type: String, default: '' },
  status: { type: String, default: 'active' },
  remark: { type: String, default: '' }
}, { timestamps: true })

export const Station = mongoose.models.Station || mongoose.model('Station', stationSchema)
