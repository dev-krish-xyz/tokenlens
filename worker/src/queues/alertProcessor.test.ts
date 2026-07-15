import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { AlertConfig } from '../../../packages/shared/src/db/schema.ts'

type SafeVirtualKey = {
  id: string
  name: string
  workspace_id: string
  budget_cap: string | null
  is_active: boolean
  provider: string
  created_at: Date
}

// Intercept fetch so sendAlert (called via maybeFireAlert) does not make real HTTP calls
let fetchCalls: string[] = []
globalThis.fetch = (async (input: Request | URL | string): Promise<Response> => {
  fetchCalls.push(String(input))
  return new Response(null, { status: 200 })
}) as typeof globalThis.fetch

const mockDragonflyGet = mock(async (_key: string): Promise<string | null> => null)
const mockDragonflySetex = mock(async (_key: string, _ttl: number, _val: string) => 'OK' as const)

// @tokenlens/shared mock: must include all exports used by alertProcessor.ts + alertSender.ts
mock.module('@tokenlens/shared', () => ({
  dragonflyClient: { get: mockDragonflyGet, setex: mockDragonflySetex },
  dragonflyClientForBullMQ: {},
  clickhouseClient: { query: mock(async () => ({ json: async () => [] })) },
  calculateCost: mock(() => 0),
}))

const mockListAlertConfigs = mock(async (_wsId: string): Promise<AlertConfig[]> => [])
const mockFindKeysByWorkspace = mock(async (_wsId: string): Promise<SafeVirtualKey[]> => [])
const mockGetBudgetCap = mock(async (_wsId: string): Promise<number | null> => null)
const mockGetCurrentSpend = mock(
  async (_keyId: string, _wsId: string): Promise<{ keySpend: number; wsSpend: number }> => ({
    keySpend: 0,
    wsSpend: 0,
  }),
)

mock.module('@tokenlens/shared/alertConfigRepo', () => ({
  listByWorkspace: mockListAlertConfigs,
}))

mock.module('@tokenlens/shared/virtualKeyRepo', () => ({
  findByWorkspace: mockFindKeysByWorkspace,
  findById: mock(async () => null),
}))

const mockListAllWorkspaceIds = mock(async (): Promise<string[]> => [])

mock.module('@tokenlens/shared/workspaceRepo', () => ({
  getBudgetCap: mockGetBudgetCap,
  listAllWorkspaceIds: mockListAllWorkspaceIds,
}))

// All exports included to prevent cross-file poisoning; no DNS in tests.
mock.module('@tokenlens/shared/services/ssrfGuard', () => ({
  assertPublicHttpsUrl: mock(async () => {}),
  isForbiddenLiteralHost: () => false,
  isPrivateIp: () => false,
}))

// Both getCurrentSpend and incrementSpend included to prevent cross-file poisoning
mock.module('@tokenlens/shared/services/budgetService', () => ({
  getCurrentSpend: mockGetCurrentSpend,
  incrementSpend: mock(async () => {}),
}))

const { processBudgetAlerts, processAlertJob } = await import('./alertProcessor.ts')

const ACTIVE_CONFIG: AlertConfig = {
  id: 'cfg-001',
  workspace_id: 'ws-001',
  channel: 'admin@example.com',
  threshold_pct: 80,
  cooldown_min: 60,
  is_active: true,
}

beforeEach(() => {
  fetchCalls = []
  mockListAlertConfigs.mockClear()
  mockFindKeysByWorkspace.mockClear()
  mockGetBudgetCap.mockClear()
  mockGetCurrentSpend.mockClear()
  mockDragonflyGet.mockClear()
  mockDragonflySetex.mockClear()

  mockListAllWorkspaceIds.mockClear()
  mockListAllWorkspaceIds.mockImplementation(async () => [])
  mockListAlertConfigs.mockImplementation(async () => [ACTIVE_CONFIG])
  mockFindKeysByWorkspace.mockImplementation(async () => [])
  mockGetBudgetCap.mockImplementation(async () => null)
  mockGetCurrentSpend.mockImplementation(async () => ({ keySpend: 0, wsSpend: 0 }))
  mockDragonflyGet.mockImplementation(async () => null)
})

describe('processBudgetAlerts', () => {
  test('budget pct below threshold does not invoke dedup check', async () => {
    mockGetBudgetCap.mockImplementation(async () => 100)
    mockGetCurrentSpend.mockImplementation(async () => ({ keySpend: 0, wsSpend: 50 }))
    await processBudgetAlerts('ws-001')
    expect(mockDragonflyGet.mock.calls).toHaveLength(0)
  })

  test('budget pct >= threshold invokes dedup check and fires alert', async () => {
    mockGetBudgetCap.mockImplementation(async () => 100)
    mockGetCurrentSpend.mockImplementation(async () => ({ keySpend: 0, wsSpend: 85 }))
    await processBudgetAlerts('ws-001')
    expect(mockDragonflyGet.mock.calls.length).toBeGreaterThan(0)
    expect(fetchCalls.some((u) => u.includes('resend'))).toBe(true)
  })

  test('is_active=false config skips alert entirely', async () => {
    mockListAlertConfigs.mockImplementation(async () => [{ ...ACTIVE_CONFIG, is_active: false }])
    mockGetBudgetCap.mockImplementation(async () => 100)
    mockGetCurrentSpend.mockImplementation(async () => ({ keySpend: 0, wsSpend: 90 }))
    await processBudgetAlerts('ws-001')
    expect(mockDragonflyGet.mock.calls).toHaveLength(0)
  })

  test('no active configs skips getCurrentSpend entirely', async () => {
    mockListAlertConfigs.mockImplementation(async () => [])
    await processBudgetAlerts('ws-001')
    expect(mockGetCurrentSpend.mock.calls).toHaveLength(0)
  })

  test('per-key budget fires alert when key over threshold', async () => {
    const key: SafeVirtualKey = {
      id: 'vk-001',
      name: 'my-key',
      workspace_id: 'ws-001',
      budget_cap: '100',
      is_active: true,
      provider: 'openai',
      created_at: new Date(),
    }
    mockFindKeysByWorkspace.mockImplementation(async () => [key])
    mockGetCurrentSpend.mockImplementation(async () => ({ keySpend: 95, wsSpend: 0 }))
    await processBudgetAlerts('ws-001')
    expect(mockDragonflyGet.mock.calls.length).toBeGreaterThan(0)
    const dedupKey = mockDragonflyGet.mock.calls[0]?.[0] as string
    expect(dedupKey).toContain('vk-001')
  })

  test('per-key budget skips key without budget_cap', async () => {
    const key: SafeVirtualKey = {
      id: 'vk-001',
      name: 'uncapped-key',
      workspace_id: 'ws-001',
      budget_cap: null,
      is_active: true,
      provider: 'openai',
      created_at: new Date(),
    }
    mockFindKeysByWorkspace.mockImplementation(async () => [key])
    await processBudgetAlerts('ws-001')
    expect(mockDragonflyGet.mock.calls).toHaveLength(0)
  })
})

describe('processAlertJob', () => {
  function makeAlertJob(data: unknown) {
    return { id: 'job-test', data } as Parameters<typeof processAlertJob>[0]
  }

  test('budget_sweep runs budget checks for every workspace', async () => {
    mockListAllWorkspaceIds.mockImplementation(async () => ['ws-001', 'ws-002'])
    mockGetBudgetCap.mockImplementation(async () => 100)
    mockGetCurrentSpend.mockImplementation(async () => ({ keySpend: 0, wsSpend: 90 }))
    await processAlertJob(makeAlertJob({ type: 'budget_sweep' }))
    const wsArgs = mockGetBudgetCap.mock.calls.map((c) => c[0])
    expect(wsArgs).toEqual(['ws-001', 'ws-002'])
  })

  test('malformed payload (missing type) throws instead of silently no-oping', async () => {
    await expect(
      processAlertJob(makeAlertJob({ virtualKeyId: 'vk-1', workspaceId: 'ws-1' }))
    ).rejects.toThrow()
    expect(mockGetBudgetCap.mock.calls).toHaveLength(0)
  })

  test('anomaly alert fires once per active config with per-config dedup keys', async () => {
    mockListAlertConfigs.mockImplementation(async () => [
      ACTIVE_CONFIG,
      { ...ACTIVE_CONFIG, id: 'cfg-002', channel: 'second@example.com' },
    ])
    await processAlertJob(
      makeAlertJob({
        type: 'anomaly',
        workspaceId: 'ws-001',
        virtualKeyId: 'vk-001',
        keyName: 'vk-001',
        spend: 12,
        multiplier: '4.0x',
      })
    )
    expect(mockDragonflyGet.mock.calls).toHaveLength(2)
    const dedupKeys = mockDragonflyGet.mock.calls.map((c) => c[0] as string)
    expect(dedupKeys[0]).toContain('cfg-001')
    expect(dedupKeys[1]).toContain('cfg-002')
  })
})
