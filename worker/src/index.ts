import { Worker } from 'bullmq'
import { dragonflyClientForBullMQ } from '@tokenlens/shared'
import { clickhouseWriter } from '@tokenlens/shared/clickhouse/writer'
import { processIngestionJob } from './queues/ingestionProcessor.ts'
import { env } from './env.ts'

const ingestionWorker = new Worker('ingestion', processIngestionJob, {
  connection: dragonflyClientForBullMQ,
  concurrency: env.WORKER_CONCURRENCY,
})

ingestionWorker.on('completed', (job) =>
  console.log(`[ingestion] job ${job.id} completed`))

ingestionWorker.on('failed', (job, err) =>
  console.error(`[ingestion] job ${job?.id} failed:`, err.message))

process.on('SIGTERM', async () => {
  await ingestionWorker.close()
  await clickhouseWriter.flush()
  process.exit(0)
})

console.log(`Worker started. Concurrency: ${env.WORKER_CONCURRENCY}`)
