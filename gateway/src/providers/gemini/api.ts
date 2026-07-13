export const chatEndpoint = '/v1beta/models'

export function buildHeaders(apiKey: string): Record<string, string> {
  return {
    'x-goog-api-key': apiKey,
    'Content-Type': 'application/json',
  }
}

// The key travels in the x-goog-api-key header, never the URL — query strings
// leak into fetch error messages, egress logs, and intermediary proxies.
// model is user-supplied, so it is URL-encoded to keep it a single path segment.
export function buildUrl(model: string, _apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
}
