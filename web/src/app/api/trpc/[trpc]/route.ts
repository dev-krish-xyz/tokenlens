import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '../../../../server/api/root.ts'
import { createContext } from '../../../../server/api/trpc.ts'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(),
  })

export { handler as GET, handler as POST }
