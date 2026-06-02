CREATE TABLE IF NOT EXISTS request_logs (
  request_id    String,
  workspace_id  String,
  virtual_key_id String,
  provider      LowCardinality(String),
  model         LowCardinality(String),
  env_tag       LowCardinality(String),
  feature_tag   String DEFAULT '',
  user_id_tag   String DEFAULT '',
  tokens_in     UInt32,
  tokens_out    UInt32,
  cost_usd      Float64,
  latency_ms    UInt32,
  status_code   UInt16,
  created_at    DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMMDD(created_at)
ORDER BY (workspace_id, created_at, request_id);
