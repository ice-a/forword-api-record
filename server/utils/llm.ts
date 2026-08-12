import { createError } from 'h3'

export interface ChatArgs {
  baseURL: string
  apiKey: string
  model: string
  system: string
  user: string
  maxTokens?: number
  temperature?: number
}

// 调用 OpenAI 兼容的 /v1/chat/completions 接口，返回模型文本
export async function callChat(args: ChatArgs): Promise<string> {
  const { baseURL, apiKey, model, system, user, maxTokens = 600, temperature = 0.3 } = args
  const url = baseURL.replace(/\/$/, '') + '/v1/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      max_tokens: maxTokens,
      temperature
    })
  })
  if (!res.ok) {
    const t = await res.text()
    throw createError({ statusCode: 502, statusMessage: `上游错误 ${res.status}: ${t.slice(0, 200)}` })
  }
  const data: any = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}
