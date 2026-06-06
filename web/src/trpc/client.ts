'use client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../server/api/root.ts'

export const trpc = createTRPCReact<AppRouter>()
