import { describe, test, expect } from 'bun:test'
import { calculateCost } from './costCalculator.ts'
import type { ModelPricing } from '../db/schema.ts'

function makePricing(inputPricePerM: string, outputPricePerM: string): ModelPricing {
  return {
    id: 'price-id-1',
    provider: 'openai',
    model_pattern: 'gpt-4o-mini',
    input_price_per_m: inputPricePerM,
    output_price_per_m: outputPricePerM,
    updated_at: new Date(),
  }
}

describe('calculateCost', () => {
  test('gpt-4o-mini: 1000 tokensIn + 500 tokensOut = 0.00045', () => {
    const pricing = makePricing('0.150000', '0.600000')
    const result = calculateCost(1000, 500, pricing)
    expect(result).toBeCloseTo(0.00045, 8)
  })

  test('claude-3-5-sonnet: 2000 tokensIn + 1000 tokensOut = 0.021', () => {
    const pricing = makePricing('3.000000', '15.000000')
    const result = calculateCost(2000, 1000, pricing)
    expect(result).toBeCloseTo(0.021, 8)
  })

  test('pricing null → returns 0, does not throw', () => {
    expect(calculateCost(1000, 500, null)).toBe(0)
  })

  test('tokensIn = 0, tokensOut = 0 → returns 0', () => {
    const pricing = makePricing('0.150000', '0.600000')
    expect(calculateCost(0, 0, pricing)).toBe(0)
  })
})
