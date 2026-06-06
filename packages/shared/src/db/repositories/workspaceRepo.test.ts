import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { Workspace } from '../schema.ts'

type AnyRow = Record<string, unknown>

mock.module('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ _op: 'and', conds }),
  desc: (col: unknown) => ({ _op: 'desc', col }),
}))

function makeInsertChain(rows: AnyRow[]) {
  const chain = {
    values: (_vals: unknown) => chain,
    returning: () => Promise.resolve([...rows]),
    onConflictDoNothing: () => Promise.resolve(),
  }
  return chain
}

function makeSelectChain(rows: AnyRow[]) {
  return {
    from: (_t: unknown) => ({
      innerJoin: (_t2: unknown, _on: unknown) => ({
        where: (_cond: unknown) => ({
          limit: (_n: number) => Promise.resolve([...rows]),
        }),
      }),
      where: (_cond: unknown) => Promise.resolve([...rows]),
    }),
  }
}

const workspaceRows: AnyRow[] = []

const mockDb = {
  select: () => makeSelectChain(workspaceRows),
  insert: (_table: unknown) => makeInsertChain([]),
  // transaction replaced per-test below
  transaction: async (_fn: (tx: unknown) => Promise<unknown>): Promise<unknown> => Promise.resolve(null),
}

mock.module('../client.ts', () => ({ db: mockDb }))

const { createWithAdmin, findByUserId, findById } = await import('./workspaceRepo.ts')

const BASE_WORKSPACE: Workspace = {
  id: 'ws-001',
  name: "alice's workspace",
  plan: 'free',
  budget_cap: null,
  slack_webhook_url: null,
  stripe_customer_id: null,
  created_at: new Date(),
}

beforeEach(() => {
  workspaceRows.length = 0
})

describe('workspaceRepo', () => {
  test('createWithAdmin runs inside a transaction and returns workspace', async () => {
    let txCalled = false
    mockDb.transaction = async (fn) => {
      txCalled = true
      const tx = {
        insert: (_table: unknown) => makeInsertChain([BASE_WORKSPACE as AnyRow]),
      }
      return fn(tx)
    }

    const ws = await createWithAdmin('user-001', 'alice@example.com')
    expect(ws.id).toBe('ws-001')
    expect(txCalled).toBe(true)
  })

  test('findByUserId returns null when no rows', async () => {
    const result = await findByUserId('user-999')
    expect(result).toBeNull()
  })

  test('findById returns null when no rows', async () => {
    const result = await findById('ws-999')
    expect(result).toBeNull()
  })
})
