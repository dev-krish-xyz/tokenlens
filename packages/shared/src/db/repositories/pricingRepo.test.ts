import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { ModelPricing } from '../schema.ts'

type AnyRow = Record<string, unknown>

let _cacheData: Record<string, string> = {}
let _dbRows: AnyRow[] = []

const mockDragonflyGet = mock(async (key: string) => _cacheData[key] ?? null)
const mockDragonflySetex = mock(async (_key: string, _ttl: number, _val: string) => 'OK' as const)

mock.module('../../dragonfly/client.ts', () => ({
  dragonflyClient: { get: mockDragonflyGet, setex: mockDragonflySetex },
}))

mock.module('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ _op: 'and', conds }),
  gt: (col: unknown, val: unknown) => ({ _op: 'gt', col, val }),
  isNull: (col: unknown) => ({ _op: 'isNull', col }),
  asc: (col: unknown) => ({ _op: 'asc', col }),
  desc: (col: unknown) => ({ _op: 'desc', col }),
}))

function makeSelectChain() {
  const chain: {
    from: (t: unknown) => typeof chain
    where: (cond: unknown) => Promise<AnyRow[]>
  } = {
    from: (_t) => chain,
    where: (_cond) => Promise.resolve([..._dbRows]),
  }
  return chain
}

mock.module('../client.ts', () => ({
  db: { select: () => makeSelectChain() },
}))

const { findByPattern } = await import('./pricingRepo.ts')

const BASE_PRICING: ModelPricing = {
  id: 'price-1',
  provider: 'openai',
  model_pattern: 'gpt-4o-mini',
  input_price_per_m: '0.150000',
  output_price_per_m: '0.600000',
  updated_at: new Date(),
}

beforeEach(() => {
  _cacheData = {}
  _dbRows = []
  mockDragonflyGet.mockClear()
  mockDragonflySetex.mockClear()
})

describe('pricingRepo.findByPattern', () => {
  test('cache hit → Postgres NOT called', async () => {
    _cacheData['pricing:openai:gpt-4o-mini'] = JSON.stringify(BASE_PRICING)

    const result = await findByPattern('openai', 'gpt-4o-mini')

    expect(result?.id).toBe('price-1')
    // db.select is a factory so we can't easily count calls, but dragonflyGet was called once
    expect(mockDragonflyGet.mock.calls).toHaveLength(1)
    // setex NOT called on cache hit
    expect(mockDragonflySetex.mock.calls).toHaveLength(0)
  })

  test('cache miss → Postgres queried, result cached TTL 3600', async () => {
    _dbRows = [BASE_PRICING as AnyRow]

    const result = await findByPattern('openai', 'gpt-4o-mini')

    expect(result?.provider).toBe('openai')
    expect(mockDragonflySetex.mock.calls).toHaveLength(1)
    const setexCall = mockDragonflySetex.mock.calls[0] as [string, number, string]
    expect(setexCall[1]).toBe(3600)
  })

  test('no matching pattern → returns null, null cached', async () => {
    _dbRows = [BASE_PRICING as AnyRow]

    const result = await findByPattern('openai', 'gpt-999-ultra-nonexistent')

    expect(result).toBeNull()
    expect(mockDragonflySetex.mock.calls).toHaveLength(1)
    const setexCall = mockDragonflySetex.mock.calls[0] as [string, number, string]
    expect(JSON.parse(setexCall[2])).toBeNull()
  })

  test("'gpt-4o-mini-2024-07-18' matches pattern 'gpt-4o-mini' via regex", async () => {
    const pricing = { ...BASE_PRICING, model_pattern: 'gpt-4o-mini' }
    _dbRows = [pricing as AnyRow]

    const result = await findByPattern('openai', 'gpt-4o-mini-2024-07-18')

    expect(result).not.toBeNull()
  })
})
