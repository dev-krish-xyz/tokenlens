import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { Job } from 'bullmq'
import { calculateCost } from '../../../packages/shared/src/services/costCalculator.ts'
import type { IngestionJobData } from '../../../packages/shared/src/queues/types.ts'
import type { RequestLogRow } from '../../../packages/shared/src/clickhouse/client.ts'
import type { ModelPricing } from '../../../packages/shared/src/db/schema.ts'

const mockFindByPattern = mock(async (_provider: string, _model: string): Promise<ModelPricing | null> => null)
const mockAdd = mock((_row: RequestLogRow) => {})
const mockAdjustSpend = mock(async (_keyId: string, _wsId: string, _delta: number) => {})

mock.module('@tokenlens/shared', () => ({
  calculateCost,
  dragonflyClientForBullMQ: { host: 'localhost', port: 6379 },
  dragonflyClient: { get: mock(async () => null), setex: mock(async () => 'OK') },
  clickhouseClient: { query: mock(async () => ({ json: async () => [] })) },
}))

mock.module('@tokenlens/shared/pricingRepo', () => ({
  findByPattern: mockFindByPattern,
}))

mock.module('@tokenlens/shared/clickhouse/writer', () => ({
  clickhouseWriter: { add: mockAdd, flush: mock(async () => {}) },
}))

mock.module('@tokenlens/shared/services/budgetService', () => ({
  adjustSpend: mockAdjustSpend,
  getCurrentSpend: mock(async () => ({ keySpend: 0, wsSpend: 0 })),
}))

// Deterministic stub — real impl loads shared env transitively
mock.module('@tokenlens/shared/keyVault', () => ({
  hashVirtualKeyId: (id: string) => `vkh_${id}`,
}))

const { processIngestionJob } = await import('./ingestionProcessor.ts')

const BASE_PRICING: ModelPricing = {
  id: 'price-1',
  provider: 'openai',
  model_pattern: 'gpt-4o-mini',
  input_price_per_m: '0.150000',
  output_price_per_m: '0.600000',
  updated_at: new Date(),
}

const BASE_JOB_DATA: IngestionJobData = {
  requestId: 'req-abc',
  virtualKeyId: 'tl-vk-111',
  workspaceId: 'ws-999',
  provider: 'openai',
  model: 'gpt-4o-mini',
  envTag: 'test',
  featureTag: 'chat',
  userIdTag: 'user-xyz',
  tokensIn: 1000,
  tokensOut: 500,
  latencyMs: 220,
  statusCode: 200,
  createdAt: new Date().toISOString(),
}

function makeJob(overrides: Partial<IngestionJobData> = {}): Job<IngestionJobData> {
  return {
    id: 'job-test-1',
    data: { ...BASE_JOB_DATA, ...overrides },
  } as unknown as Job<IngestionJobData>
}

beforeEach(() => {
  mockFindByPattern.mockClear()
  mockAdd.mockClear()
  mockAdjustSpend.mockClear()
  mockFindByPattern.mockImplementation(async () => BASE_PRICING)
})

describe('processIngestionJob', () => {
  test('clickhouseWriter.add called with correct RequestLogRow fields', async () => {
    await processIngestionJob(makeJob())

    expect(mockAdd.mock.calls).toHaveLength(1)
    const row = mockAdd.mock.calls[0]?.[0] as RequestLogRow
    expect(row.workspace_id).toBe('ws-999')
    expect(row.virtual_key_id).toBe('vkh_tl-vk-111')
    expect(row.provider).toBe('openai')
    expect(row.model).toBe('gpt-4o-mini')
    expect(row.user_id_tag).toBe('user-xyz')
    expect(row.tokens_in).toBe(1000)
    expect(row.tokens_out).toBe(500)
  })

  test('cost_usd in row matches calculateCost return value', async () => {
    await processIngestionJob(makeJob({ tokensIn: 1000, tokensOut: 500 }))

    const row = mockAdd.mock.calls[0]?.[0] as RequestLogRow
    // (1000/1_000_000 * 0.15) + (500/1_000_000 * 0.60) = 0.00045
    expect(row.cost_usd).toBeCloseTo(0.00045, 8)
  })

  test('user_id_tag in row matches job.data.userIdTag', async () => {
    await processIngestionJob(makeJob({ userIdTag: 'custom-user-888' }))

    const row = mockAdd.mock.calls[0]?.[0] as RequestLogRow
    expect(row.user_id_tag).toBe('custom-user-888')
  })

  test('no realApiKey field anywhere in RequestLogRow', async () => {
    await processIngestionJob(makeJob())

    const row = mockAdd.mock.calls[0]?.[0] as Record<string, unknown>
    expect('realApiKey' in row).toBe(false)
    const values = Object.values(row).map(String).join(' ')
    expect(values).not.toContain('sk-real')
  })

  test('spend adjusted by actual minus reserved estimate', async () => {
    // actual cost = (1000/1M * 0.15) + (500/1M * 0.60) = 0.00045
    await processIngestionJob(makeJob({ reservedCostUsd: 0.0005 }))

    expect(mockAdjustSpend.mock.calls).toHaveLength(1)
    const [keyId, wsId, delta] = mockAdjustSpend.mock.calls[0] ?? []
    expect(keyId).toBe('tl-vk-111')
    expect(wsId).toBe('ws-999')
    expect(delta).toBeCloseTo(0.00045 - 0.0005, 8)
  })

  test('no reservation → full actual cost applied', async () => {
    await processIngestionJob(makeJob())

    const delta = mockAdjustSpend.mock.calls[0]?.[2]
    expect(delta).toBeCloseTo(0.00045, 8)
  })

  test('spend counters keyed by RAW virtual key id, not the hash', async () => {
    await processIngestionJob(makeJob())
    expect(mockAdjustSpend.mock.calls[0]?.[0]).toBe('tl-vk-111')
  })
})
