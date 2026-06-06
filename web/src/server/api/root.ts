import { router } from './trpc.ts'
import { costRouter } from './routers/cost.ts'

export const appRouter = router({
  cost: costRouter,
})

export type AppRouter = typeof appRouter
