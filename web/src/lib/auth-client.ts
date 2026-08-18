import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // Prefer dedicated auth URL; fall back to public app URL (set on Vercel)
  baseURL:
    process.env['NEXT_PUBLIC_BETTER_AUTH_URL'] ??
    process.env['NEXT_PUBLIC_APP_URL'] ??
    '',
})

export const { signIn, signUp, signOut, useSession } = authClient
