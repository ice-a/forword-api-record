import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../../utils/stations'
import { resolveGlobalAi } from '~/server/utils/globalAi'
import { callChat } from '../../utils/llm'
import { parseAiJson, asString, asStringArray, assertHasContent } from '../../utils/aiJson'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const name = asString(body.name)
  const home = asString(body.home)
  if (!name) throw createError({ statusCode: 400, message: '工具名称不能为空' })

  const g = await resolveGlobalAi()
  if (!g) throw createError({ statusCode: 400, message: '全局 AI 未配置，请先在「全局AI」设置可用 AI' })
  const model = (asString(body.model) || g.models?.[0] || '').toString().trim()
  if (!model) throw createError({ statusCode: 400, message: '未选择生成模型，请在「全局AI」设置中选择模型' })

  const homeLine = home ? `\n官网地址：${home}` : ''
  const system = `你是资深技术文档助手。根据工具名称生成结构化的录入内容，必须只输出一个 JSON 对象，不要任何解释、不要 markdown 代码块包裹，字段如下：
{
  "desc": "一句话中文简介（20-40字，说明这个工具是什么、用于什么场景）",
  "tags": ["3-5 个中文标签", "逗号分隔概念"],
  "detail": ["详细配置步骤第1条", "第2条", "..."]
}
要求：detail 是可直接复制到配置表中的具体命令与步骤，每行一条；不要编造不存在的命令；如不确定安装命令写通用说明。`

  const user = `工具名称：${name}${homeLine}\n请生成该工具的录入内容（仅返回 JSON）。`

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
    desc: asString(parsed.desc),
    tags: asStringArray(parsed.tags),
    detail: asStringArray(parsed.detail)
  }

  // 强制性校验：确保生成内容准确、完整
  assertHasContent(result, ['desc', 'tags', 'detail'])
  if (!result.desc) throw createError({ statusCode: 422, message: 'AI 未生成「描述」，请重试或手动填写' })
  if (!result.tags.length) throw createError({ statusCode: 422, message: 'AI 未生成「标签」，请重试或手动填写' })

  return result
})
