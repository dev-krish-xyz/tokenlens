import { describe, test, expect, mock, beforeEach } from 'bun:test'
import type { Job } from 'bullmq'
import type { AnomalyJobData } from '../../../packages/shared/src/queues/types.ts'

let mockCurrentSpend = 0
let mockBaseline = 0

const mockClickhouseQuery = mock(async (opts: { query: string }) => {
  if (opts.query.includes('INTERVAL 1 HOUR') && !opts.query.includes('avg')) {
    return { json: async () => [{ hourly_spend: String(mockCurrentSpend) }] }
  }
  return { json: async () => [{ baseline: String(mockBaseline) }] }
})

const mockAlertQueueAdd = mock(async () => ({ id: 'job-1' }))

mock.module('@tokenlens/shared', () => ({
  clickhouseClient: { query: mockClickhouseQuery },
  dragonflyClientForBullMQ: {},
  dragonflyClient: { get: mock(async () => null), setex: mock(async () => 'OK') },
  calculateCost: mock(() => 0),
}))

mock.module('@tokenlens/shared/queues/definitions', () => ({
  alertQueue: { add: mockAlertQueueAdd },
  anomalyQueue: { add: mock(async () => {}) },
}))

mock.module('@tokenlens/shared/virtualKeyRepo', () => ({
  findByWorkspace: mock(async () => []),
  findById: mock(async () => null),
}))

mock.module('@tokenlens/shared/workspaceRepo', () => ({
  getBudgetCap: mock(async (): Promise<number | null> => null),
  listAllWorkspaceIds: mock(async (): Promise<string[]> => []),
}))

const { processAnomalyCheck } = await import('./anomalyProcessor.ts')

function makeJob(data: AnomalyJobData): Job<AnomalyJobData> {
  return { id: 'job-test', data } as unknown as Job<AnomalyJobData>
}

beforeEach(() => {
  mockCurrentSpend = 0
  mockBaseline = 0
  mockClickhouseQuery.mockClear()
  mockAlertQueueAdd.mockClear()
})

describe('processAnomalyCheck', () => {
  test('baseline below 0.0001 skips alert', async () => {
    mockCurrentSpend = 10
    mockBaseline = 0.00005
    await processAnomalyCheck(makeJob({ virtualKeyId: 'vk-1', workspaceId: 'ws-1' }))
    expect(mockAlertQueueAdd.mock.calls).toHaveLength(0)
  })

  test('currentSpend at exactly 3x baseline does not trigger alert', async () => {
    mockBaseline = 1.0
    mockCurrentSpend = 3.0
    await processAnomalyCheck(makeJob({ virtualKeyId: 'vk-1', workspaceId: 'ws-1' }))
    expect(mockAlertQueueAdd.mock.calls).toHaveLength(0)
  })

  test('currentSpend above 3x baseline enqueues anomaly alert', async () => {
    mockBaseline = 1.0
    mockCurrentSpend = 3.5
    await processAnomalyCheck(makeJob({ virtualKeyId: 'vk-1', workspaceId: 'ws-1' }))
    expect(mockAlertQueueAdd.mock.calls).toHaveLength(1)
    const callArgs = mockAlertQueueAdd.mock.calls[0] as unknown as [string, { type: string }]
    expect(callArgs[1].type).toBe('anomaly')
  })

  test('multiplier calculated correctly: spend=3, baseline=0.9 → 3.3x', async () => {
    mockBaseline = 0.9
    mockCurrentSpend = 3.0
    await processAnomalyCheck(makeJob({ virtualKeyId: 'vk-1', workspaceId: 'ws-1' }))
    expect(mockAlertQueueAdd.mock.calls).toHaveLength(1)
    const callArgs = mockAlertQueueAdd.mock.calls[0] as unknown as [string, { multiplier: string }]
    expect(callArgs[1].multiplier).toBe('3.3x')
  })
})
