import type { Context } from 'hono'
import type { WorkspaceContext } from '@tokenlens/shared'
import type { GatewayVariables } from '../types.ts'
import type { IngestionJobData } from '@tokenlens/shared/queues/types'

type ParsedBody = GatewayVariables['body']
type GatewayContext = Context<{ Variables: GatewayVariables }>

export function buildIngestionJob(
  ctx: WorkspaceContext,
  body: ParsedBody,
  response: { usage?: { prompt_tokens?: number; completion_tokens?: number } },
  latencyMs: number,
  statusCode: number,
  c: GatewayContext,
): IngestionJobData {
  return {
    requestId: c.get('requestId'),
    virtualKeyId: ctx.virtualKeyId,
    workspaceId: ctx.workspaceId,
    provider: ctx.provider,
    model: body.model,
    envTag: c.get('envTag'),
    featureTag: c.get('featureTag'),
    userIdTag: c.get('userIdTag'),
    tokensIn: response.usage?.prompt_tokens ?? 0,
    tokensOut: response.usage?.completion_tokens ?? 0,
    latencyMs,
    statusCode,
    createdAt: new Date().toISOString(),
  }
}
