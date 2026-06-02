import { createClient } from '@clickhouse/client';

export const clickhouseClient = createClient({
  url: process.env['CLICKHOUSE_URL'] ?? 'http://localhost:8123',
  username: process.env['CLICKHOUSE_USER'] ?? 'default',
  password: process.env['CLICKHOUSE_PASSWORD'] ?? '',
});

export type RequestLogRow = {
  request_id: string;
  workspace_id: string;
  virtual_key_id: string;
  provider: string;
  model: string;
  env_tag: string;
  feature_tag: string;
  user_id_tag: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  latency_ms: number;
  status_code: number;
  created_at: string;
};
