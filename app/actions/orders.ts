'use server'

import { requireAdminId } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { boutiques, orderItems, orders, products } from '@/lib/db/schema'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { getDeliveryFee } from './settings'
import {
  ADMIN_PAGE_SIZE,
  buildPaginatedResult,
  normalizePage,
  normalizePageSize,
  paginationOffset,
  type PaginatedResult,
} from '@/lib/pagination'

export type OrderActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof getOrderWithItemsData>>>

function mapOrderError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    if (error.message === 'Order not found') return 'Commande introuvable.'
    return error.message
  }
  return fallback
}

async function revalidateOrderPaths() {
  revalidatePath('/admin')
  revalidatePath('/admin/orders')
  revalidateTag('orders', 'max')
}

export type CartItem = {
  productId: number
  productName: string
  productBrand: string
  size: string
  quantity: number
  price: number
}

type CreateOrderInput = {
  customerName: string
  customerPhone: string
  customerGovernorate?: string
  customerAddress?: string
  orderType: 'delivery' | 'boutique'
  pickupBoutiqueId?: number | null
  status?: string
  notes?: string
  items: CartItem[]
}

/** Resolves the chosen pickup shop and snapshots its name onto the order. */
async function resolvePickupBoutique(orderType: string, boutiqueId?: number | null) {
  if (orderType !== 'boutique' || !boutiqueId) {
    return { pickupBoutiqueId: null, pickupBoutiqueName: null }
  }

  const [row] = await db
    .select({ id: boutiques.id, name: boutiques.name, city: boutiques.city })
    .from(boutiques)
    .where(eq(boutiques.id, boutiqueId))
    .limit(1)

  if (!row) {
    throw new Error('Boutique de retrait introuvable.')
  }

  return { pickupBoutiqueId: row.id, pickupBoutiqueName: `${row.name} (${row.city})` }
}

async function insertOrderWithItems(data: CreateOrderInput) {
  if (!data.items.length) {
    throw new Error('Ajoutez au moins un article.')
  }

  const [deliveryFeeValue, pickup] = await Promise.all([
    data.orderType === 'delivery' ? getDeliveryFee() : 0,
    resolvePickupBoutique(data.orderType, data.pickupBoutiqueId),
  ])
  const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalAmount = subtotal + deliveryFeeValue

  const [order] = await db
    .insert(orders)
    .values({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerGovernorate: data.customerGovernorate || null,
      customerAddress: data.customerAddress || null,
      orderType: data.orderType,
      ...pickup,
      status: data.status || 'pending',
      totalAmount: totalAmount.toFixed(3),
      deliveryFee: deliveryFeeValue.toFixed(3),
      notes: data.notes || null,
    })
    .returning()

  await db.insert(orderItems).values(
    data.items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      productName: item.productName,
      productBrand: item.productBrand,
      size: item.size,
      quantity: item.quantity,
      price: item.price.toFixed(3),
    })),
  )

  await revalidateOrderPaths()
  return order
}

/** Public store checkout — no auth. */
export async function createOrder(data: Omit<CreateOrderInput, 'status'>) {
  const order = await insertOrderWithItems(data)
  return order.id
}

/** Admin-created order (phone / boutique). */
export async function adminCreateOrder(
  data: CreateOrderInput,
): Promise<OrderActionResult<{ id: number }>> {
  try {
    await requireAdminId()
    const order = await insertOrderWithItems(data)
    return { success: true, data: { id: order.id } }
  } catch (error) {
    return {
      success: false,
      error: mapOrderError(error, 'Impossible de creer la commande.'),
    }
  }
}

export async function getAllOrders() {
  const result = await getOrdersPaginated({ page: 1, pageSize: 500 })
  return result.items
}

function buildOrderSearchCondition(search: string) {
  const trimmed = search.trim()
  if (!trimmed) return undefined

  const term = `%${trimmed}%`
  const idTerm = `%${trimmed.replace(/^#/, '')}%`

  return or(
    ilike(orders.customerName, term),
    ilike(orders.customerPhone, term),
    ilike(orders.customerAddress, term),
    ilike(orders.notes, term),
    sql`cast(${orders.id} as text) like ${idTerm}`,
  )
}

export async function getOrdersPaginated(options: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
} = {}): Promise<PaginatedResult<typeof orders.$inferSelect>> {
  await requireAdminId()

  const page = normalizePage(options.page)
  const pageSize = normalizePageSize(options.pageSize, ADMIN_PAGE_SIZE)
  const offset = paginationOffset(page, pageSize)
  const conditions = []

  const status = options.status?.trim()
  if (status && status !== 'all') {
    conditions.push(eq(orders.status, status))
  }

  const searchCondition = buildOrderSearchCondition(options.search ?? '')
  if (searchCondition) {
    conditions.push(searchCondition)
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [countRow, items] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause)
      .then((rows) => rows[0]),
    db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset),
  ])

  return buildPaginatedResult(items, countRow?.count ?? 0, page, pageSize)
}

const getOrderStatusCountsCached = unstable_cache(
  async () => {
    const rows = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .groupBy(orders.status)

    const counts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    }

    for (const row of rows) {
      counts[row.status] = row.count
    }

    return counts
  },
  ['order-status-counts'],
  { revalidate: 30, tags: ['orders'] },
)

export async function getOrderStatusCounts() {
  await requireAdminId()
  return getOrderStatusCountsCached()
}

export async function getRecentOrders(limit = 5) {
  await requireAdminId()
  return unstable_cache(
    async () =>
      db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          orderType: orders.orderType,
          status: orders.status,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit),
    ['recent-orders', String(limit)],
    { revalidate: 30, tags: ['orders'] },
  )()
}

async function getOrderWithItemsData(id: number) {
  const [[order], items] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, id)).limit(1),
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
  ])
  if (!order) return null
  return { ...order, items }
}

export async function getOrderWithItems(id: number): Promise<OrderActionResult<OrderWithItems>> {
  try {
    await requireAdminId()
    const order = await getOrderWithItemsData(id)
    if (!order) {
      return { success: false, error: 'Commande introuvable.' }
    }
    return { success: true, data: order }
  } catch (error) {
    return {
      success: false,
      error: mapOrderError(error, 'Impossible de charger la commande.'),
    }
  }
}

export async function updateOrderStatus(id: number, status: string): Promise<OrderActionResult> {
  try {
    await requireAdminId()

    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning({ id: orders.id })

    if (!updated) {
      return { success: false, error: 'Commande introuvable.' }
    }

    await revalidateOrderPaths()
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: mapOrderError(error, 'Impossible de mettre a jour le statut.'),
    }
  }
}

export async function updateOrder(
  id: number,
  data: {
    customerName?: string
    customerPhone?: string
    customerGovernorate?: string
    customerAddress?: string
    orderType?: 'delivery' | 'boutique'
    pickupBoutiqueId?: number | null
    status?: string
    notes?: string
  },
): Promise<OrderActionResult<OrderWithItems>> {
  try {
    await requireAdminId()

    const [[existing], items] = await Promise.all([
      db.select().from(orders).where(eq(orders.id, id)).limit(1),
      db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    ])

    if (!existing) {
      return { success: false, error: 'Commande introuvable.' }
    }

    const orderType = (data.orderType ?? existing.orderType) as 'delivery' | 'boutique'
    const deliveryFeeValue =
      orderType === 'delivery'
        ? existing.orderType === 'delivery' && parseFloat(existing.deliveryFee) > 0
          ? parseFloat(existing.deliveryFee)
          : await getDeliveryFee()
        : 0

    const subtotal = items.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0)
    const totalAmount = subtotal + deliveryFeeValue
    const pickup = await resolvePickupBoutique(
      orderType,
      'pickupBoutiqueId' in data ? data.pickupBoutiqueId : existing.pickupBoutiqueId,
    )

    const [updated] = await db
      .update(orders)
      .set({
        ...data,
        ...pickup,
        deliveryFee: deliveryFeeValue.toFixed(3),
        totalAmount: totalAmount.toFixed(3),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    if (!updated) {
      return { success: false, error: 'Commande introuvable.' }
    }

    await revalidateOrderPaths()

    return { success: true, data: { ...updated, items } }
  } catch (error) {
    return {
      success: false,
      error: mapOrderError(error, 'Impossible de modifier la commande.'),
    }
  }
}

export async function deleteOrder(id: number): Promise<OrderActionResult> {
  try {
    await requireAdminId()

    const [deleted] = await db.delete(orders).where(eq(orders.id, id)).returning({ id: orders.id })
    if (!deleted) {
      return { success: false, error: 'Commande introuvable.' }
    }

    await revalidateOrderPaths()
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: mapOrderError(error, 'Impossible de supprimer la commande.'),
    }
  }
}

const getDashboardStatsCached = unstable_cache(
  async () => {
    const [[orderStats], [productStats], deliveryFee] = await Promise.all([
      db
        .select({
          totalOrders: sql<number>`count(*)::int`,
          pendingOrders: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
          revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
        })
        .from(orders),
      db
        .select({
          totalProducts: sql<number>`count(*)::int`,
          inStock: sql<number>`count(*) filter (where ${products.inStock} = true)::int`,
        })
        .from(products),
      getDeliveryFee(),
    ])

    return {
      totalOrders: orderStats?.totalOrders ?? 0,
      pendingOrders: orderStats?.pendingOrders ?? 0,
      revenue: parseFloat(orderStats?.revenue ?? '0'),
      totalProducts: productStats?.totalProducts ?? 0,
      inStockProducts: productStats?.inStock ?? 0,
      deliveryFee,
    }
  },
  ['dashboard-stats'],
  { revalidate: 30, tags: ['orders', 'products', 'settings'] },
)

export async function getDashboardStats() {
  await requireAdminId()
  return getDashboardStatsCached()
}
