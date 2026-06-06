import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as authSchema from './auth-schema.ts'

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] })
export const authDb = drizzle(pool, { schema: authSchema })
