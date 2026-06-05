export const chatEndpoint = '/v1beta/models'

export function buildHeaders(_apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  }
}

export function buildUrl(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
}
