import type { Provider } from './types.ts'
import { openaiProvider } from './openai/index.ts'
import { anthropicProvider } from './anthropic/index.ts'
import { geminiProvider } from './gemini/index.ts'

export const providerRegistry: Record<string, Provider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
}

export type { Provider }
