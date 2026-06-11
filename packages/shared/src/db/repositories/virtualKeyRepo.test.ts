import { describe, test, expect, mock } from 'bun:test'

// Mock drizzle-orm so WHERE conditions are plain inspectable objects.
// schema.ts uses 'drizzle-orm/pg-core' (different specifier) — unaffected.
// All type imports from 'drizzle-orm' are erased at runtime — also unaffected.
mock.module('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ _op: 'and', conds }),
  gt: (col: unknown, val: unknown) => ({ _op: 'gt', col, val }),
  isNull: (col: unknown) => ({ _op: 'isNull', col }),
  asc: (col: unknown) => ({ _op: 'asc', col }),
  desc: (col: unknown) => ({ _op: 'desc', col }),
}))

type AnyRow = Record<string, unknown>

let _selectRows: AnyRow[] = []
let _capturedSelectWhere: unknown = null
let _capturedUpdateWhere: unknown = null

function makeQueryChain() {
  const chain: {
    from: (t: unknown) => typeof chain
    where: (cond: unknown) => typeof chain
    orderBy: (...args: unknown[]) => Promise<AnyRow[]>
    then: (
      resolve: (v: AnyRow[]) => unknown,
      reject?: (e: unknown) => unknown,
    ) => Promise<unknown>
  } = {
    from: (_t) => chain,
    where: (cond) => {
      _capturedSelectWhere = cond
      return chain
    },
    orderBy: (..._args) => Promise.resolve([..._selectRows]),
    then: (resolve, reject) => Promise.resolve([..._selectRows]).then(resolve, reject),
  }
  return chain
}

const mockDb = {
  select: () => makeQueryChain(),
  insert: (_t: unknown) => ({
    values: (_d: unknown) => ({
      returning: () => Promise.resolve([..._selectRows]),
    }),
  }),
  update: (_t: unknown) => ({
    set: (_v: unknown) => ({
      where: (cond: unknown) => {
        _capturedUpdateWhere = cond
        return Promise.resolve()
      },
    }),
  }),
}

mock.module('../client.ts', () => ({ db: mockDb }))

const { findById, findByWorkspace, softDelete, create } =
  await import('./virtualKeyRepo.ts')

const baseRow: AnyRow = {
  id: 'vk-id-1',
  workspace_id: 'ws-id-1',
  name: 'Test Key',
  provider: 'openai',
  encrypted_key: 'enc-secret-value',
  budget_cap: null,
  is_active: true,
  created_at: new Date(),
}

describe('findById', () => {
  test('returns null when no rows (is_active=false filtered out by WHERE)', async () => {
    _selectRows = []
    const result = await findById('vk-id-1')
    expect(result).toBeNull()
  })

  test('returns row when found', async () => {
    _selectRows = [baseRow]
    const result = await findById('vk-id-1')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('vk-id-1')
  })
})

describe('findByWorkspace', () => {
  test('never returns encrypted_key field in results', async () => {
    _selectRows = [baseRow]
    const results = await findByWorkspace('ws-id-1')
    expect(results).toHaveLength(1)
    const row = results[0]
    expect(row).not.toBeUndefined()
    expect('encrypted_key' in (row ?? {})).toBe(false)
  })
})

describe('softDelete', () => {
  test('WHERE includes both id AND workspaceId', async () => {
    _capturedUpdateWhere = null
    await softDelete('vk-id-99', 'ws-id-77')
    const cond = _capturedUpdateWhere as {
      _op: string
      conds: Array<{ _op: string; val: unknown }>
    }
    expect(cond._op).toBe('and')
    expect(cond.conds.some((c) => c.val === 'vk-id-99')).toBe(true)
    expect(cond.conds.some((c) => c.val === 'ws-id-77')).toBe(true)
  })
})
