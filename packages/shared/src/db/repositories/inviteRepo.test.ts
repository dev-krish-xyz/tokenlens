import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { WorkspaceInvite } from '../schema.ts'

type AnyRow = Record<string, unknown>

mock.module('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ _op: 'and', conds }),
  gt: (col: unknown, val: unknown) => ({ _op: 'gt', col, val }),
  isNull: (col: unknown) => ({ _op: 'isNull', col }),
  asc: (col: unknown) => ({ _op: 'asc', col }),
  desc: (col: unknown) => ({ _op: 'desc', col }),
}))

// Per-test state
let lastInsertValues: AnyRow | null = null
let lastDeleteWhere: unknown = null
let lastSelectWhere: unknown = null

// Transaction state (controlled per-test)
let txSelectCallCount = 0
let txInviteRow: AnyRow | null = null
let txMemberRow: AnyRow | null = null
let txInsertValues: AnyRow | null = null
let txUpdateSet: AnyRow | null = null

function makeSelectChain(rows: AnyRow[]) {
  return {
    from: (_t: unknown) => ({
      where: (cond: unknown) => {
        lastSelectWhere = cond
        return {
          limit: (_n: number) => Promise.resolve([...rows]),
          orderBy: (_ord: unknown) => Promise.resolve([...rows]),
        }
      },
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

function makeDeleteChain() {
  return {
    where: (cond: unknown) => {
      lastDeleteWhere = cond
      return Promise.resolve()
    },
  }
}

function makeTxSelectChain(rows: AnyRow[]) {
  return {
    from: (_t: unknown) => ({
      where: (_cond: unknown) => ({
        limit: (_n: number) => Promise.resolve([...rows]),
      }),
    }),
  }
}

const mockDb = {
  select: (_cols?: unknown) => makeSelectChain([]),
  insert: (_table: unknown) => makeInsertChain([]),
  update: (_table: unknown) => ({
    set: (_vals: unknown) => ({
      where: (_cond: unknown) => Promise.resolve(),
    }),
  }),
  delete: (_table: unknown) => makeDeleteChain(),
  transaction: async (fn: (tx: unknown) => Promise<void>) => {
    txSelectCallCount = 0
    const tx = {
      select: (_cols?: unknown) => {
        const callIdx = txSelectCallCount++
        const rows = callIdx === 0
          ? txInviteRow ? [txInviteRow] : []
          : txMemberRow ? [txMemberRow] : []
        return makeTxSelectChain(rows)
      },
      insert: (_table: unknown) => ({
        values: (vals: AnyRow) => {
          txInsertValues = vals
          return Promise.resolve()
        },
      }),
      update: (_table: unknown) => ({
        set: (vals: AnyRow) => {
          txUpdateSet = vals
          return {
            where: (_cond: unknown) => Promise.resolve(),
          }
        },
      }),
    }
    return fn(tx)
  },
}

mock.module('../client.ts', () => ({ db: mockDb }))

const { create, accept, listPending, revoke } = await import('./inviteRepo.ts')

const BASE_INVITE: WorkspaceInvite = {
  id: 'inv-001',
  workspace_id: 'ws-001',
  email: 'new@example.com',
  role: 'member',
  token: 'a'.repeat(64),
  expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
  accepted_at: null,
  created_at: new Date(),
}

beforeEach(() => {
  lastInsertValues = null
  lastDeleteWhere = null
  lastSelectWhere = null
  txSelectCallCount = 0
  txInviteRow = null
  txMemberRow = null
  txInsertValues = null
  txUpdateSet = null

  mockDb.insert = (_table: unknown) => makeInsertChain([BASE_INVITE as AnyRow])
  mockDb.select = (_cols?: unknown) => makeSelectChain([])
})

describe('create', () => {
  test('generates 64-char lowercase hex token', async () => {
    await create({ workspaceId: 'ws-001', email: 'new@example.com', role: 'member' })
    expect(typeof lastInsertValues?.token).toBe('string')
    expect((lastInsertValues?.token as string).length).toBe(64)
    expect(/^[0-9a-f]{64}$/.test(lastInsertValues?.token as string)).toBe(true)
  })

  test('sets expiresAt ~48 hours from now', async () => {
    await create({ workspaceId: 'ws-001', email: 'new@example.com', role: 'member' })
    const expires = lastInsertValues?.expires_at as Date
    const diffMs = expires.getTime() - Date.now()
    const diffHours = diffMs / (1000 * 60 * 60)
    expect(diffHours).toBeGreaterThan(47.9)
    expect(diffHours).toBeLessThan(48.1)
  })
})

async function expectThrows(fn: () => Promise<unknown>, msg: string): Promise<void> {
  let threw = false
  try {
    await fn()
  } catch (e) {
    threw = true
    expect((e as Error).message).toBe(msg)
  }
  expect(threw).toBe(true)
}

describe('accept', () => {
  test('throws when invite not found (expired or already accepted)', async () => {
    txInviteRow = null
    await expectThrows(() => accept('bad-token', 'user-1'), 'Invite invalid or expired')
  })

  test('throws on second acceptance of same token (idempotent on member, not on token)', async () => {
    txInviteRow = BASE_INVITE as AnyRow
    txMemberRow = null
    await accept(BASE_INVITE.token, 'user-1')
    txInviteRow = null
    await expectThrows(() => accept(BASE_INVITE.token, 'user-1'), 'Invite invalid or expired')
  })

  test('valid invite creates workspace_members row and sets accepted_at', async () => {
    txInviteRow = BASE_INVITE as AnyRow
    txMemberRow = null
    await accept(BASE_INVITE.token, 'user-1')
    expect(txInsertValues).not.toBeNull()
    expect(txInsertValues?.workspace_id).toBe('ws-001')
    expect(txInsertValues?.user_id).toBe('user-1')
    expect(txInsertValues?.role).toBe('member')
    expect(txUpdateSet?.accepted_at).toBeInstanceOf(Date)
  })

  test('already-member skips insert but still marks invite accepted', async () => {
    txInviteRow = BASE_INVITE as AnyRow
    txMemberRow = { workspace_id: 'ws-001' } as AnyRow
    await accept(BASE_INVITE.token, 'user-1')
    expect(txInsertValues).toBeNull()
    expect(txUpdateSet?.accepted_at).toBeInstanceOf(Date)
  })
})

describe('listPending', () => {
  test('WHERE includes isNull condition (excludes accepted)', async () => {
    await listPending('ws-001')
    const where = lastSelectWhere as { _op: string; conds: { _op: string }[] }
    expect(where._op).toBe('and')
    expect(where.conds.some((c) => c._op === 'isNull')).toBe(true)
  })

  test('WHERE includes gt condition (excludes expired)', async () => {
    await listPending('ws-001')
    const where = lastSelectWhere as { _op: string; conds: { _op: string }[] }
    expect(where.conds.some((c) => c._op === 'gt')).toBe(true)
  })
})

describe('revoke', () => {
  test('WHERE includes both id and workspaceId — cannot revoke other workspace invite', async () => {
    await revoke('inv-001', 'ws-001')
    const where = lastDeleteWhere as { _op: string; conds: { _op: string; val: unknown }[] }
    expect(where._op).toBe('and')
    const vals = where.conds.map((c) => c.val)
    expect(vals).toContain('inv-001')
    expect(vals).toContain('ws-001')
  })
})
