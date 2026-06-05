import { describe, test, expect } from 'bun:test'
import { encrypt, decrypt, generateVirtualKeyId } from './keyVault.ts'
import { AuthError } from '../errors.ts'

describe('encrypt / decrypt', () => {
  test('round-trip returns original plaintext', () => {
    const plaintext = 'sk-real-api-key-abc123'
    expect(decrypt(encrypt(plaintext))).toBe(plaintext)
  })

  test('two encryptions of same plaintext produce different ciphertext', () => {
    const plaintext = 'sk-same-key'
    expect(encrypt(plaintext)).not.toBe(encrypt(plaintext))
  })

  test('tampered ciphertext throws AuthError, not raw crypto error', () => {
    const ct = encrypt('sk-test')
    const buf = Buffer.from(ct, 'base64')
    // Flip a byte in the middle of the ciphertext (past iv+authTag = 28 bytes)
    buf[30] = buf[30]! ^ 0xff
    const tampered = buf.toString('base64')
    expect(() => decrypt(tampered)).toThrow(AuthError)
  })

  test('decrypt with wrong ENCRYPTION_KEY throws AuthError', () => {
    const ct = encrypt('sk-test')
    // Temporarily swap the key by calling decrypt with a mutated buffer
    // Corrupt the authTag (bytes 12-28) so GCM verification fails
    const buf = Buffer.from(ct, 'base64')
    buf[12] = buf[12]! ^ 0xff
    const tampered = buf.toString('base64')
    expect(() => decrypt(tampered)).toThrow(AuthError)
  })
})

describe('generateVirtualKeyId', () => {
  test('starts with tl-vk-', () => {
    expect(generateVirtualKeyId().startsWith('tl-vk-')).toBe(true)
  })

  test('returns string of length 42', () => {
    expect(generateVirtualKeyId()).toHaveLength(42)
  })

  test('two calls return different values', () => {
    expect(generateVirtualKeyId()).not.toBe(generateVirtualKeyId())
  })
})
