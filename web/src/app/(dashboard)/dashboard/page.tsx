import { requireWorkspace } from '../../../lib/session.ts'

export default async function DashboardPage() {
  const { session, workspace } = await requireWorkspace()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-sm text-gray-500">
        Welcome, {session.user.name ?? session.user.email} · {workspace.name}
      </p>
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        Analytics coming soon.
      </div>
    </div>
  )
}
