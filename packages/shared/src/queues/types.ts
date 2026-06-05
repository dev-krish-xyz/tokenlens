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
}
