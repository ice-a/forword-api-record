import { defineEventHandler, readBody, createError } from 'h3'
import { getDb } from '../../utils/db'
import { requireAdmin } from '../../utils/stations'
import { Station } from '../../models/station'

// 调用已配置的中转站，为 skill 生成一段简洁中文简介
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  await getDb()
  const body = await readBody(event)
  const name = (body?.name || '').toString().trim()
  const web = (body?.web || '').toString().trim()
  if (!name) throw createError({ statusCode: 400, message: '请提供 skill 名称' })

  // 选一个可用中转站（优先带模型列表的）
  const station = await Station.findOne({ status: 'active', baseURL: { $ne: '' } })
    .sort({ models: -1 })
  if (!station) throw createError({ statusCode: 400, message: '暂无可用中转站，无法生成简介' })
  if (!station.apiKey) throw createError({ statusCode: 400, message: '所选中转站未配置 API Key' })

  const url = station.baseURL.replace(/\/$/, '') + '/v1/chat/completions'
  const prompt =
    `请用简体中文为一款名为「${name}」${web ? `（官网：${web}）` : ''}的 AI 工具/技能写一段不超过 60 字的产品简介，` +
    `突出它的核心用途与特点，不要使用 Markdown，直接输出纯文本。`

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 30000)
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${station.apiKey}`
      },
      body: JSON.stringify({
        model: (station.models && station.models[0]) || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是一个擅长撰写简洁产品简介的助手。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 200
      }),
      signal: ctrl.signal
    })
    if (!r.ok) throw createError({ statusCode: 502, message: `中转站返回错误 ${r.status}` })
    const data = await r.json()
    const text = data?.choices?.[0]?.message?.content?.trim()
    if (!text) throw createError({ statusCode: 502, message: '中转站未返回内容' })
    return { intro: text }
  } catch (e: any) {
    if (e?.statusCode) throw e
    throw createError({ statusCode: 502, message: '调用 AI 失败：' + (e?.message || '未知错误') })
  } finally {
    clearTimeout(t)
  }
})
