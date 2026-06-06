import type { Job } from 'bullmq'
import { findByPattern } from '@tokenlens/shared/pricingRepo'
import { calculateCost } from '@tokenlens/shared'
import { clickhouseWriter } from '@tokenlens/shared/clickhouse/writer'
import type { IngestionJobData } from '@tokenlens/shared/queues/types'

export async function processIngestionJob(job: Job<IngestionJobData>): Promise<void> {
  const { provider, model, tokensIn, tokensOut } = job.data

  const pricing = await findByPattern(provider, model)
  const costUsd = calculateCost(tokensIn, tokensOut, pricing)

  clickhouseWriter.add({
    request_id: job.data.requestId ?? '',
    workspace_id: job.data.workspaceId,
    virtual_key_id: job.data.virtualKeyId,
    provider: job.data.provider,
    model: job.data.model,
    env_tag: job.data.envTag,
    feature_tag: job.data.featureTag,
    user_id_tag: job.data.userIdTag,
    tokens_in: job.data.tokensIn,
    tokens_out: job.data.tokensOut,
    cost_usd: costUsd,
    latency_ms: job.data.latencyMs,
    status_code: job.data.statusCode,
    created_at: job.data.createdAt,
  })
}
