import { router } from './trpc.ts'
import { costRouter } from './routers/cost.ts'
import { virtualKeyRouter } from './routers/virtualKey.ts'
import { workspaceRouter } from './routers/workspace.ts'

export const appRouter = router({
  cost: costRouter,
  virtualKey: virtualKeyRouter,
  workspace: workspaceRouter,
})

export type AppRouter = typeof appRouter
