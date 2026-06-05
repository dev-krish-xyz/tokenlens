import type { OpenAIResponse } from '../types.ts'

interface IncomingMessage {
  role: string
  content: string
}

interface IncomingBody {
  messages: IncomingMessage[]
  [key: string]: unknown
}

interface GeminiPart {
  text: string
}

interface GeminiContent {
  parts: GeminiPart[]
}

interface GeminiCandidate {
  content: GeminiContent
  finishReason: string
}

interface GeminiUsageMetadata {
  promptTokenCount: number
  candidatesTokenCount: number
}

interface GeminiResponse {
  candidates: GeminiCandidate[]
  usageMetadata: GeminiUsageMetadata
}

export function transformRequest(body: unknown): unknown {
  const b = body as IncomingBody
  const systemMsg = b.messages.find(m => m.role === 'system')
  const contents = b.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  return {
    contents,
    ...(systemMsg !== undefined ? { systemInstruction: systemMsg.content } : {}),
  }
}

export function transformResponse(body: unknown): OpenAIResponse {
  const b = body as GeminiResponse
  const candidate = b.candidates[0]
  const text = candidate?.content.parts[0]?.text ?? ''
  const finishReason = candidate?.finishReason ?? null
  return {
    choices: [
      {
        message: { role: 'assistant', content: text },
        finish_reason: finishReason,
      },
    ],
    usage: {
      prompt_tokens: b.usageMetadata.promptTokenCount,
      completion_tokens: b.usageMetadata.candidatesTokenCount,
      total_tokens: b.usageMetadata.promptTokenCount + b.usageMetadata.candidatesTokenCount,
    },
  }
}
