import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createWithAdmin } from '@tokenlens/shared/workspaceRepo'
import { authDb } from './auth-db.ts'
import { ba_users, ba_sessions, ba_accounts, ba_verifications } from './auth-schema.ts'

const googleClientId = process.env['GOOGLE_CLIENT_ID']
const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET']

const betterAuthUrl =
  process.env['BETTER_AUTH_URL'] ??
  (process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : undefined)

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  secret: process.env['BETTER_AUTH_SECRET'],

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  database: drizzleAdapter(authDb, {
    provider: 'pg',
    schema: {
      user: ba_users,
      session: ba_sessions,
      account: ba_accounts,
      verification: ba_verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
  },

  ...(googleClientId && googleClientSecret
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        },
      }
    : {}),

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createWithAdmin(user.id, user.email)
        },
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
