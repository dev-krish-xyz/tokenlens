import { clickhouseClient } from './client.ts'
import type { RequestLogRow } from './client.ts'

export class ClickhouseWriter {
  private buffer: RequestLogRow[] = []
  private timer: ReturnType<typeof setInterval>
  private readonly batchSize = 200
  private readonly flushIntervalMs = 2000

  constructor() {
    this.timer = setInterval(() => void this.flush(), this.flushIntervalMs)
  }

  add(row: RequestLogRow): void {
    this.buffer.push(row)
    if (this.buffer.length >= this.batchSize) void this.flush()
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return
    const rows = this.buffer.splice(0)
    await clickhouseClient.insert({ table: 'request_logs', values: rows, format: 'JSONEachRow' })
  }
}

// Singleton — import from @tokenlens/shared/clickhouse/writer.
// Never instantiate inside a job handler.
export const clickhouseWriter = new ClickhouseWriter()
