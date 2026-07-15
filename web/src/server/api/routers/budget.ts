import { protectedMemberProcedure, router } from '../trpc.ts'
import {
  getKeyBudgetStatuses,
  getWorkspaceBudgetStatus,
} from '@tokenlens/shared/services/budgetStatusService'

export const budgetRouter = router({
  getKeyBudgetStatus: protectedMemberProcedure.query(({ ctx }) =>
    getKeyBudgetStatuses(ctx.workspaceId)
  ),

  getWorkspaceBudgetStatus: protectedMemberProcedure.query(({ ctx }) =>
    getWorkspaceBudgetStatus(ctx.workspaceId)
  ),
})
