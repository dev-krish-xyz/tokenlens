import type { Context } from 'hono'
import { stream } from 'hono/streaming'
import { ProviderError } from '@tokenlens/shared'
import { ingestionQueue } from '@tokenlens/shared/queues/definitions'
import type { GatewayVariables } from '../types.ts'
import { providerRegistry } from '../providers/index.ts'
import { buildIngestionJob } from './ingestionJob.ts'

type GatewayContext = Context<{ Variables: GatewayVariables }>

// True only when a data line carries a top-level "error" key — an upstream
// error event. Assistant content merely containing the word "error" parses to
// a payload with "choices"/"candidates" at the top level and passes through.
function hasUpstreamErrorEvent(chunk: string): boolean {
  for (const line of chunk.split('\n')) {
    if (!line.startsWith('data: ')) continue
    try {
      const data = JSON.parse(line.slice(6)) as Record<string, unknown>
      if (data !== null && typeof data === 'object' && 'error' in data) return true
    } catch {}
  }
  return false
}

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
    // The upstream status describes the platform's provider account, not the
    // client's virtual key — pass through only 429 (backoff signal), map the rest to 502.
    console.error(`[stream] ${ctx.provider} upstream returned ${providerRes.status}`)
    throw new ProviderError('Upstream provider request failed', providerRes.status === 429 ? 429 : 502)
  }

  const tokenUsage = { tokensIn: 0, tokensOut: 0 }

  return stream(c, async (s) => {
    const reader = providerRes.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      if (chunk.includes('"error"') && hasUpstreamErrorEvent(chunk)) {
        // Upstream error events carry quota/account detail about the platform's
        // provider key — replace with a generic event and end the stream.
        await s.write('data: {"error":{"message":"Upstream provider error","code":"PROVIDER_ERROR"}}\n\n')
        break
      }
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
          providerRes.status,
          c,
        ),
      )
      .catch((err: Error) => console.error('Ingestion enqueue failed:', err.message))
  })
}
