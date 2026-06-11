import { dragonflyClient } from '../dragonfly/client.ts'
import { findById } from '../db/repositories/workspaceRepo.ts'

export type PlanTier = 'free' | 'pro' | 'enterprise'

const CACHE_TTL = 300

export async function getPlanTier(workspaceId: string): Promise<PlanTier> {
  const cached = await dragonflyClient.get(`plan:${workspaceId}`)
  if (cached) return cached as PlanTier

  const ws = await findById(workspaceId)
  const tier = (ws?.plan_tier ?? 'free') as PlanTier
  await dragonflyClient.setex(`plan:${workspaceId}`, CACHE_TTL, tier)
  return tier
}

export async function invalidatePlanCache(workspaceId: string): Promise<void> {
  await dragonflyClient.del(`plan:${workspaceId}`)
}

export function isProOrAbove(tier: PlanTier): boolean {
  return tier === 'pro' || tier === 'enterprise'
}
