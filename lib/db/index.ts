import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { resolveDatabaseUrl } from './connection-string'
import * as schema from './schema'

const globalForDb = globalThis as typeof globalThis & { pgPool?: Pool }

function createPool() {
  return new Pool({
    connectionString: resolveDatabaseUrl(),
    max: process.env.VERCEL ? 5 : 8,
    idleTimeoutMillis: 30_000,
    // Neon compute can take a while to wake from scale-to-zero.
    connectionTimeoutMillis: 20_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  })
}

export const pool = globalForDb.pgPool ?? createPool()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgPool = pool
}

export const db = drizzle(pool, { schema })
