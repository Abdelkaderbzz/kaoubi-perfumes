'use client'

import {
  updateOrderStatus,
  getOrderWithItems,
  updateOrder,
  deleteOrder,
  type OrderWithItems,
} from '@/app/actions/orders'
import { getOrderProductCatalog } from '@/app/actions/products'
import { getDeliveryFee } from '@/app/actions/settings'
import { useToast } from '@/components/toast-provider'
import { useConfirm } from '@/components/confirm-provider'
import { boutiqueLabel, type PickupBoutique } from '@/lib/boutiques'
import { formatDateFr } from '@/lib/locale'
import { GOVERNORATE_SELECT_OPTIONS, getGovernorateLabel } from '@/lib/tunisia-governorates'
import { orderEditSchema, type OrderEditFormValues } from '@/lib/validations'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePrefetchHrefs, useRouteTransition } from '@/lib/use-route-transition'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  AdminBadge,
  AdminButton,
  AdminCellEllipsis,
  AdminEmptyState,
  AdminFieldError,
  AdminIconButton,
  AdminModal,
  AdminSpinner,
  AdminStatCard,
  AdminTable,
  adminInputCls,
  adminInputWithError,
  adminLabelCls,
  adminTableCellCls,
  adminTableHeadCls,
  adminTableMutedCls,
} from '../admin-ui'
import { AdminSelect } from '../admin-select'
import { ADMIN_PAGE_SIZE, AdminPagination } from '../admin-pagination'
import {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_SELECT_CLS,
  orderStatusMeta,
} from '../order-status'
import {
  type CreateOrderProduct,
} from './admin-order-create-modal'

const AdminOrderCreateModal = dynamic(
  () => import('./admin-order-create-modal').then((mod) => mod.AdminOrderCreateModal),
  { ssr: false },
)

type Order = {
  id: number
  customerName: string
  customerPhone: string
  customerGovernorate: string | null
  customerAddress: string | null
  orderType: string
  pickupBoutiqueId: number | null
  pickupBoutiqueName: string | null
  status: string
  totalAmount: string
  deliveryFee: string
  notes: string | null
  createdAt: Date
}

const STATUS_OPTIONS = ORDER_STATUS_OPTIONS

const ORDER_TYPE_OPTIONS = [
  { value: 'delivery', label: 'Livraison' },
  { value: 'boutique', label: 'Retrait boutique' },
]

const STATUS_SELECT_OPTIONS = STATUS_OPTIONS.map((status) => ({
  value: status.value,
  label: status.label,
}))

function boutiqueSelectOptions(boutiques: PickupBoutique[]) {
  return boutiques.map((boutique) => ({
    value: String(boutique.id),
    label: `${boutique.name} — ${boutiqueLabel(boutique)}`,
  }))
}

function buildOrdersUrl(search: string, status: string, page: number) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (status !== 'all') params.set('status', status)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/admin/orders?${query}` : '/admin/orders'
}

function adjustStatusCounts(
  counts: Record<string, number>,
  fromStatus: string | undefined,
  toStatus: string,
) {
  if (!fromStatus || fromStatus === toStatus) return counts
  return {
    ...counts,
    [fromStatus]: Math.max(0, (counts[fromStatus] ?? 0) - 1),
    [toStatus]: (counts[toStatus] ?? 0) + 1,
  }
}

export function AdminOrdersClient({
  orders: initialOrders,
  total,
  page,
  search: initialSearch,
  status: initialStatus,
  statusCounts: initialStatusCounts,
  pickupBoutiques,
}: {
  orders: Order[]
  total: number
  page: number
  search: string
  status: string
  statusCounts: Record<string, number>
  pickupBoutiques: PickupBoutique[]
}) {
  const { isPending: isNavigating, push, refresh } = useRouteTransition()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [orders, setOrders] = useState(initialOrders)
  const [statusCounts, setStatusCounts] = useState(initialStatusCounts)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [creating, setCreating] = useState(false)
  const [createCatalog, setCreateCatalog] = useState<{
    products: CreateOrderProduct[]
    deliveryFee: number
  } | null>(null)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [isPending, startTransition] = useTransition()
  const catalogPrefetchRef = useRef<Promise<void> | null>(null)

  usePrefetchHrefs([
    page > 1 ? buildOrdersUrl(initialSearch, initialStatus, page - 1) : '',
    page * ADMIN_PAGE_SIZE < total ? buildOrdersUrl(initialSearch, initialStatus, page + 1) : '',
  ])

  useEffect(() => {
    setSearchInput(initialSearch)
    setOrders(initialOrders)
    setStatusCounts(initialStatusCounts)
  }, [initialOrders, initialSearch, initialStatusCounts])

  function navigate(nextSearch: string, nextStatus: string, nextPage: number) {
    push(buildOrdersUrl(nextSearch, nextStatus, nextPage))
  }

  function prefetchCreateCatalog() {
    if (createCatalog || catalogPrefetchRef.current) return catalogPrefetchRef.current

    catalogPrefetchRef.current = Promise.all([getOrderProductCatalog(), getDeliveryFee()])
      .then(([products, deliveryFee]) => {
        setCreateCatalog({ products, deliveryFee })
      })
      .catch((error) => {
        catalogPrefetchRef.current = null
        throw error
      })

    return catalogPrefetchRef.current
  }

  async function openCreate() {
    setCreating(true)
    if (createCatalog) return

    try {
      await prefetchCreateCatalog()
    } catch {
      toast.error('Impossible de charger le catalogue produits.')
      setCreating(false)
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<OrderEditFormValues>({
    resolver: zodResolver(orderEditSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerGovernorate: '',
      customerAddress: '',
      orderType: 'delivery',
      pickupBoutiqueId: null,
      status: 'pending',
      notes: '',
    },
  })

  const orderType = watch('orderType')

  async function openOrder(id: number) {
    setLoadingOrderId(id)
    startTransition(async () => {
      try {
        const result = await getOrderWithItems(id)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        setSelectedOrder(result.data)
      } finally {
        setLoadingOrderId(null)
      }
    })
  }

  function openEdit(order: Order) {
    setEditingOrder(order)
    reset({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerGovernorate: order.customerGovernorate ?? '',
      customerAddress: order.customerAddress ?? '',
      orderType: order.orderType as 'delivery' | 'boutique',
      pickupBoutiqueId: order.pickupBoutiqueId,
      status: order.status,
      notes: order.notes ?? '',
    })
  }

  function handleStatusChange(id: number, status: string) {
    startTransition(async () => {
      const previousStatus = orders.find((order) => order.id === id)?.status
      setOrders((current) =>
        current.map((order) => (order.id === id ? { ...order, status } : order)),
      )
      setStatusCounts((current) => adjustStatusCounts(current, previousStatus, status))

      const result = await updateOrderStatus(id, status)
      if (!result.success) {
        if (previousStatus) {
          setOrders((current) =>
            current.map((order) => (order.id === id ? { ...order, status: previousStatus } : order)),
          )
          setStatusCounts((current) => adjustStatusCounts(current, status, previousStatus))
        }
        toast.error(result.error)
        return
      }

      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status } : prev))
      }
      toast.success('Statut de la commande mis a jour.')
    })
  }

  function onEditSubmit(values: OrderEditFormValues) {
    if (!editingOrder) return

    startTransition(async () => {
      const previousStatus = editingOrder.status
      const result = await updateOrder(editingOrder.id, {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerGovernorate: values.customerGovernorate || undefined,
        customerAddress: values.customerAddress || undefined,
        orderType: values.orderType,
        pickupBoutiqueId: values.orderType === 'boutique' ? values.pickupBoutiqueId : null,
        status: values.status,
        notes: values.notes || undefined,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      const refreshed = result.data
      setOrders((current) =>
        current.map((order) =>
          order.id === editingOrder.id
            ? {
                ...order,
                customerName: refreshed.customerName,
                customerPhone: refreshed.customerPhone,
                customerGovernorate: refreshed.customerGovernorate,
                customerAddress: refreshed.customerAddress,
                orderType: refreshed.orderType,
                pickupBoutiqueId: refreshed.pickupBoutiqueId,
                pickupBoutiqueName: refreshed.pickupBoutiqueName,
                status: refreshed.status,
                totalAmount: refreshed.totalAmount,
                notes: refreshed.notes,
              }
            : order,
        ),
      )
      setStatusCounts((current) => adjustStatusCounts(current, previousStatus, refreshed.status))

      if (selectedOrder?.id === editingOrder.id) {
        setSelectedOrder(refreshed)
      }

      setEditingOrder(null)
      toast.success('Commande modifiee avec succes.')
    })
  }

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: 'Supprimer cette commande ?',
      description: 'Cette action est irreversible.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return

    startTransition(async () => {
      const result = await deleteOrder(id)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      if (selectedOrder?.id === id) setSelectedOrder(null)
      if (editingOrder?.id === id) setEditingOrder(null)
      toast.success('Commande supprimee.')
      refresh()
    })
  }

  const emptyMessage =
    searchInput.trim().length > 0
      ? 'Aucune commande ne correspond a votre recherche.'
      : initialStatus === 'all'
        ? 'Aucune commande pour le moment.'
        : 'Aucune commande pour ce filtre.'

  const isBusy = isPending || isNavigating

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_OPTIONS.slice(0, 4).map((status) => {
          const count = statusCounts[status.value] ?? 0
          return (
            <button
              key={status.value}
              type="button"
              onClick={() => navigate(searchInput, status.value, 1)}
              disabled={isNavigating}
              className="text-left disabled:opacity-60"
            >
              <AdminStatCard label={status.label} value={count} tone={status.tone} />
            </button>
          )
        })}
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <AdminButton
            onClick={() => void openCreate()}
            onPointerEnter={prefetchCreateCatalog}
            onFocus={prefetchCreateCatalog}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            Nouvelle commande
          </AdminButton>
          <AdminButton
            variant={initialStatus === 'all' ? 'primary' : 'outline'}
            onClick={() => navigate(searchInput, 'all', 1)}
            disabled={isNavigating}
          >
            Toutes
          </AdminButton>
          {STATUS_OPTIONS.map((status) => (
            <AdminButton
              key={status.value}
              variant={initialStatus === status.value ? 'primary' : 'outline'}
              onClick={() => navigate(searchInput, status.value, 1)}
              disabled={isNavigating}
            >
              {status.label}
            </AdminButton>
          ))}
        </div>

        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              navigate(searchInput, initialStatus, 1)
            }
          }}
          placeholder="Rechercher par #, client, tel, adresse..."
          className={`${adminInputCls} lg:max-w-sm`}
          disabled={isNavigating}
        />
      </div>

      {total === 0 ? (
        <AdminEmptyState message={emptyMessage} />
      ) : (
        <AdminTable
          className="table-fixed min-w-[980px]"
          loading={isNavigating}
          loadingLabel="Chargement des commandes..."
        >
          <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={`${adminTableHeadCls} w-[72px]`}>#</th>
              <th className={`${adminTableHeadCls} w-[140px]`}>Client</th>
              <th className={`${adminTableHeadCls} w-[128px]`}>Tel</th>
              <th className={`${adminTableHeadCls} w-[150px]`}>Gouvernorat</th>
              <th className={`${adminTableHeadCls} w-[220px]`}>Adresse</th>
              <th className={`${adminTableHeadCls} w-[108px]`}>Type</th>
              <th className={`${adminTableHeadCls} w-[112px] text-right`}>Total</th>
              <th className={`${adminTableHeadCls} w-[156px]`}>Statut</th>
              <th className={`${adminTableHeadCls} w-[104px]`}>Date</th>
              <th className={`${adminTableHeadCls} w-[116px] text-center`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-slate-50/80">
                <td className={`${adminTableMutedCls} font-mono text-xs`}>#{order.id}</td>
                <td className={`${adminTableCellCls} font-medium`}>
                  <AdminCellEllipsis text={order.customerName} maxWidthClass="max-w-[140px]" />
                </td>
                <td className={`${adminTableMutedCls} whitespace-nowrap font-mono text-xs`} dir="ltr">
                  {order.customerPhone}
                </td>
                <td className={adminTableCellCls}>
                  <AdminCellEllipsis
                    text={
                      order.orderType === 'delivery'
                        ? getGovernorateLabel(order.customerGovernorate)
                        : '—'
                    }
                    maxWidthClass="max-w-[150px]"
                  />
                </td>
                <td className={adminTableCellCls}>
                  <AdminCellEllipsis
                    text={
                      order.orderType === 'delivery'
                        ? order.customerAddress
                        : order.pickupBoutiqueName
                          ? `Retrait — ${order.pickupBoutiqueName}`
                          : 'Retrait boutique'
                    }
                    maxWidthClass="max-w-[220px]"
                  />
                </td>
                <td className={adminTableCellCls}>
                  <AdminBadge tone={order.orderType === 'delivery' ? 'info' : 'warning'}>
                    {order.orderType === 'delivery' ? 'Livraison' : 'Boutique'}
                  </AdminBadge>
                </td>
                <td className={`${adminTableCellCls} text-right font-semibold tabular-nums whitespace-nowrap`}>
                  {parseFloat(order.totalAmount).toFixed(3)} TND
                </td>
                <td className={`${adminTableCellCls} min-w-0`}>
                  <AdminSelect
                    value={order.status}
                    onValueChange={(status) => handleStatusChange(order.id, status)}
                    items={STATUS_SELECT_OPTIONS}
                    disabled={isBusy}
                    className={`!py-1.5 text-sm ${ORDER_STATUS_SELECT_CLS[orderStatusMeta(order.status).tone]}`}
                  />
                </td>
                <td className={`${adminTableMutedCls} whitespace-nowrap text-xs`}>
                  {formatDateFr(order.createdAt)}
                </td>
                <td className={adminTableCellCls}>
                  <div className="flex items-center justify-center gap-0.5">
                    <AdminIconButton
                      label="Voir les details"
                      onClick={() => openOrder(order.id)}
                      disabled={isBusy}
                    >
                      <Eye className="size-4" />
                    </AdminIconButton>
                    <AdminIconButton
                      label="Modifier la commande"
                      onClick={() => openEdit(order)}
                      disabled={isBusy}
                    >
                      <Pencil className="size-4" />
                    </AdminIconButton>
                    <AdminIconButton
                      label="Supprimer la commande"
                      variant="danger"
                      onClick={() => handleDelete(order.id)}
                      disabled={isBusy}
                    >
                      <Trash2 className="size-4" />
                    </AdminIconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      {total > 0 && (
        <AdminPagination
          page={page}
          pageSize={ADMIN_PAGE_SIZE}
          totalItems={total}
          loading={isNavigating}
          onPageChange={(nextPage) => navigate(searchInput, initialStatus, nextPage)}
        />
      )}

      {creating && !createCatalog && (
        <AdminModal title="Nouvelle commande" onClose={() => setCreating(false)}>
          <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-600">
            <AdminSpinner />
            Chargement du catalogue...
          </div>
        </AdminModal>
      )}

      {creating && createCatalog && (
        <AdminOrderCreateModal
          products={createCatalog.products}
          deliveryFee={createCatalog.deliveryFee}
          pickupBoutiques={pickupBoutiques}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            refresh()
          }}
        />
      )}

      {loadingOrderId !== null && !selectedOrder && (
        <AdminModal title="Chargement..." onClose={() => setLoadingOrderId(null)}>
          <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-600">
            <AdminSpinner />
            Chargement de la commande...
          </div>
        </AdminModal>
      )}

      {selectedOrder && (
        <AdminModal title={`Commande #${selectedOrder.id}`} onClose={() => setSelectedOrder(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Client', value: selectedOrder.customerName },
                { label: 'Telephone', value: selectedOrder.customerPhone },
                {
                  label: 'Type',
                  value: selectedOrder.orderType === 'delivery' ? 'Livraison' : 'Retrait boutique',
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 font-medium text-slate-900">{value}</p>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</p>
                <div className="mt-1">
                  <AdminBadge tone={orderStatusMeta(selectedOrder.status).tone}>
                    {orderStatusMeta(selectedOrder.status).label}
                  </AdminBadge>
                </div>
              </div>
            </div>

            {selectedOrder.customerGovernorate && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gouvernorat</p>
                <p className="mt-1 text-slate-800">
                  {getGovernorateLabel(selectedOrder.customerGovernorate)}
                </p>
              </div>
            )}
            {selectedOrder.customerAddress && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adresse</p>
                <p className="mt-1 text-slate-800">{selectedOrder.customerAddress}</p>
              </div>
            )}
            {selectedOrder.orderType === 'boutique' && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Boutique de retrait
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {selectedOrder.pickupBoutiqueName ?? 'Non precisee'}
                </p>
              </div>
            )}
            {selectedOrder.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                <p className="mt-1 text-slate-800">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Articles</p>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="mb-2 flex justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.productName}</p>
                    <p className="text-sm text-slate-500">
                      {item.productBrand} · {item.size} · x{item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {(parseFloat(item.price) * item.quantity).toFixed(3)} TND
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-slate-500">
                <span>Livraison</span>
                <span>
                  {parseFloat(selectedOrder.deliveryFee) === 0
                    ? 'Gratuit'
                    : `${parseFloat(selectedOrder.deliveryFee).toFixed(3)} TND`}
                </span>
              </div>
              <div className="flex justify-between text-slate-900">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">
                  {parseFloat(selectedOrder.totalAmount).toFixed(3)} TND
                </span>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {editingOrder && (
        <AdminModal
          title={`Modifier commande #${editingOrder.id}`}
          onClose={() => !isPending && setEditingOrder(null)}
        >
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <label className={adminLabelCls}>NOM CLIENT *</label>
              <input
                className={adminInputWithError(!!errors.customerName)}
                disabled={isPending}
                {...register('customerName')}
              />
              <AdminFieldError message={errors.customerName?.message} />
            </div>
            <div>
              <label className={adminLabelCls}>TELEPHONE *</label>
              <input
                className={adminInputWithError(!!errors.customerPhone)}
                disabled={isPending}
                {...register('customerPhone')}
              />
              <AdminFieldError message={errors.customerPhone?.message} />
            </div>
            <div>
              <label className={adminLabelCls}>TYPE</label>
              <Controller
                control={control}
                name="orderType"
                render={({ field }) => (
                  <AdminSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    items={ORDER_TYPE_OPTIONS}
                    error={!!errors.orderType}
                    disabled={isPending}
                  />
                )}
              />
              <AdminFieldError message={errors.orderType?.message} />
            </div>
            {orderType === 'delivery' && (
              <>
                <div>
                  <label className={adminLabelCls}>GOUVERNORAT *</label>
                  <Controller
                    control={control}
                    name="customerGovernorate"
                    render={({ field }) => (
                      <AdminSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        items={GOVERNORATE_SELECT_OPTIONS}
                        error={!!errors.customerGovernorate}
                        disabled={isPending}
                      />
                    )}
                  />
                  <AdminFieldError message={errors.customerGovernorate?.message} />
                </div>
                <div>
                  <label className={adminLabelCls}>ADRESSE</label>
                  <textarea
                    rows={3}
                    className={`${adminInputWithError(!!errors.customerAddress)} resize-none`}
                    disabled={isPending}
                    {...register('customerAddress')}
                  />
                  <AdminFieldError message={errors.customerAddress?.message} />
                </div>
              </>
            )}
            {orderType === 'boutique' && (
              <div>
                <label className={adminLabelCls}>BOUTIQUE DE RETRAIT *</label>
                <Controller
                  control={control}
                  name="pickupBoutiqueId"
                  render={({ field }) => (
                    <AdminSelect
                      value={field.value == null ? '' : String(field.value)}
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      items={boutiqueSelectOptions(pickupBoutiques)}
                      placeholder="Choisir une boutique"
                      error={!!errors.pickupBoutiqueId}
                      disabled={isPending || pickupBoutiques.length === 0}
                    />
                  )}
                />
                <AdminFieldError message={errors.pickupBoutiqueId?.message} />
                {pickupBoutiques.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    Activez le retrait sur au moins une boutique dans l onglet Boutiques.
                  </p>
                )}
              </div>
            )}
            <div>
              <label className={adminLabelCls}>STATUT</label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <AdminSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    items={STATUS_SELECT_OPTIONS}
                    error={!!errors.status}
                    disabled={isPending}
                    className={ORDER_STATUS_SELECT_CLS[orderStatusMeta(field.value).tone]}
                  />
                )}
              />
              <AdminFieldError message={errors.status?.message} />
            </div>
            <div>
              <label className={adminLabelCls}>NOTES</label>
              <textarea
                rows={2}
                className={`${adminInputWithError(!!errors.notes)} resize-none`}
                disabled={isPending}
                {...register('notes')}
              />
              <AdminFieldError message={errors.notes?.message} />
            </div>

            <AdminButton type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </AdminButton>
          </form>
        </AdminModal>
      )}
    </div>
  )
}
