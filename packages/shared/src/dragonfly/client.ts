import Redis from 'ioredis';

export const dragonflyClient = new Redis(
  process.env['DRAGONFLY_URL'] ?? 'redis://localhost:6379',
  { lazyConnect: true, maxRetriesPerRequest: 3 },
);
