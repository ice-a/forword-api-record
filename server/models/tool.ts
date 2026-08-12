import mongoose from 'mongoose'

const toolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: { type: String, default: '' },
  tags: { type: [String], default: [] },
  install: { type: String, default: '' },
  home: { type: String, default: '' },
  detail: { type: [String], default: [] },
  sort: { type: Number, default: 0 },
  remark: { type: String, default: '' }
}, { timestamps: true })

export const Tool = mongoose.models.Tool || mongoose.model('Tool', toolSchema)
