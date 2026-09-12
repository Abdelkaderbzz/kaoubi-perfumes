import { getPickupBoutiques } from '@/app/actions/boutiques'
import { getOrderStatusCounts, getOrdersPaginated } from '@/app/actions/orders'
import { ADMIN_PAGE_SIZE, normalizePage } from '@/lib/pagination'
import { AdminOrdersClient } from '../../orders/admin-orders-client'
import { AdminPageHeader } from '../../admin-ui'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const params = await searchParams
  const page = normalizePage(params.page)
  const search = params.search?.trim() ?? ''
  const status = params.status?.trim() || 'all'

  const [orderPage, statusCounts, pickupBoutiques] = await Promise.all([
    getOrdersPaginated({ page, pageSize: ADMIN_PAGE_SIZE, search, status }),
    getOrderStatusCounts(),
    getPickupBoutiques(),
  ])

  return (
    <div>
      <AdminPageHeader
        eyebrow="VENTES"
        title="Commandes"
        description="Creez des commandes, modifiez le statut, editez les informations client ou supprimez des commandes."
      />
      <AdminOrdersClient
        orders={orderPage.items}
        total={orderPage.total}
        page={orderPage.page}
        search={search}
        status={status}
        statusCounts={statusCounts}
        pickupBoutiques={pickupBoutiques}
      />
    </div>
  )
}
