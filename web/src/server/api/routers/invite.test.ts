import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { TRPCError } from '@trpc/server'

// Must mock server-only modules before any import that transitively loads them
mock.module('next/headers', () => ({ headers: mock(() => new Map()) }))
mock.module('next/navigation', () => ({
  redirect: mock((url: string) => { throw new Error(`redirect:${url}`) }),
}))

mock.module('@tokenlens/shared', () => ({
  hasMinimumRole: (role: string, required: string) => {
    const h: Record<string, number> = { admin: 3, member: 2, viewer: 1 }
    return (h[role] ?? 0) >= (h[required] ?? 0)
  },
}))

const mockFindByUserId = mock(async () => null)
const mockFindById = mock(async (_id: string) => ({
  id: 'ws-001',
  name: 'Test Workspace',
  plan: 'free',
  budget_cap: null,
  slack_webhook_url: null,
  stripe_customer_id: null,
  created_at: new Date(),
}))

mock.module('@tokenlens/shared/workspaceRepo', () => ({
  findByUserId: mockFindByUserId,
  findById: mockFindById,
  getBudgetCap: mock(async () => null),
  invalidateBudgetCapCache: mock(async () => {}),
  listAllWorkspaceIds: mock(async () => []),
  update: mock(async () => {}),
  findByStripeSubId: mock(async () => null),
}))

const mockGetRoleForUser = mock(async (): Promise<'admin' | 'member' | 'viewer' | null> => null)
const mockIsMemberByEmail = mock(async (): Promise<boolean> => false)

mock.module('@tokenlens/shared/workspaceMemberRepo', () => ({
  getRoleForUser: mockGetRoleForUser,
  isMemberByEmail: mockIsMemberByEmail,
  listMembers: mock(async () => []),
  updateRole: mock(async () => {}),
  removeMember: mock(async () => {}),
}))

const mockInviteCreate = mock(async () => ({
  id: 'inv-001',
  workspace_id: 'ws-001',
  email: 'other@example.com',
  role: 'member' as const,
  token: 'tok123',
  expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
  accepted_at: null,
  created_at: new Date(),
}))
const mockInviteListPending = mock(async (): Promise<{
  id: string; workspace_id: string; email: string; role: string
  token: string; expires_at: Date; accepted_at: Date | null; created_at: Date | null
}[]> => [])
const mockInviteRevoke = mock(async () => {})
const mockInviteFindByToken = mock(async () => null)
const mockInviteAccept = mock(async () => {})

mock.module('@tokenlens/shared/inviteRepo', () => ({
  create: mockInviteCreate,
  findByToken: mockInviteFindByToken,
  accept: mockInviteAccept,
  listPending: mockInviteListPending,
  revoke: mockInviteRevoke,
}))

const mockSendInviteEmail = mock(async () => {})
mock.module('../../../lib/inviteEmail.ts', () => ({
  sendInviteEmail: mockSendInviteEmail,
}))

// Defensive mocks for modules used by route.ts (same worker, i < r)
mock.module('@tokenlens/shared/services/planService', () => ({
  getPlanTier: mock(async () => 'free'),
  invalidatePlanCache: mock(async () => {}),
  isProOrAbove: mock(() => false),
}))

mock.module('@tokenlens/shared/services/usageService', () => ({
  getMonthlyRequestCount: mock(async () => 0),
}))

mock.module('stripe', () => {
  const StripeClass = class {
    webhooks = { constructEvent: mock(() => { throw new Error('not configured') }) }
    customers = { create: mock(async () => ({ id: 'cus_new' })) }
    checkout = { sessions: { create: mock(async () => ({ url: null })) } }
  }
  return { default: StripeClass }
})

// Session mock (trpc.ts imports this at module level)
mock.module('../../../lib/session.ts', () => ({
  getSession: mock(async () => null),
  requireSession: mock(async () => null),
  requireWorkspace: mock(async () => null),
}))

// env mock (invite.ts imports env.ts transitively)
// Must include ALL vars any web test file needs — invite.ts (i) wins mock registration over route.ts (r)
mock.module('../../../env.ts', () => ({
  env: {
    BETTER_AUTH_URL: 'http://localhost:3000',
    RESEND_API_KEY: 'test-key',
    NEXT_PUBLIC_GATEWAY_URL: 'http://localhost:8787',
    STRIPE_SECRET_KEY: 'sk_test_fake',
    STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    STRIPE_PRICE_ID_PRO: 'price_fake',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

const { inviteRouter } = await import('./invite.ts')
const { router, createCallerFactory } = await import('../trpc.ts')

const testRouter = router({ invite: inviteRouter })
const createCaller = createCallerFactory(testRouter)

const makeAdminSession = (email = 'admin@example.com') => ({
  user: {
    id: 'u-admin',
    email,
    name: 'Admin',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null as string | null | undefined,
  },
  session: {
    id: 's-1',
    userId: 'u-admin',
    token: 't',
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
})

function makeCaller(email = 'admin@example.com') {
  return createCaller({
    session: makeAdminSession(email),
    workspaceId: 'ws-001',
    userRole: 'admin',
  })
}

beforeEach(() => {
  mockInviteCreate.mockClear()
  mockInviteListPending.mockClear()
  mockInviteRevoke.mockClear()
  mockSendInviteEmail.mockClear()
  mockIsMemberByEmail.mockClear()
  mockGetRoleForUser.mockImplementation(async () => 'admin' as 'admin' | 'member' | 'viewer' | null)
  mockInviteListPending.mockImplementation(async () => [])
  mockIsMemberByEmail.mockImplementation(async () => false as boolean)
  mockSendInviteEmail.mockImplementation(async () => {})
})

describe('invite.sendInvite', () => {
  test('own email throws BAD_REQUEST', async () => {
    const caller = makeCaller('admin@example.com')
    await expect(
      caller.invite.sendInvite({ email: 'admin@example.com', role: 'member' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    expect(mockInviteCreate.mock.calls).toHaveLength(0)
  })

  test('duplicate pending invite throws CONFLICT', async () => {
    mockInviteListPending.mockImplementation(async () => [
      {
        id: 'inv-existing',
        workspace_id: 'ws-001',
        email: 'other@example.com',
        role: 'member',
        token: 'existing-tok',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
        accepted_at: null,
        created_at: new Date(),
      },
    ])
    const caller = makeCaller()
    await expect(
      caller.invite.sendInvite({ email: 'other@example.com', role: 'member' }),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(mockInviteCreate.mock.calls).toHaveLength(0)
  })

  test('sendInviteEmail failure revokes invite and throws INTERNAL_SERVER_ERROR', async () => {
    mockSendInviteEmail.mockImplementation(async () => {
      throw new Error('Resend unavailable')
    })
    const caller = makeCaller()
    await expect(
      caller.invite.sendInvite({ email: 'other@example.com', role: 'member' }),
    ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' })
    expect(mockInviteCreate.mock.calls).toHaveLength(1)
    expect(mockInviteRevoke.mock.calls).toHaveLength(1)
    const [revokedId, revokedWsId] = mockInviteRevoke.mock.calls[0] as unknown as [string, string]
    expect(revokedId).toBe('inv-001')
    expect(revokedWsId).toBe('ws-001')
  })

  test('success calls inviteRepo.create and sendInviteEmail', async () => {
    const caller = makeCaller()
    const result = await caller.invite.sendInvite({ email: 'other@example.com', role: 'member' })
    expect(result).toMatchObject({ success: true, email: 'other@example.com' })
    expect(mockInviteCreate.mock.calls).toHaveLength(1)
    expect(mockSendInviteEmail.mock.calls).toHaveLength(1)
    const emailOpts = (mockSendInviteEmail.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(emailOpts?.toEmail).toBe('other@example.com')
    expect(String(emailOpts?.inviteUrl)).toContain('tok123')
  })
})
