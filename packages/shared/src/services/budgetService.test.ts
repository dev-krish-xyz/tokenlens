import { describe, test, expect, mock, beforeEach } from 'bun:test'

type AnyRow = Record<string, unknown>

// Pipeline mock — shared across tests, reset in beforeEach
const mockPipelineIncrbyfloat = mock((_key: string, _val: number) => {})
const mockPipelineExpire = mock((_key: string, _ttl: number) => {})
const mockPipelineExec = mock(async () => [])
const mockPipeline = {
  incrbyfloat: mockPipelineIncrbyfloat,
  expire: mockPipelineExpire,
  exec: mockPipelineExec,
}

let _dragonflyData: Record<string, string> = {}

const mockDragonflyPipeline = mock(() => mockPipeline)
const mockDragonflyMget = mock(async (...keys: string[]) =>
  keys.map((k) => _dragonflyData[k] ?? null)
)
const mockDragonflyGet = mock(async (key: string) => _dragonflyData[key] ?? null)
const mockDragonflySetex = mock(async (_key: string, _ttl: number, _val: string) => 'OK' as const)
const mockDragonflyDel = mock(async (_key: string) => 1)

mock.module('../dragonfly/client.ts', () => ({
  dragonflyClient: {
    pipeline: mockDragonflyPipeline,
    mget: mockDragonflyMget,
    get: mockDragonflyGet,
    setex: mockDragonflySetex,
    del: mockDragonflyDel,
  },
}))

mock.module('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ _op: 'and', conds }),
  desc: (col: unknown) => ({ _op: 'desc', col }),
}))

let _dbRows: AnyRow[] = []

function makeSelectChain() {
  const chain: {
    from: (t: unknown) => typeof chain
    where: (cond: unknown) => Promise<AnyRow[]>
  } = {
    from: (_t: unknown) => chain,
    where: (_cond: unknown) => Promise.resolve([..._dbRows]),
  }
  return chain
}

const mockDbSelect = mock((_fields?: unknown) => makeSelectChain())
const mockDb = {
  select: mockDbSelect,
}

mock.module('../db/client.ts', () => ({ db: mockDb }))

const { incrementSpend, getCurrentSpend, getRemainingBudget } = await import('./budgetService.ts')
const { getBudgetCap } = await import('../db/repositories/workspaceRepo.ts')

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7).replace('-', '')
}

beforeEach(() => {
  _dragonflyData = {}
  _dbRows = []
  mockPipelineIncrbyfloat.mockClear()
  mockPipelineExpire.mockClear()
  mockPipelineExec.mockClear()
  mockDragonflyPipeline.mockClear()
  mockDragonflyMget.mockClear()
  mockDragonflyGet.mockClear()
  mockDragonflySetex.mockClear()
  mockDragonflyDel.mockClear()
  mockDbSelect.mockClear()
})

describe('incrementSpend', () => {
  test('costUsd = 0 → pipeline NOT called', async () => {
    await incrementSpend('vk-1', 'ws-1', 0)
    expect(mockDragonflyPipeline).not.toHaveBeenCalled()
  })

  test('costUsd > 0 → incrbyfloat called twice', async () => {
    await incrementSpend('vk-1', 'ws-1', 0.00045)
    expect(mockPipelineIncrbyfloat).toHaveBeenCalledTimes(2)
  })

  test('key counter format correct', async () => {
    const month = currentMonth()
    await incrementSpend('vk-abc', 'ws-xyz', 0.5)
    expect(mockPipelineIncrbyfloat).toHaveBeenCalledWith(`spend:key:${month}:vk-abc`, 0.5)
  })

  test('workspace counter format correct', async () => {
    const month = currentMonth()
    await incrementSpend('vk-abc', 'ws-xyz', 0.5)
    expect(mockPipelineIncrbyfloat).toHaveBeenCalledWith(`spend:ws:${month}:ws-xyz`, 0.5)
  })

  test('expire called with 35-day TTL for both keys', async () => {
    await incrementSpend('vk-1', 'ws-1', 1.0)
    expect(mockPipelineExpire).toHaveBeenCalledTimes(2)
    const ttl = 35 * 24 * 60 * 60
    const calls = mockPipelineExpire.mock.calls
    expect(calls[0]?.[1]).toBe(ttl)
    expect(calls[1]?.[1]).toBe(ttl)
  })
})

describe('getCurrentSpend', () => {
  test('both keys missing → { keySpend: 0, wsSpend: 0 }', async () => {
    const result = await getCurrentSpend('vk-1', 'ws-1')
    expect(result).toEqual({ keySpend: 0, wsSpend: 0 })
  })

  test('both keys present → correct floats', async () => {
    const month = currentMonth()
    _dragonflyData[`spend:key:${month}:vk-1`] = '1.25'
    _dragonflyData[`spend:ws:${month}:ws-1`] = '4.50'
    const result = await getCurrentSpend('vk-1', 'ws-1')
    expect(result).toEqual({ keySpend: 1.25, wsSpend: 4.5 })
  })
})

describe('getRemainingBudget', () => {
  test('both caps null → returns nulls, getCurrentSpend NOT called', async () => {
    const result = await getRemainingBudget('vk-1', 'ws-1', null, null)
    expect(result).toEqual({ keyRemaining: null, wsRemaining: null })
    expect(mockDragonflyMget).not.toHaveBeenCalled()
  })

  test('keyCap=10, spent=3.50 → keyRemaining=6.50', async () => {
    const month = currentMonth()
    _dragonflyData[`spend:key:${month}:vk-1`] = '3.50'
    _dragonflyData[`spend:ws:${month}:ws-1`] = '0'
    const result = await getRemainingBudget('vk-1', 'ws-1', 10, null)
    expect(result.keyRemaining).toBeCloseTo(6.5, 8)
    expect(result.wsRemaining).toBeNull()
  })

  test('keyCap=10, spent=10.5 → keyRemaining=-0.50 (over budget)', async () => {
    const month = currentMonth()
    _dragonflyData[`spend:key:${month}:vk-1`] = '10.5'
    _dragonflyData[`spend:ws:${month}:ws-1`] = '10.5'
    const result = await getRemainingBudget('vk-1', 'ws-1', 10, null)
    expect(result.keyRemaining).toBeCloseTo(-0.5, 8)
  })

  test('keyCap set, wsCap=null → wsRemaining=null, keyRemaining calculated', async () => {
    const month = currentMonth()
    _dragonflyData[`spend:key:${month}:vk-2`] = '2.00'
    _dragonflyData[`spend:ws:${month}:ws-2`] = '5.00'
    const result = await getRemainingBudget('vk-2', 'ws-2', 10, null)
    expect(result.wsRemaining).toBeNull()
    expect(result.keyRemaining).toBeCloseTo(8.0, 8)
  })
})

describe('workspaceRepo.getBudgetCap', () => {
  test('cache hit → Postgres NOT called', async () => {
    _dragonflyData['wscap:ws-1'] = '50'
    const result = await getBudgetCap('ws-1')
    expect(result).toBe(50)
    expect(mockDbSelect).not.toHaveBeenCalled()
  })

  test('cache miss → Postgres queried, result cached', async () => {
    _dbRows = [{ budget_cap: '100' }]
    await getBudgetCap('ws-2')
    expect(mockDragonflySetex).toHaveBeenCalledWith('wscap:ws-2', 300, '100')
  })

  test('Postgres returns null cap → cached as string "null", returns null', async () => {
    _dbRows = [{ budget_cap: null }]
    const result = await getBudgetCap('ws-3')
    expect(result).toBeNull()
    expect(mockDragonflySetex).toHaveBeenCalledWith('wscap:ws-3', 300, 'null')
  })

  test('cache contains "null" string → returns null (not 0)', async () => {
    _dragonflyData['wscap:ws-4'] = 'null'
    const result = await getBudgetCap('ws-4')
    expect(result).toBeNull()
  })
})
