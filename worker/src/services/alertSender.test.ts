import { describe, test, expect, mock, beforeEach } from 'bun:test'

process.env['RESEND_API_KEY'] = 'test-resend-key'

type FetchCall = { input: Request | URL | string; init: RequestInit | undefined }
let fetchCalls: FetchCall[] = []
let fetchShouldThrow = false
let fetchStatus = 200

globalThis.fetch = (async (input: Request | URL | string, init?: RequestInit): Promise<Response> => {
  fetchCalls.push({ input, init })
  if (fetchShouldThrow) throw new Error('Network error')
  return new Response(null, { status: fetchStatus })
}) as typeof globalThis.fetch

const mockDragonflyGet = mock(async (_key: string): Promise<string | null> => null)
const mockDragonflySetex = mock(async (_key: string, _ttl: number, _val: string) => 'OK' as const)

mock.module('@tokenlens/shared', () => ({
  dragonflyClient: { get: mockDragonflyGet, setex: mockDragonflySetex },
  dragonflyClientForBullMQ: {},
  clickhouseClient: { query: mock(async () => ({ json: async () => [] })) },
  calculateCost: mock(() => 0),
}))

const { sendAlert, maybeFireAlert } = await import('./alertSender.ts')

const BASE_PAYLOAD = {
  type: 'budget' as const,
  keyName: 'test-key',
  workspaceId: 'ws-001',
  message: 'Workspace spend at 85.0% of cap',
  spend: 85,
  cap: 100,
  percentage: 85,
}

beforeEach(() => {
  fetchCalls = []
  fetchShouldThrow = false
  fetchStatus = 200
  mockDragonflyGet.mockClear()
  mockDragonflySetex.mockClear()
  mockDragonflyGet.mockImplementation(async () => null)
})

describe('sendAlert', () => {
  test('email channel detected from email address format', async () => {
    await sendAlert('user@example.com', BASE_PAYLOAD)
    expect(fetchCalls).toHaveLength(1)
    expect(String(fetchCalls[0]?.input)).toBe('https://api.resend.com/emails')
  })

  test('webhook channel detected from https:// prefix', async () => {
    await sendAlert('https://hooks.example.com/alert', BASE_PAYLOAD)
    expect(fetchCalls).toHaveLength(1)
    expect(String(fetchCalls[0]?.input)).toBe('https://hooks.example.com/alert')
  })

  test('unknown channel skips fetch entirely', async () => {
    await sendAlert('slack://channel-id', BASE_PAYLOAD)
    expect(fetchCalls).toHaveLength(0)
  })

  test('Resend API called with correct headers and body', async () => {
    await sendAlert('user@example.com', BASE_PAYLOAD)
    const call = fetchCalls[0]
    const headers = call?.init?.headers as Record<string, string>
    expect(headers?.['Authorization']).toBe('Bearer test-resend-key')
    expect(headers?.['Content-Type']).toBe('application/json')
    const body = JSON.parse(call?.init?.body as string) as Record<string, unknown>
    expect(body['from']).toBe('alerts@tokenlens.dev')
    expect(body['to']).toEqual(['user@example.com'])
    expect(String(body['subject'])).toContain('Budget Alert')
    expect(String(body['subject'])).toContain('test-key')
  })

  test('webhook called with X-TokenLens-Event header', async () => {
    await sendAlert('https://hooks.example.com/alert', BASE_PAYLOAD)
    const headers = fetchCalls[0]?.init?.headers as Record<string, string>
    expect(headers?.['X-TokenLens-Event']).toBe('budget.alert')
  })

  test('sendAlert fetch failure does not throw', async () => {
    fetchShouldThrow = true
    let threw = false
    try {
      await sendAlert('user@example.com', BASE_PAYLOAD)
    } catch {
      threw = true
    }
    expect(threw).toBe(false)
  })
})

describe('maybeFireAlert', () => {
  test('dedup key present skips sendAlert', async () => {
    mockDragonflyGet.mockImplementation(async () => '1')
    await maybeFireAlert({
      dedupKey: 'alert:sent:key-1:2026061114',
      cooldownMin: 60,
      channel: 'user@example.com',
      payload: BASE_PAYLOAD,
    })
    expect(fetchCalls).toHaveLength(0)
    expect(mockDragonflySetex.mock.calls).toHaveLength(0)
  })

  test('dedup key absent calls sendAlert and sets dedup key', async () => {
    mockDragonflyGet.mockImplementation(async () => null)
    await maybeFireAlert({
      dedupKey: 'alert:sent:key-1:2026061114',
      cooldownMin: 30,
      channel: 'user@example.com',
      payload: BASE_PAYLOAD,
    })
    expect(fetchCalls).toHaveLength(1)
    expect(mockDragonflySetex.mock.calls).toHaveLength(1)
    const [key, ttl, val] = mockDragonflySetex.mock.calls[0] as [string, number, string]
    expect(key).toBe('alert:sent:key-1:2026061114')
    expect(ttl).toBe(1800) // 30 * 60
    expect(val).toBe('1')
  })
})
