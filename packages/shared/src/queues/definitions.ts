import { Queue, type DefaultJobOptions } from 'bullmq'

const raw = process.env['DRAGONFLY_URL'] ?? 'redis://localhost:6379'
const parsed = new URL(raw)

// Drop type params — Queue<T> triggers a BullMQ v5 conditional type issue due to
// ioredis version mismatch. Job data shapes are enforced at call sites.
const connection = {
  host: parsed.hostname,
  port: parsed.port ? Number(parsed.port) : 6379,
}

// Bounded retries so a transient ClickHouse/DragonflyDB blip doesn't
// permanently drop a job (BullMQ's default is a single attempt), and
// retention caps so completed/failed job payloads don't accumulate in
// DragonflyDB forever at request-log rate.
const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { age: 24 * 60 * 60, count: 5000 },
}

export const ingestionQueue = new Queue('ingestion', { connection, defaultJobOptions })
export const alertQueue = new Queue('alert', { connection, defaultJobOptions })
export const anomalyQueue = new Queue('anomaly', { connection, defaultJobOptions })
