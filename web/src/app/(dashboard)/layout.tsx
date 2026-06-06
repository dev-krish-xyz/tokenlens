import { requireWorkspace } from '../../lib/session.ts'
import { WorkspaceProvider } from '../../providers/WorkspaceProvider.tsx'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { workspace } = await requireWorkspace()

  return (
    <WorkspaceProvider workspace={workspace}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <span className="font-semibold text-gray-900">TokenLens</span>
            <span className="text-sm text-gray-500">{workspace.name}</span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </WorkspaceProvider>
  )
}
