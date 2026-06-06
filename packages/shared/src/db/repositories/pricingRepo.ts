import { eq } from 'drizzle-orm'
import { db } from '../client.ts'
import { model_pricing } from '../schema.ts'
import type { ModelPricing } from '../schema.ts'
import { dragonflyClient } from '../../dragonfly/client.ts'

export async function findByPattern(provider: string, model: string): Promise<ModelPricing | null> {
  const cacheKey = `pricing:${provider}:${model}`

  const cached = await dragonflyClient.get(cacheKey)
  if (cached !== null) return JSON.parse(cached) as ModelPricing | null

  const rows = await db.select().from(model_pricing).where(eq(model_pricing.provider, provider))

  const match =
    rows.find((row) => {
      try {
        return new RegExp(row.model_pattern).test(model)
      } catch {
        return false
      }
    }) ?? null

  await dragonflyClient.setex(cacheKey, 3600, JSON.stringify(match))
  return match
}
