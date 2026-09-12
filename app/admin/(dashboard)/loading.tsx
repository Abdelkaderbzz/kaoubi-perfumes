import { AdminPageSkeleton } from '../admin-ui'

export default function AdminDashboardLoading() {
  return (
    <AdminPageSkeleton
      eyebrow="ADMINISTRATION"
      title="Chargement"
      stats={4}
      rows={6}
      columns={6}
    />
  )
}
