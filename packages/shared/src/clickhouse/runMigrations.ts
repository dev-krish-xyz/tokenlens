import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

const url = process.env['CLICKHOUSE_URL'] ?? 'http://localhost:8123';
const user = process.env['CLICKHOUSE_USER'] ?? 'default';
const password = process.env['CLICKHOUSE_PASSWORD'] ?? '';

const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  console.log(`Running migration: ${file}`);
  const sql = await readFile(join(migrationsDir, file), 'utf-8');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-ClickHouse-User': user,
      'X-ClickHouse-Key': password,
      'Content-Type': 'text/plain',
    },
    body: sql,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Migration ${file} failed (${res.status}): ${body}`);
  }

  console.log(`  OK: ${file}`);
}

console.log('All ClickHouse migrations applied.');
