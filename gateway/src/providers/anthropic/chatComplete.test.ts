import { describe, test, expect } from 'bun:test'
import { transformRequest, transformResponse } from './chatComplete.ts'
import { buildHeaders } from './api.ts'

describe('anthropic transformRequest', () => {
  test('extracts system message to top-level system field', () => {
    const body = {
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'hi' },
      ],
      model: 'claude-3-5-sonnet',
    }
    const result = transformRequest(body) as Record<string, unknown>
    expect(result['system']).toBe('You are helpful')
  })

  test('removes system message from messages array', () => {
    const body = {
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'hi' },
      ],
      model: 'claude-3-5-sonnet',
    }
    const result = transformRequest(body) as { messages: unknown[] }
    expect(result.messages).toHaveLength(1)
  })

  test('adds max_tokens: 1024 when not set', () => {
    const body = { messages: [{ role: 'user', content: 'hi' }] }
    const result = transformRequest(body) as Record<string, unknown>
    expect(result['max_tokens']).toBe(1024)
  })

  test('preserves max_tokens when already set', () => {
    const body = { messages: [{ role: 'user', content: 'hi' }], max_tokens: 2048 }
    const result = transformRequest(body) as Record<string, unknown>
    expect(result['max_tokens']).toBe(2048)
  })
})

describe('anthropic transformResponse', () => {
  test('maps usage.input_tokens → prompt_tokens correctly', () => {
    const body = {
      content: [{ type: 'text', text: 'Hello' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 5 },
    }
    const result = transformResponse(body)
    expect(result.usage.prompt_tokens).toBe(10)
    expect(result.usage.completion_tokens).toBe(5)
    expect(result.usage.total_tokens).toBe(15)
  })
})

describe('anthropic buildHeaders', () => {
  test('returns x-api-key not Authorization', () => {
    const headers = buildHeaders('test-key')
    expect(headers['x-api-key']).toBe('test-key')
    expect(headers['Authorization']).toBeUndefined()
  })
})
