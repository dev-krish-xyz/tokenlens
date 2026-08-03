import { describe, expect, test } from 'bun:test'
import { highlightCode } from './highlightCode.ts'

describe('highlightCode', () => {
  test('tokenizes keywords and strings', () => {
    const lines = highlightCode('import OpenAI from "openai"')
    expect(lines).toHaveLength(1)
    const types = lines[0]!.tokens.map((t) => t.t)
    expect(types).toContain('kw')
    expect(types).toContain('str')
  })

  test('preserves empty lines', () => {
    const lines = highlightCode('const x = 1\n\nconst y = 2')
    expect(lines).toHaveLength(3)
    expect(lines[1]!.tokens).toEqual([])
  })

  test('comments take the full line', () => {
    const lines = highlightCode('  // hello')
    expect(lines[0]!.tokens).toEqual([{ t: 'comment', v: '  // hello' }])
  })

  test('plain source is recoverable by joining token values', () => {
    const src = `const client = new OpenAI({
  baseURL: "https://gateway.tokenlens.ai/v1",
})`
    const lines = highlightCode(src)
    const rebuilt = lines.map((l) => l.tokens.map((t) => t.v).join('')).join('\n')
    expect(rebuilt).toBe(src)
  })
})
