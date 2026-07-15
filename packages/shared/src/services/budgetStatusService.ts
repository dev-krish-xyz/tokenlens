import * as virtualKeyRepo from '../db/repositories/virtualKeyRepo.ts'
import { getBudgetCap } from '../db/repositories/workspaceRepo.ts'
import { getCurrentSpend } from './budgetService.ts'

// Dashboard-facing budget aggregation. Kept separate from budgetService so the
// gateway's budgetEnforcer never transitively imports the Postgres repositories.

export type KeyBudgetStatus = {
  keyId: string
  keyName: string
  provider: string
  spend: number
  cap: number
  remaining: number
  percentage: number
}

export type WorkspaceBudgetStatus = {
  cap: number
  spend: number
  remaining: number
  percentage: number
}

export async function getKeyBudgetStatuses(workspaceId: string): Promise<KeyBudgetStatus[]> {
  const keys = await virtualKeyRepo.findByWorkspace(workspaceId)
  const keysWithCap = keys.filter((k) => k.budget_cap !== null)
  return Promise.all(
    keysWithCap.map(async (key) => {
      const cap = parseFloat(key.budget_cap!)
      const { keySpend } = await getCurrentSpend(key.id, workspaceId)
      return {
        keyId: key.id,
        keyName: key.name,
        provider: key.provider,
        spend: keySpend,
        cap,
        remaining: cap - keySpend,
        percentage: Math.min((keySpend / cap) * 100, 100),
      }
    })
  )
}

export async function getWorkspaceBudgetStatus(
  workspaceId: string
): Promise<WorkspaceBudgetStatus | null> {
  const cap = await getBudgetCap(workspaceId)
  if (!cap) return null
  const { wsSpend } = await getCurrentSpend('_', workspaceId)
  return {
    cap,
    spend: wsSpend,
    remaining: cap - wsSpend,
    percentage: Math.min((wsSpend / cap) * 100, 100),
  }
}
