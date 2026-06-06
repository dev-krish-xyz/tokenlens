const raw = process.env['DRAGONFLY_URL'] ?? 'redis://localhost:6379'
const parsed = new URL(raw)

export const dragonflyClientForBullMQ = {
  host: parsed.hostname,
  port: parsed.port ? Number(parsed.port) : 6379,
}
