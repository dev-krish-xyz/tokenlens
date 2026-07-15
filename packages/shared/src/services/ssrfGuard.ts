import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { ValidationError } from '../errors.ts'

// Guards outbound requests to user-supplied URLs (alert webhooks). Without
// this, a workspace admin could point their webhook at cloud metadata
// endpoints or internal services and use the worker as an SSRF proxy.

function isPrivateV4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  const [a, b] = parts
  if (parts.length !== 4 || a === undefined || b === undefined) return true
  if (a === 0 || a === 10 || a === 127) return true // this-net, private, loopback
  if (a === 169 && b === 254) return true // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true // private
  if (a === 192 && b === 168) return true // private
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  if (a >= 224) return true // multicast, reserved, broadcast
  return false
}

function isPrivateV6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::' || lower === '::1') return true // unspecified, loopback
  if (lower.startsWith('fe80:')) return true // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // ULA
  if (lower.startsWith('::ffff:')) return isPrivateV4(lower.slice(7)) // v4-mapped
  return false
}

/** True when the address is private/reserved, or not a valid IP at all. */
export function isPrivateIp(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return isPrivateV4(ip)
  if (version === 6) return isPrivateV6(ip)
  return true
}

/** Cheap synchronous check for literal hosts — usable at config time without DNS. */
export function isForbiddenLiteralHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (host.endsWith('.local') || host.endsWith('.internal')) return true
  return isIP(host) !== 0 && isPrivateIp(host)
}

/**
 * Throws ValidationError unless the URL is https and its host resolves only to
 * public addresses. DNS is checked at call time; combine with
 * `redirect: 'error'` on the fetch so a public host can't 302 to a private one.
 */
export async function assertPublicHttpsUrl(raw: string): Promise<void> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new ValidationError('Invalid URL')
  }
  if (url.protocol !== 'https:') {
    throw new ValidationError('Only https:// URLs are allowed')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (isForbiddenLiteralHost(host)) {
    throw new ValidationError('URL host is not allowed')
  }
  if (isIP(host) === 0) {
    let addresses
    try {
      addresses = await lookup(host, { all: true, verbatim: true })
    } catch {
      throw new ValidationError('URL host did not resolve')
    }
    if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
      throw new ValidationError('URL resolves to a non-public address')
    }
  }
}
