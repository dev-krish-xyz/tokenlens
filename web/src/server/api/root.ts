import { router } from './trpc.ts'
import { costRouter } from './routers/cost.ts'
import { virtualKeyRouter } from './routers/virtualKey.ts'
import { workspaceRouter } from './routers/workspace.ts'
import { budgetRouter } from './routers/budget.ts'

export const appRouter = router({
  cost: costRouter,
  virtualKey: virtualKeyRouter,
  workspace: workspaceRouter,
  budget: budgetRouter,
})

export type AppRouter = typeof appRouter
