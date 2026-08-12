import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { getDb } from './db'
import { requireAdmin } from './stations'

// 通用 CRUD 工厂：用于 tools / skills / vpns 等「公开可读 + 后台管理」的集合
// fieldNames: 允许写入的字段名数组（写入时只取这些字段，忽略其余）
export function crudHandlers(Model: any, fieldNames: string[]) {
  // 公开列表
  const list = defineEventHandler(async () => {
    await getDb()
    const list = await Model.find().sort({ sort: 1, createdAt: -1 })
    return list
  })

  // 后台新增
  const create = defineEventHandler(async (event) => {
    requireAdmin(event)
    await getDb()
    const body = await readBody(event)
    const payload: any = {}
    for (const k of fieldNames) {
      if (body?.[k] !== undefined) payload[k] = body[k]
    }
    const doc = await Model.create(payload)
    return doc
  })

  // 后台更新（部分字段）
  const update = defineEventHandler(async (event) => {
    requireAdmin(event)
    await getDb()
    const id = getRouterParam(event, 'id')!
    const body = await readBody(event)
    const payload: any = {}
    for (const k of fieldNames) {
      if (body?.[k] !== undefined) payload[k] = body[k]
    }
    const doc = await Model.findByIdAndUpdate(id, payload, { new: true })
    if (!doc) throw createError({ statusCode: 404, message: '未找到' })
    return doc
  })

  // 后台删除
  const remove = defineEventHandler(async (event) => {
    requireAdmin(event)
    await getDb()
    const id = getRouterParam(event, 'id')!
    const doc = await Model.findByIdAndDelete(id)
    if (!doc) throw createError({ statusCode: 404, message: '未找到' })
    return { ok: true }
  })

  return { list, create, update, remove }
}
