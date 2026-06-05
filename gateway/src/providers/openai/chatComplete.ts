import type { OpenAIResponse } from '../types.ts'

export function transformRequest(body: unknown): unknown {
  return body
}

export function transformResponse(body: unknown): OpenAIResponse {
  return body as OpenAIResponse
}
