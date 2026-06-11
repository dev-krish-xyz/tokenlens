import { Worker } from 'bullmq'
import { dragonflyClientForBullMQ } from '@tokenlens/shared'
import { clickhouseWriter } from '@tokenlens/shared/clickhouse/writer'
import { anomalyQueue } from '@tokenlens/shared/queues/definitions'
import { processIngestionJob } from './queues/ingestionProcessor.ts'
import { processAlertJob } from './queues/alertProcessor.ts'
import { processAnomalyCheck } from './queues/anomalyProcessor.ts'
import { env } from './env.ts'

const ingestionWorker = new Worker('ingestion', processIngestionJob, {
  connection: dragonflyClientForBullMQ,
  concurrency: env.WORKER_CONCURRENCY,
})

const alertWorker = new Worker('alert', processAlertJob, {
  connection: dragonflyClientForBullMQ,
  concurrency: 5,
})

const anomalyWorker = new Worker('anomaly', processAnomalyCheck, {
  connection: dragonflyClientForBullMQ,
  concurrency: 2,
})

ingestionWorker.on('completed', (job) =>
  console.log(`[ingestion] job ${job.id} completed`))

ingestionWorker.on('failed', (job, err) =>
  console.error(`[ingestion] job ${job?.id} failed:`, err.message))

alertWorker.on('failed', (job, err) =>
  console.error(`[alert] ${job?.id} failed:`, err.message))

anomalyWorker.on('failed', (job, err) =>
  console.error(`[anomaly] ${job?.id} failed:`, err.message))

await anomalyQueue.add(
  'check-all',
  { virtualKeyId: '_', workspaceId: '_' },
  { jobId: 'anomaly-recurring', repeat: { every: 300_000 } },
)

process.on('SIGTERM', async () => {
  await ingestionWorker.close()
  await alertWorker.close()
  await anomalyWorker.close()
  await clickhouseWriter.flush()
  process.exit(0)
})

console.log(`Worker started. Concurrency: ${env.WORKER_CONCURRENCY}`)
