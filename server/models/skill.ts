import mongoose from 'mongoose'

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  web: { type: String, default: '' },
  intro: { type: String, default: '' },
  sort: { type: Number, default: 0 },
  desc: { type: String, default: '' },
  remark: { type: String, default: '' }
}, { timestamps: true })

export const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema)
