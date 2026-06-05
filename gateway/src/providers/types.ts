export interface ChatMessage {
  role: string
  content: string
}

export interface OpenAIChoice {
  message: {
    role: 'assistant'
    content: string
  }
  finish_reason: string | null
}

export interface OpenAIUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface OpenAIResponse {
  choices: OpenAIChoice[]
  usage: OpenAIUsage
}

export interface Provider {
  name: string
  chatEndpoint: string
  buildHeaders(apiKey: string): Record<string, string>
  transformRequest(body: unknown): unknown
  transformResponse(body: unknown): OpenAIResponse
  buildUrl?(model: string, apiKey: string): string
}
