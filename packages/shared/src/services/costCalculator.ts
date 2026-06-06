import type { ModelPricing } from '../db/schema.ts'

export function calculateCost(
  tokensIn: number,
  tokensOut: number,
  pricing: ModelPricing | null,
): number {
  if (!pricing) return 0
  return (
    (tokensIn / 1_000_000) * Number(pricing.input_price_per_m) +
    (tokensOut / 1_000_000) * Number(pricing.output_price_per_m)
  )
}
