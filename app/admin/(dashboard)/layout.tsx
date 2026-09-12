import { ConfirmProvider } from '@/components/confirm-provider'
import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { AdminNav } from '../admin-nav'
import { AdminRoutePrefetch } from '../admin-route-prefetch'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session?.user) redirect('/admin/login')

  return (
    <ConfirmProvider>
      <AdminRoutePrefetch />
      <div className="h-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
        <div className="flex h-full flex-col lg:flex-row">
          <AdminNav userEmail={session.user.email} />
          <main className="flex-1 overflow-y-auto px-4 py-8 lg:px-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </ConfirmProvider>
  )
}
