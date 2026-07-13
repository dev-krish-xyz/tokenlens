import { NuqsAdapter } from 'nuqs/adapters/next'
import { requireWorkspace } from '../../lib/session.ts'
import { WorkspaceProvider } from '../../providers/WorkspaceProvider.tsx'
import { TRPCProvider } from '../../trpc/provider.tsx'
import { Sidebar } from '../../components/Sidebar.tsx'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { workspace, session } = await requireWorkspace()

  const initials = session.user.name
    ? session.user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : session.user.email.slice(0, 2).toUpperCase()

  return (
    <NuqsAdapter>
      <TRPCProvider>
        <WorkspaceProvider workspace={workspace}>
          <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#FFFFFF' }}>
            <Sidebar />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {/* Topbar */}
              <header
                style={{
                  height: 48,
                  background: '#FFFFFF',
                  borderBottom: '1px solid #E4E4E7',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 20px',
                  flexShrink: 0,
                  gap: 12,
                }}
              >
                {/* Workspace name */}
                <span
                  style={{
                    fontSize: 12,
                    color: '#6B7280',
                    fontWeight: 400,
                  }}
                >
                  {workspace.name}
                </span>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: '#F0F0F0',
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                      border: '1px solid #E5E5E5',
                    }}
                  >
                    {initials}
                  </div>
                </div>
              </header>

              {/* Content */}
              <main style={{ flex: 1, overflowY: 'auto', background: '#FFFFFF' }}>
                {children}
              </main>
            </div>
          </div>
        </WorkspaceProvider>
      </TRPCProvider>
    </NuqsAdapter>
  )
}
