import type { Job } from 'bullmq'
import { findByPattern } from '@tokenlens/shared/pricingRepo'
import { calculateCost } from '@tokenlens/shared'
import { clickhouseWriter } from '@tokenlens/shared/clickhouse/writer'
import { adjustSpend } from '@tokenlens/shared/services/budgetService'
import { hashVirtualKeyId } from '@tokenlens/shared/keyVault'
import { ingestionJobSchema, type IngestionJobData } from '@tokenlens/shared/queues/types'

export async function processIngestionJob(job: Job<IngestionJobData>): Promise<void> {
  const data = ingestionJobSchema.parse(job.data)
  const { provider, model, tokensIn, tokensOut } = data

  const pricing = await findByPattern(provider, model)
  const costUsd = calculateCost(tokensIn, tokensOut, pricing)

  clickhouseWriter.add({
    request_id: data.requestId ?? '',
    workspace_id: data.workspaceId,
    // The virtual key id doubles as the bearer credential — store a hash so
    // ClickHouse rows never contain the secret while grouping still works.
    virtual_key_id: hashVirtualKeyId(data.virtualKeyId),
    provider: data.provider,
    model: data.model,
    env_tag: data.envTag,
    feature_tag: data.featureTag,
    user_id_tag: data.userIdTag,
    tokens_in: data.tokensIn,
    tokens_out: data.tokensOut,
    cost_usd: costUsd,
    latency_ms: data.latencyMs,
    status_code: data.statusCode,
    created_at: data.createdAt,
  })

  try {
    // budgetEnforcer already reserved an estimate; converge to the actual cost.
    const reserved = data.reservedCostUsd ?? 0
    await adjustSpend(data.virtualKeyId, data.workspaceId, costUsd - reserved)
  } catch (err) {
    console.error('[ingestionProcessor] adjustSpend failed (non-fatal):', err)
  }
}
