import type { OpenAIResponse } from '../types.ts'

interface IncomingMessage {
  role: string
  content: string
}

interface IncomingBody {
  messages: IncomingMessage[]
  max_tokens?: number
  [key: string]: unknown
}

interface AnthropicContentBlock {
  type: string
  text: string
}

interface AnthropicUsage {
  input_tokens: number
  output_tokens: number
}

interface AnthropicResponse {
  content: AnthropicContentBlock[]
  stop_reason: string | null
  usage: AnthropicUsage
}

export function transformRequest(body: unknown): unknown {
  const b = body as IncomingBody
  const systemMsg = b.messages.find(m => m.role === 'system')
  const messages = b.messages.filter(m => m.role !== 'system')
  return {
    ...b,
    messages,
    max_tokens: b.max_tokens ?? 1024,
    ...(systemMsg !== undefined ? { system: systemMsg.content } : {}),
  }
}

export function transformResponse(body: unknown): OpenAIResponse {
  const b = body as AnthropicResponse
  const text = b.content[0]?.text ?? ''
  return {
    choices: [
      {
        message: { role: 'assistant', content: text },
        finish_reason: b.stop_reason,
      },
    ],
    usage: {
      prompt_tokens: b.usage.input_tokens,
      completion_tokens: b.usage.output_tokens,
      total_tokens: b.usage.input_tokens + b.usage.output_tokens,
    },
  }
}
