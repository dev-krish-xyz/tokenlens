import { createCallerFactory, createContext } from '../server/api/trpc.ts'
import { appRouter } from '../server/api/root.ts'

const createCaller = createCallerFactory(appRouter)

export async function getServerCaller() {
  const ctx = await createContext()
  return createCaller(ctx)
}
