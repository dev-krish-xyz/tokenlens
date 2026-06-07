import { NuqsAdapter } from 'nuqs/adapters/next'
import { requireWorkspace } from '../../lib/session.ts'
import { WorkspaceProvider } from '../../providers/WorkspaceProvider.tsx'
import { TRPCProvider } from '../../trpc/provider.tsx'
import { DashboardNav } from '../../components/DashboardNav.tsx'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { workspace } = await requireWorkspace()

  return (
    <NuqsAdapter>
      <TRPCProvider>
        <WorkspaceProvider workspace={workspace}>
          <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="font-semibold text-gray-900">TokenLens</span>
                  <DashboardNav />
                </div>
                <span className="text-sm text-gray-500">{workspace.name}</span>
              </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
          </div>
        </WorkspaceProvider>
      </TRPCProvider>
    </NuqsAdapter>
  )
}
