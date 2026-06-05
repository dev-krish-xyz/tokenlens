import type { Provider } from '../types.ts'
import { chatEndpoint, buildHeaders } from './api.ts'
import { transformRequest, transformResponse } from './chatComplete.ts'

export const anthropicProvider: Provider = {
  name: 'anthropic',
  chatEndpoint,
  buildHeaders,
  transformRequest,
  transformResponse,
}
