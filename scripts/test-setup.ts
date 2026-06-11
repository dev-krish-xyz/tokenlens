process.env['DATABASE_URL'] = process.env['DATABASE_URL'] ?? 'postgres://tokenlens:local@localhost:5432/tokenlens'
process.env['CLICKHOUSE_URL'] = process.env['CLICKHOUSE_URL'] ?? 'http://localhost:8123'
process.env['CLICKHOUSE_USER'] = process.env['CLICKHOUSE_USER'] ?? 'default'
process.env['CLICKHOUSE_PASSWORD'] = process.env['CLICKHOUSE_PASSWORD'] ?? ''
process.env['DRAGONFLY_URL'] = process.env['DRAGONFLY_URL'] ?? 'redis://localhost:6379'
process.env['ENCRYPTION_KEY'] =
  process.env['ENCRYPTION_KEY'] ?? '43a6e16e7960d676fa31454315b1875f2c0f4cdde4a6f4cf979ca4a6a88739ba'
