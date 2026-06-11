export type WorkspaceContext = {
  workspaceId: string
  virtualKeyId: string
  realApiKey: string
  provider: string
  budgetCap: number | null
}

export type WorkspaceRole = 'admin' | 'member' | 'viewer'

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  admin: 3,
  member: 2,
  viewer: 1,
}

export function hasMinimumRole(
  userRole: WorkspaceRole,
  required: WorkspaceRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required]
}
