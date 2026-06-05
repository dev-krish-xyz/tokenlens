import { Queue } from 'bullmq'

const raw = process.env['DRAGONFLY_URL'] ?? 'redis://localhost:6379'
const parsed = new URL(raw)

// Drop the type param — Queue<IngestionJobData> triggers a BullMQ v5 conditional type
// issue due to an ioredis version mismatch between shared and bullmq's own ioredis.
// The job data shape is enforced at the call sites via buildIngestionJob's return type.
export const ingestionQueue = new Queue('ingestion', {
  connection: {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
  },
})
