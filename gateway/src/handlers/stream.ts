import type { Context } from 'hono'
import { stream } from 'hono/streaming'
import { ProviderError } from '@tokenlens/shared'
import { ingestionQueue } from '@tokenlens/shared/queues/definitions'
import type { GatewayVariables } from '../types.ts'
import { providerRegistry } from '../providers/index.ts'
import { buildIngestionJob } from './ingestionJob.ts'

type GatewayContext = Context<{ Variables: GatewayVariables }>

export async function streamHandler(c: GatewayContext): Promise<Response> {
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

  const tokenUsage = { tokensIn: 0, tokensOut: 0 }

  return stream(c, async (s) => {
    const reader = providerRes.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      if (chunk.includes('"usage"')) {
        try {
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
          for (const line of lines) {
            const data = JSON.parse(line.slice(6)) as {
              usage?: { prompt_tokens?: number; completion_tokens?: number }
            }
            if (data.usage) {
              tokenUsage.tokensIn = data.usage.prompt_tokens ?? 0
              tokenUsage.tokensOut = data.usage.completion_tokens ?? 0
            }
          }
        } catch {}
      }
      await s.write(chunk)
    }
    const latencyMs = Date.now() - startTime
    ingestionQueue
      .add(
        'ingest',
        buildIngestionJob(
          ctx,
          body,
          { usage: { prompt_tokens: tokenUsage.tokensIn, completion_tokens: tokenUsage.tokensOut } },
          latencyMs,
          200,
          c,
        ),
      )
      .catch((err: Error) => console.error('Ingestion enqueue failed:', err.message))
  })
}
