import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { sharedEnv } from '../env.ts'
import { AuthError } from '../errors.ts'

/**
 * AES-256-GCM symmetric encryption for provider API keys.
 * workspaceId is NOT used as salt in v1 — reserved for future per-workspace key rotation.
 *
 * Ciphertext format (base64): [iv(12)] [authTag(16)] [ciphertext(n)]
 */

export function encrypt(plaintext: string): string {
  const key = Buffer.from(sharedEnv.ENCRYPTION_KEY, 'hex')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, 'base64')
  const iv = buf.subarray(0, 12)
  const authTag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const key = Buffer.from(sharedEnv.ENCRYPTION_KEY, 'hex')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  try {
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    throw new AuthError('Decryption failed')
  }
}

export function generateVirtualKeyId(): string {
  return 'tl-vk-' + randomBytes(18).toString('hex')
}

/**
 * One-way digest of a virtual key id for analytics storage.
 * The virtual key id doubles as the bearer credential, so it must never be
 * persisted in ClickHouse or shown in logs — store this hash instead.
 * Deterministic, so per-key grouping in analytics still works.
 */
export function hashVirtualKeyId(id: string): string {
  return 'vkh_' + createHash('sha256').update(id).digest('hex').slice(0, 32)
}
