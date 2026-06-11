import { router } from './trpc.ts'
import { costRouter } from './routers/cost.ts'
import { virtualKeyRouter } from './routers/virtualKey.ts'
import { workspaceRouter } from './routers/workspace.ts'
import { budgetRouter } from './routers/budget.ts'
import { alertConfigRouter } from './routers/alertConfig.ts'

export const appRouter = router({
  cost: costRouter,
  virtualKey: virtualKeyRouter,
  workspace: workspaceRouter,
  budget: budgetRouter,
  alertConfig: alertConfigRouter,
})

export type AppRouter = typeof appRouter
