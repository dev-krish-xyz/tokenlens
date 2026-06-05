import type { Context } from 'hono'
import { ProviderError } from '@tokenlens/shared'
import { ingestionQueue } from '@tokenlens/shared/queues/definitions'
import type { GatewayVariables } from '../types.ts'
import { providerRegistry } from '../providers/index.ts'
import { buildIngestionJob } from './ingestionJob.ts'

type GatewayContext = Context<{ Variables: GatewayVariables }>

export async function proxyHandler(c: GatewayContext): Promise<Response> {
  const ctx = c.get('ctx')
  const body = c.get('body')
  const provider = providerRegistry[ctx.provider]
  if (!provider) throw new ProviderError(`Unknown provider: ${ctx.provider}`, 400)

  const transformedBody = provider.transformRequest(body)

  const providerUrl = provider.buildUrl
    ? provider.buildUrl(body.model, ctx.realApiKey)
    : `https://api.${ctx.provider}.com${provider.chatEndpoint}`
  const headers = provider.buildHeaders(ctx.realApiKey)

  const startTime = Date.now()

  const providerRes = await fetch(providerUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(transformedBody),
  })

  if (!providerRes.ok) {
    await providerRes.text()
    throw new ProviderError(`Provider returned ${providerRes.status}`, providerRes.status)
  }

  const responseJson = await providerRes.json() as Record<string, unknown>
  const normalized = provider.transformResponse(responseJson)

  const latencyMs = Date.now() - startTime

  ingestionQueue
    .add('ingest', buildIngestionJob(ctx, body, normalized, latencyMs, providerRes.status, c))
    .catch((err: Error) => console.error('Ingestion enqueue failed:', err.message))

  return c.json(normalized, 200)
}
