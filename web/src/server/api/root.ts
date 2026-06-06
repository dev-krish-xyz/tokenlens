import { router } from './trpc.ts'
import { costRouter } from './routers/cost.ts'
import { virtualKeyRouter } from './routers/virtualKey.ts'

export const appRouter = router({
  cost: costRouter,
  virtualKey: virtualKeyRouter,
})

export type AppRouter = typeof appRouter
