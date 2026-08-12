// 从 AI 返回的文本中稳健解析 JSON：
// 1) 优先整体 JSON.parse
// 2) 失败时剥离 ```json / ``` 代码块包裹再解析
// 3) 再失败时尝试提取第一段 { ... }（支持首尾多余文本）
export function parseAiJson(raw: string): any {
  if (typeof raw !== 'string') throw new Error('AI 返回内容为空')
  const text = raw.trim()
  if (!text) throw new Error('AI 返回内容为空')

  const tryParse = (s: string): any => {
    try {
      return JSON.parse(s)
    } catch {
      return undefined
    }
  }

  // 1) 直接解析
  let obj = tryParse(text)
  if (obj && typeof obj === 'object') return obj

  // 2) 去 markdown 代码块
  const fence = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  obj = tryParse(fence)
  if (obj && typeof obj === 'object') return obj

  // 3) 提取首个 { ... }（含嵌套），用栈匹配
  const start = fence.indexOf('{')
  const end = fence.lastIndexOf('}')
  if (start !== -1 && end > start) {
    const slice = fence.slice(start, end + 1)
    obj = tryParse(slice)
    if (obj && typeof obj === 'object') return obj
  }

  throw new Error('AI 返回的内容不是合法 JSON，无法解析。请检查全局 AI 是否正常，或稍后重试。')
}

// 通用字段提取与归一化
export function asString(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number') return String(v)
  return ''
}
export function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => asString(x)).filter(Boolean)
  if (typeof v === 'string') return v.split(/[,，\n]/).map((x) => x.trim()).filter(Boolean)
  return []
}

// 校验结果是否为对象且含至少一个非空字段；否则抛错
export function assertHasContent(obj: Record<string, unknown>, fields: string[]): void {
  const has = fields.some((f) => {
    const v = obj[f]
    return (Array.isArray(v) ? v.length > 0 : asString(v).length > 0)
  })
  if (!has) {
    throw new Error(`AI 返回内容校验失败：缺少有效字段（${fields.join(' / ')}）`)
  }
}
