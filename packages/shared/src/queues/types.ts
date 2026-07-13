export interface IngestionJobData {
  requestId: string | undefined
  virtualKeyId: string
  workspaceId: string
  provider: string
  model: string
  envTag: string
  featureTag: string
  userIdTag: string
  tokensIn: number
  tokensOut: number
  latencyMs: number
  statusCode: number
  createdAt: string
  /** Estimated cost already reserved by budgetEnforcer; worker adjusts to actual. */
  reservedCostUsd?: number | undefined
}

export interface AlertJobData {
  type: 'budget' | 'anomaly' | 'dead_key'
  workspaceId: string
  virtualKeyId: string
  keyName: string
  spend?: number
  cap?: number
  percentage?: number
  baseline?: number
  multiplier?: string
}

export interface AnomalyJobData {
  virtualKeyId: string
  workspaceId: string
}
