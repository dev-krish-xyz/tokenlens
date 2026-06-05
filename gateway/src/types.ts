import type { WorkspaceContext } from '@tokenlens/shared'

export interface GatewayVariables {
  requestId: string | undefined
  body: {
    model: string
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
    stream?: boolean
    max_tokens?: number
    temperature?: number
  }
  isStreaming: boolean
  featureTag: string
  userIdTag: string
  envTag: string
  ctx: WorkspaceContext
}
