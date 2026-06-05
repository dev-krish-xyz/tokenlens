import { describe, test, expect } from 'bun:test'
import { transformRequest, transformResponse } from './chatComplete.ts'
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

describe('providerRegistry', () => {
  test('has all 3 keys: openai, anthropic, gemini', () => {
    expect(Object.keys(providerRegistry)).toEqual(['openai', 'anthropic', 'gemini'])
  })
})
