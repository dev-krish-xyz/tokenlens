import { z } from 'zod'

// Job payloads cross a trust boundary (anything with queue access can enqueue),
// so every processor validates with these schemas before touching the data.
// Types are inferred from the schemas — one source of truth.

export const ingestionJobSchema = z.object({
  requestId: z.string().optional(),
  virtualKeyId: z.string().min(1),
  workspaceId: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  envTag: z.string(),
  featureTag: z.string(),
  userIdTag: z.string(),
  tokensIn: z.number().int().min(0),
  tokensOut: z.number().int().min(0),
  latencyMs: z.number().min(0),
  statusCode: z.number().int(),
  createdAt: z.string(),
  /** Estimated cost already reserved by budgetEnforcer; worker adjusts to actual. */
  reservedCostUsd: z.number().optional(),
})

export type IngestionJobData = z.infer<typeof ingestionJobSchema>

export const anomalyJobSchema = z.union([
  /** Broadcast sweep: fan out one per-key check job for every workspace. */
  z.object({ scope: z.literal('all') }),
  z.object({
    virtualKeyId: z.string().min(1),
    workspaceId: z.string().min(1),
  }),
])

export type AnomalyJobData = z.infer<typeof anomalyJobSchema>

export const alertJobSchema = z.discriminatedUnion('type', [
  /** Recurring sweep: run budget threshold checks for every workspace. */
  z.object({ type: z.literal('budget_sweep') }),
  z.object({
    type: z.literal('budget'),
    workspaceId: z.string().min(1),
  }),
  z.object({
    type: z.literal('anomaly'),
    workspaceId: z.string().min(1),
    virtualKeyId: z.string().min(1),
    keyName: z.string(),
    spend: z.number().optional(),
    baseline: z.number().optional(),
    multiplier: z.string().optional(),
    percentage: z.number().optional(),
  }),
])

export type AlertJobData = z.infer<typeof alertJobSchema>
