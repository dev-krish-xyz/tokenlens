import type { Provider } from '../types.ts'
import { chatEndpoint, buildHeaders } from './api.ts'
import { transformRequest, transformResponse } from './chatComplete.ts'

export const openaiProvider: Provider = {
  name: 'openai',
  chatEndpoint,
  buildHeaders,
  transformRequest,
  transformResponse,
}
