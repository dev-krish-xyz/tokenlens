import { Queue } from 'bullmq'

const raw = process.env['DRAGONFLY_URL'] ?? 'redis://localhost:6379'
const parsed = new URL(raw)

// Drop type params — Queue<T> triggers a BullMQ v5 conditional type issue due to
// ioredis version mismatch. Job data shapes are enforced at call sites.
const connection = {
  host: parsed.hostname,
  port: parsed.port ? Number(parsed.port) : 6379,
}

export const ingestionQueue = new Queue('ingestion', { connection })
export const alertQueue = new Queue('alert', { connection })
export const anomalyQueue = new Queue('anomaly', { connection })
