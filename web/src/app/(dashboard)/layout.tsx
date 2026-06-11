import { NuqsAdapter } from 'nuqs/adapters/next'
import { requireWorkspace } from '../../lib/session.ts'
import { WorkspaceProvider } from '../../providers/WorkspaceProvider.tsx'
import { TRPCProvider } from '../../trpc/provider.tsx'
import { Sidebar } from '../../components/Sidebar.tsx'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { workspace, session } = await requireWorkspace()

  const initials = session.user.name
    ? session.user.name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : session.user.email.slice(0, 2).toUpperCase()

  return (
    <NuqsAdapter>
      <TRPCProvider>
        <WorkspaceProvider workspace={workspace}>
          <div
            style={{
              display: 'flex',
              height: '100vh',
              overflow: 'hidden',
            }}
          >
            {/* Sidebar */}
            <Sidebar />

            {/* Main */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              {/* Topbar */}
              <header
                style={{
                  height: 56,
                  background: 'var(--surface)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 24px',
                  flexShrink: 0,
                  gap: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    marginRight: 'auto',
                    color: 'var(--t1)',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'var(--pri)',
                    }}
                  />
                  TokenLens
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      color: 'var(--t2)',
                    }}
                  >
                    {workspace.name}
                  </span>

                  {/* Avatar */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'var(--pri-m)',
                      color: 'var(--pri)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                </div>
              </header>

              {/* Status bar */}
              <div
                style={{
                  background: '#16A34A',
                  color: '#fff',
                  fontSize: 11,
                  padding: '7px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.7)',
                    flexShrink: 0,
                  }}
                />
                All systems operational
                <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                  {workspace.name} · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Content */}
              <main
                style={{
                  flex: 1,
                  overflowY: 'auto',
                }}
              >
                {children}
              </main>
            </div>
          </div>
        </WorkspaceProvider>
      </TRPCProvider>
    </NuqsAdapter>
  )
}
