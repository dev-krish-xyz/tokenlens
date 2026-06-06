'use client'

import { createContext, useContext } from 'react'
import type { Workspace } from '@tokenlens/shared'

type WorkspaceContextValue = {
  workspace: Workspace
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({
  workspace,
  children,
}: {
  workspace: Workspace
  children: React.ReactNode
}) {
  return (
    <WorkspaceContext.Provider value={{ workspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
