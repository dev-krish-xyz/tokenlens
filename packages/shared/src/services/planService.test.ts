import { describe, test, expect, mock, beforeEach } from 'bun:test'

mock.module('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ _op: 'and', conds }),
  gt: (col: unknown, val: unknown) => ({ _op: 'gt', col, val }),
  isNull: (col: unknown) => ({ _op: 'isNull', col }),
  asc: (col: unknown) => ({ _op: 'asc', col }),
  desc: (col: unknown) => ({ _op: 'desc', col }),
}))

const mockDragonflyGet = mock(async (_key: string): Promise<string | null> => null)
const mockDragonflySetex = mock(async (_key: string, _ttl: number, _val: string) => 'OK' as const)
const mockDragonflyDel = mock(async (_key: string) => 1)

mock.module('../dragonfly/client.ts', () => ({
  dragonflyClient: {
    get: mockDragonflyGet,
    setex: mockDragonflySetex,
    del: mockDragonflyDel,
  },
}))

type AnyRow = Record<string, unknown>
let _dbRows: AnyRow[] = []

function makeSelectChain() {
  return {
    from: (_t: unknown) => ({
      where: (_cond: unknown) => {
        const rows = [..._dbRows]
        return Object.assign(Promise.resolve(rows), {
          limit: (_n: number) => Promise.resolve(rows),
        })
      },
    }),
  }
}

mock.module('../db/client.ts', () => ({
  db: { select: (_cols?: unknown) => makeSelectChain() },
}))

const { getPlanTier, invalidatePlanCache, isProOrAbove } = await import('./planService.ts')

beforeEach(() => {
  _dbRows = []
  mockDragonflyGet.mockClear()
  mockDragonflySetex.mockClear()
  mockDragonflyDel.mockClear()
  mockDragonflyGet.mockImplementation(async () => null)
})

describe('getPlanTier', () => {
  test('cache hit → returns cached value, no DB call', async () => {
    mockDragonflyGet.mockImplementation(async () => 'pro')
    const result = await getPlanTier('ws-1')
    expect(result).toBe('pro')
    expect(mockDragonflySetex.mock.calls).toHaveLength(0)
  })

  test('cache miss → queries DB and populates cache', async () => {
    _dbRows = [{ id: 'ws-1', plan_tier: 'pro' }]
    const result = await getPlanTier('ws-1')
    expect(result).toBe('pro')
    expect(mockDragonflySetex.mock.calls).toHaveLength(1)
    const call = mockDragonflySetex.mock.calls[0] as [string, number, string]
    expect(call[0]).toBe('plan:ws-1')
    expect(call[1]).toBe(300)
    expect(call[2]).toBe('pro')
  })

  test('cache miss, no DB row → defaults to free', async () => {
    _dbRows = []
    const result = await getPlanTier('ws-missing')
    expect(result).toBe('free')
  })
})

describe('invalidatePlanCache', () => {
  test('calls dragonfly.del with correct key', async () => {
    await invalidatePlanCache('ws-2')
    expect(mockDragonflyDel.mock.calls).toHaveLength(1)
    const call = mockDragonflyDel.mock.calls[0] as [string]
    expect(call[0]).toBe('plan:ws-2')
  })
})

describe('isProOrAbove', () => {
  test('free → false', () => expect(isProOrAbove('free')).toBe(false))
  test('pro → true', () => expect(isProOrAbove('pro')).toBe(true))
  test('enterprise → true', () => expect(isProOrAbove('enterprise')).toBe(true))
})
