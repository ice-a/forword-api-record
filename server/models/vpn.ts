import mongoose from 'mongoose'

const vpnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, default: '' },
  desc: { type: String, default: '' },
  sort: { type: Number, default: 0 },
  remark: { type: String, default: '' }
}, { timestamps: true })

export const Vpn = mongoose.models.Vpn || mongoose.model('Vpn', vpnSchema)
