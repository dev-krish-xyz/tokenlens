import { describe, test, expect } from 'bun:test'
import { isPrivateIp, isForbiddenLiteralHost, assertPublicHttpsUrl } from './ssrfGuard.ts'

describe('isPrivateIp', () => {
  test.each([
    '127.0.0.1',
    '10.0.0.5',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
  ])('%s is private', (ip) => {
    expect(isPrivateIp(ip)).toBe(true)
  })

  test.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '2606:4700::1111'])(
    '%s is public',
    (ip) => {
      expect(isPrivateIp(ip)).toBe(false)
    }
  )

  test('non-IP input treated as private (fail closed)', () => {
    expect(isPrivateIp('not-an-ip')).toBe(true)
  })
})

describe('isForbiddenLiteralHost', () => {
  test.each(['localhost', 'foo.localhost', 'db.local', 'metadata.internal', '127.0.0.1', '[::1]'])(
    '%s forbidden',
    (host) => {
      expect(isForbiddenLiteralHost(host)).toBe(true)
    }
  )

  test.each(['hooks.slack.com', 'example.com', '8.8.8.8'])('%s allowed', (host) => {
    expect(isForbiddenLiteralHost(host)).toBe(false)
  })
})

describe('assertPublicHttpsUrl (no-DNS paths)', () => {
  test('rejects non-https scheme', async () => {
    await expect(assertPublicHttpsUrl('http://example.com/x')).rejects.toThrow('https')
  })

  test('rejects invalid URL', async () => {
    await expect(assertPublicHttpsUrl('not a url')).rejects.toThrow('Invalid URL')
  })

  test('rejects literal private IPv4 without DNS', async () => {
    await expect(assertPublicHttpsUrl('https://169.254.169.254/latest/meta-data/')).rejects.toThrow(
      'not allowed'
    )
  })

  test('rejects localhost without DNS', async () => {
    await expect(assertPublicHttpsUrl('https://localhost:8787/x')).rejects.toThrow('not allowed')
  })

  test('accepts literal public IP without DNS', async () => {
    await expect(assertPublicHttpsUrl('https://8.8.8.8/hook')).resolves.toBeUndefined()
  })
})
