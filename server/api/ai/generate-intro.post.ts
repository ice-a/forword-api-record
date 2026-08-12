import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../../utils/stations'
import { resolveGlobalAi } from '~/server/utils/globalAi'
import { callChat } from '../../utils/llm'
import { parseAiJson, asString, asStringArray, assertHasContent } from '../../utils/aiJson'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const name = asString(body.name)
  const web = asString(body.web)
  if (!name) throw createError({ statusCode: 400, message: '名称不能为空' })

  const g = await resolveGlobalAi()
  if (!g) throw createError({ statusCode: 400, message: '全局 AI 未配置，请先在「全局AI」设置可用 AI' })
  // 模型优先级：请求指定 > 数据库/环境变量生效模型（models[0]，已含环境变量回退）
  const model = (body.model || g?.models?.[0] || '').toString().trim()
  if (!model) throw createError({ statusCode: 400, message: '未选择生成模型，请在「全局AI」设置中选择模型' })

  const webLine = web ? `\n参考链接：${web}` : ''
  const system = `你是资深技术文档助手。根据名称生成结构化的录入内容，必须只输出一个 JSON 对象，不要任何解释、不要 markdown 代码块包裹，字段如下：
{
  "intro": "一句话中文简介（20-40字）",
  "desc": "2-4 句中文说明，介绍它是什么、核心用途、适用人群"
}
要求：内容真实准确，不编造；如不确定具体信息写通用说明。`

  const user = `名称：${name}${webLine}\n请生成该条目的录入内容（仅返回 JSON）。`

  let raw: string
  try {
    raw = await callChat({ baseURL: g.baseURL, apiKey: g.apiKey, model, system, user })
  } catch (e: any) {
    throw createError({ statusCode: 502, message: '调用 AI 失败：' + (e?.message || e) })
  }

  let parsed: any
  try {
    parsed = parseAiJson(raw)
  } catch (e: any) {
    throw createError({ statusCode: 422, message: e.message || 'AI 返回内容解析失败' })
  }

  const result = {
    intro: asString(parsed.intro),
    desc: asString(parsed.desc)
  }

  // 强制性校验
  assertHasContent(result, ['intro', 'desc'])
  if (!result.intro) throw createError({ statusCode: 422, message: 'AI 未生成「简介」，请重试或手动填写' })

  return result
})
