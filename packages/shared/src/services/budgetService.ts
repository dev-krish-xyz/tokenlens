import { dragonflyClient } from '../dragonfly/client.ts'

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7).replace('-', '')
}

export async function incrementSpend(
  virtualKeyId: string,
  workspaceId: string,
  costUsd: number
): Promise<void> {
  if (costUsd <= 0) return

  const month = getCurrentMonth()
  const keyCounter = `spend:key:${month}:${virtualKeyId}`
  const wsCounter = `spend:ws:${month}:${workspaceId}`
  const ttl = 35 * 24 * 60 * 60

  const pipeline = dragonflyClient.pipeline()
  pipeline.incrbyfloat(keyCounter, costUsd)
  pipeline.incrbyfloat(wsCounter, costUsd)
  pipeline.expire(keyCounter, ttl)
  pipeline.expire(wsCounter, ttl)
  await pipeline.exec()
}

export async function getCurrentSpend(
  virtualKeyId: string,
  workspaceId: string
): Promise<{ keySpend: number; wsSpend: number }> {
  const month = getCurrentMonth()
  const [keyVal, wsVal] = await dragonflyClient.mget(
    `spend:key:${month}:${virtualKeyId}`,
    `spend:ws:${month}:${workspaceId}`
  )
  return {
    keySpend: keyVal ? parseFloat(keyVal) : 0,
    wsSpend: wsVal ? parseFloat(wsVal) : 0,
  }
}

export async function getRemainingBudget(
  virtualKeyId: string,
  workspaceId: string,
  keyCap: number | null,
  wsCap: number | null
): Promise<{ keyRemaining: number | null; wsRemaining: number | null }> {
  if (keyCap === null && wsCap === null) {
    return { keyRemaining: null, wsRemaining: null }
  }

  const { keySpend, wsSpend } = await getCurrentSpend(virtualKeyId, workspaceId)

  return {
    keyRemaining: keyCap !== null ? keyCap - keySpend : null,
    wsRemaining: wsCap !== null ? wsCap - wsSpend : null,
  }
}
