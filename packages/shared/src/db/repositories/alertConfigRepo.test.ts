import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { AlertConfig } from '../schema.ts'

type AnyRow = Record<string, unknown>

mock.module('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ _op: 'and', conds }),
  gt: (col: unknown, val: unknown) => ({ _op: 'gt', col, val }),
  isNull: (col: unknown) => ({ _op: 'isNull', col }),
  asc: (col: unknown) => ({ _op: 'asc', col }),
  desc: (col: unknown) => ({ _op: 'desc', col }),
}))

let lastInsertValues: AnyRow | null = null
let lastUpdateSet: AnyRow | null = null
let lastUpdateWhere: unknown = null
let lastDeleteWhere: unknown = null
let selectRows: AnyRow[] = []

function makeSelectChain(rows: AnyRow[]) {
  return {
    from: (_t: unknown) => ({
      where: (_cond: unknown) => ({
        orderBy: (_ord: unknown) => Promise.resolve([...rows]),
      }),
    }),
  }
}

function makeInsertChain(returnRows: AnyRow[]) {
  const chain = {
    values: (vals: AnyRow) => {
      lastInsertValues = vals
      return chain
    },
    returning: () => Promise.resolve([...returnRows]),
  }
  return chain
}

function makeUpdateChain(returnRows: AnyRow[]) {
  const chain = {
    set: (vals: AnyRow) => {
      lastUpdateSet = vals
      return chain
    },
    where: (cond: unknown) => {
      lastUpdateWhere = cond
      return chain
    },
    returning: () => Promise.resolve([...returnRows]),
  }
  return chain
}

function makeDeleteChain() {
  const chain = {
    where: (cond: unknown) => {
      lastDeleteWhere = cond
      return Promise.resolve()
    },
  }
  return chain
}

const mockDb = {
  select: () => makeSelectChain(selectRows),
  insert: (_table: unknown) => makeInsertChain([]),
  update: (_table: unknown) => makeUpdateChain([]),
  delete: (_table: unknown) => makeDeleteChain(),
}

mock.module('../client.ts', () => ({ db: mockDb }))

const { listByWorkspace, create, update, deleteConfig } = await import('./alertConfigRepo.ts')

const BASE_CONFIG: AlertConfig = {
  id: 'cfg-001',
  workspace_id: 'ws-aaa',
  channel: 'alert@example.com',
  threshold_pct: 80,
  cooldown_min: 60,
  is_active: true,
}

beforeEach(() => {
  lastInsertValues = null
  lastUpdateSet = null
  lastUpdateWhere = null
  lastDeleteWhere = null
  selectRows.length = 0
})

describe('listByWorkspace', () => {
  test('returns configs for requested workspace', async () => {
    selectRows.push(BASE_CONFIG as AnyRow)
    const results = await listByWorkspace('ws-aaa')
    expect(results).toHaveLength(1)
    expect(results[0]?.workspace_id).toBe('ws-aaa')
  })
})

describe('create', () => {
  test('inserts with defaults: cooldownMin=60, isActive=true', async () => {
    mockDb.insert = (_table: unknown) =>
      makeInsertChain([BASE_CONFIG as AnyRow])
    await create({ workspaceId: 'ws-aaa', channel: 'alert@example.com', thresholdPct: 80 })
    expect(lastInsertValues?.cooldown_min).toBe(60)
    expect(lastInsertValues?.is_active).toBe(true)
  })

  test('thresholdPct stored as integer', async () => {
    mockDb.insert = (_table: unknown) =>
      makeInsertChain([{ ...BASE_CONFIG, threshold_pct: 75 } as AnyRow])
    await create({ workspaceId: 'ws-aaa', channel: 'alert@example.com', thresholdPct: 75 })
    expect(typeof lastInsertValues?.threshold_pct).toBe('number')
    expect(Number.isInteger(lastInsertValues?.threshold_pct)).toBe(true)
    expect(lastInsertValues?.threshold_pct).toBe(75)
  })

  test('accepts custom cooldownMin', async () => {
    mockDb.insert = (_table: unknown) =>
      makeInsertChain([{ ...BASE_CONFIG, cooldown_min: 30 } as AnyRow])
    await create({ workspaceId: 'ws-aaa', channel: 'alert@example.com', thresholdPct: 80, cooldownMin: 30 })
    expect(lastInsertValues?.cooldown_min).toBe(30)
  })
})

describe('update', () => {
  test('WHERE clause includes both id and workspaceId — ownership enforced', async () => {
    mockDb.update = (_table: unknown) =>
      makeUpdateChain([{ ...BASE_CONFIG, is_active: false } as AnyRow])
    await update('cfg-001', 'ws-aaa', { isActive: false })
    const where = lastUpdateWhere as { _op: string; conds: { _op: string; col: unknown; val: unknown }[] }
    expect(where._op).toBe('and')
    expect(where.conds).toHaveLength(2)
    const vals = where.conds.map((c) => c.val)
    expect(vals).toContain('cfg-001')
    expect(vals).toContain('ws-aaa')
  })

  test('maps isActive → is_active in SET clause', async () => {
    mockDb.update = (_table: unknown) =>
      makeUpdateChain([{ ...BASE_CONFIG, is_active: false } as AnyRow])
    await update('cfg-001', 'ws-aaa', { isActive: false })
    expect(lastUpdateSet?.is_active).toBe(false)
  })
})

describe('deleteConfig', () => {
  test('WHERE clause includes both id and workspaceId — cannot delete other workspace config', async () => {
    await deleteConfig('cfg-001', 'ws-aaa')
    const where = lastDeleteWhere as { _op: string; conds: { _op: string; col: unknown; val: unknown }[] }
    expect(where._op).toBe('and')
    expect(where.conds).toHaveLength(2)
    const vals = where.conds.map((c) => c.val)
    expect(vals).toContain('cfg-001')
    expect(vals).toContain('ws-aaa')
  })
})
