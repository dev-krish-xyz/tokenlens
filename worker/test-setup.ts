// Runs before any test file via bunfig.toml [test] preload.
// Sets env vars required by packages/shared/src/env.ts so the shared
// package can load cleanly across all worker tests.
process.env['DATABASE_URL'] = process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/test'
process.env['CLICKHOUSE_URL'] = process.env['CLICKHOUSE_URL'] ?? 'http://localhost:8123'
process.env['DRAGONFLY_URL'] = process.env['DRAGONFLY_URL'] ?? 'redis://localhost:6379'
process.env['ENCRYPTION_KEY'] = process.env['ENCRYPTION_KEY'] ?? '0'.repeat(64)
