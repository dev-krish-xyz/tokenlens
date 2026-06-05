import type { Provider } from '../types.ts'
import { chatEndpoint, buildHeaders, buildUrl } from './api.ts'
import { transformRequest, transformResponse } from './chatComplete.ts'

export const geminiProvider: Provider = {
  name: 'gemini',
  chatEndpoint,
  buildHeaders,
  transformRequest,
  transformResponse,
  buildUrl,
}
