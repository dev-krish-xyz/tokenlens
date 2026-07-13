import { describe, test, expect } from 'bun:test'
import { transformRequest, transformResponse } from './chatComplete.ts'
import { buildUrl, buildHeaders } from './api.ts'
import { providerRegistry } from '../index.ts'

describe('gemini transformRequest', () => {
  test('converts role assistant → model in contents', () => {
    const body = {
      messages: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
      ],
    }
    const result = transformRequest(body) as { contents: Array<{ role: string }> }
    expect(result.contents[1]?.role).toBe('model')
  })

  test('extracts system message to systemInstruction field', () => {
    const body = {
      messages: [
        { role: 'system', content: 'Be helpful' },
        { role: 'user', content: 'hi' },
      ],
    }
    const result = transformRequest(body) as Record<string, unknown>
    expect(result['systemInstruction']).toBe('Be helpful')
  })

  test('filters system message from contents array', () => {
    const body = {
      messages: [
        { role: 'system', content: 'Be helpful' },
        { role: 'user', content: 'hi' },
      ],
    }
    const result = transformRequest(body) as { contents: unknown[] }
    expect(result.contents).toHaveLength(1)
  })
})

describe('gemini transformResponse', () => {
  test('maps usageMetadata to OpenAI usage shape', () => {
    const body = {
      candidates: [
        {
          content: { parts: [{ text: 'hi' }] },
          finishReason: 'STOP',
        },
      ],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
    }
    const result = transformResponse(body)
    expect(result.usage.prompt_tokens).toBe(10)
    expect(result.usage.completion_tokens).toBe(5)
    expect(result.usage.total_tokens).toBe(15)
  })
})

describe('gemini api', () => {
  test('buildUrl never embeds the API key', () => {
    const url = buildUrl('gemini-2.0-flash', 'AIza-secret-key')
    expect(url).not.toContain('AIza-secret-key')
    expect(url).not.toContain('key=')
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    )
  })

  test('buildHeaders carries the key via x-goog-api-key', () => {
    const headers = buildHeaders('AIza-secret-key')
    expect(headers['x-goog-api-key']).toBe('AIza-secret-key')
  })

  test('buildUrl URL-encodes user-supplied model (no path/query injection)', () => {
    const url = buildUrl('evil:generateContent?key=attacker&x=', 'AIza-secret-key')
    expect(url).not.toContain('?')
    expect(url).not.toContain('&')
    expect(url).toContain(encodeURIComponent('evil:generateContent?key=attacker&x='))
  })
})

describe('providerRegistry', () => {
  test('has all 3 keys: openai, anthropic, gemini', () => {
    expect(Object.keys(providerRegistry)).toEqual(['openai', 'anthropic', 'gemini'])
  })
})
