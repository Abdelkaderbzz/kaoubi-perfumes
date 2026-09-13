'use server'

import { requireAdminId } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { orderItems, orders, products } from '@/lib/db/schema'
import {
  ADMIN_PAGE_SIZE,
  STORE_PAGE_SIZE,
  buildPaginatedResult,
  normalizePage,
  normalizePageSize,
  paginationOffset,
  type PaginatedResult,
} from '@/lib/pagination'
import { getPrimaryImage, serializeProductImages } from '@/lib/product-images'
import {
  RELATED_PRODUCTS_SHOWN,
  parseRelatedProductIds,
  serializeRelatedProductIds,
} from '@/lib/product-relations'
import { getListingPrice, serializeProductSizeVariants } from '@/lib/product-sizes'
import { serializeFragranceNotes } from '@/lib/fragrance-notes'
import {
  serializePerfumeComposition,
  type PerfumeComposition,
} from '@/lib/perfume-composition'
import { serializeWearMoments } from '@/lib/product-wear'
import { parseProductSort, productSortOrder, type ProductSort } from '@/lib/product-sort'
import { categoryFilterSlugs } from '@/lib/store-categories'
import { and, asc, desc, eq, ilike, inArray, isNotNull, ne, notInArray, or, sql } from 'drizzle-orm'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

function normalizeProductImages(images: string[]) {
  const serialized = serializeProductImages(images)
  const primary = getPrimaryImage({ images: serialized })
  return {
    images: serialized,
    imageUrl: primary,
  }
}

function revalidateProductCaches(id?: number) {
  revalidateTag('products', 'max')
  if (id) revalidateTag(`product-${id}`, 'max')
}

function revalidateProductPage(id: number) {
  revalidatePath(`/products/${id}`)
}

type ProductListOptions = {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  wear?: string[]
  notes?: string[]
  intensity?: string
  sex?: string
  inStock?: 'all' | 'in' | 'out'
  publishedOnly?: boolean
  sort?: ProductSort
}

function buildProductConditions(options: ProductListOptions) {
  const conditions = []

  if (options.publishedOnly !== false) {
    conditions.push(eq(products.published, true))
  }

  const search = options.search?.trim()
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.brand, `%${search}%`),
        ilike(products.category, `%${search}%`),
      )!,
    )
  }

  const category = options.category?.trim()
  if (category && category !== 'all') {
    const slugs = categoryFilterSlugs(category)
    conditions.push(
      slugs.length === 1 ? eq(products.category, slugs[0]) : inArray(products.category, slugs),
    )
  }

  const wear = options.wear?.filter(Boolean) ?? []
  if (wear.length > 0) {
    conditions.push(or(...wear.map((tag) => ilike(products.wearMoments, `%"${tag}"%`)))!)
  }

  const notes = options.notes?.filter(Boolean) ?? []
  if (notes.length > 0) {
    conditions.push(or(...notes.map((tag) => ilike(products.fragranceNotes, `%"${tag}"%`)))!)
  }

  const intensity = options.intensity?.trim()
  if (intensity) {
    conditions.push(eq(products.intensity, intensity))
  }

  const sex = options.sex?.trim()
  if (sex) {
    conditions.push(eq(products.sex, sex))
  }

  if (options.inStock === 'in') {
    conditions.push(eq(products.inStock, true))
  } else if (options.inStock === 'out') {
    conditions.push(eq(products.inStock, false))
  }

  return conditions
}

async function queryProductsPaginated(options: ProductListOptions): Promise<PaginatedResult<typeof products.$inferSelect>> {
  const page = normalizePage(options.page)
  const pageSize = normalizePageSize(options.pageSize, ADMIN_PAGE_SIZE)
  const offset = paginationOffset(page, pageSize)
  const conditions = buildProductConditions(options)
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const orderBy = productSortOrder(parseProductSort(options.sort))

  const [countRow, items] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause)
      .then((rows) => rows[0]),
    db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset(offset),
  ])

  return buildPaginatedResult(items, countRow?.count ?? 0, page, pageSize)
}

export async function getAdminProductsPaginated(options: {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  inStock?: 'all' | 'in' | 'out'
} = {}) {
  await requireAdminId()
  return queryProductsPaginated({ ...options, publishedOnly: false })
}

export async function getStoreProductsPaginated(options: {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  wear?: string[]
  notes?: string[]
  intensity?: string
  sex?: string
  sort?: ProductSort
} = {}) {
  const page = normalizePage(options.page)
  const pageSize = normalizePageSize(options.pageSize, STORE_PAGE_SIZE)
  const search = options.search?.trim() ?? ''
  const category = options.category?.trim() || 'all'
  const wear = [...(options.wear ?? [])].filter(Boolean).sort()
  const notes = [...(options.notes ?? [])].filter(Boolean).sort()
  const intensity = options.intensity?.trim() ?? ''
  const sex = options.sex?.trim() ?? ''
  const sort = parseProductSort(options.sort)

  return unstable_cache(
    async () =>
      queryProductsPaginated({
        page,
        pageSize,
        search,
        category,
        wear,
        notes,
        intensity,
        sex,
        sort,
        publishedOnly: true,
      }),
    [
      'store-products-paginated',
      'v5',
      String(page),
      String(pageSize),
      search,
      category,
      wear.join(','),
      notes.join(','),
      intensity,
      sex,
      sort,
    ],
    { revalidate: 60, tags: ['products'] },
  )()
}

/** @deprecated Use getStoreProductsPaginated for paginated reads. */
export async function getProducts(search?: string, category?: string) {
  const result = await getStoreProductsPaginated({
    search,
    category,
    page: 1,
    pageSize: 500,
  })
  return result.items
}

/** @deprecated Use getAdminProductsPaginated for paginated reads. */
export async function getAdminProducts() {
  const result = await getAdminProductsPaginated({ page: 1, pageSize: 500 })
  return result.items
}

const FEATURED_HOME_ORDER = sql`CASE ${products.name}
  WHEN 'Lavendarine' THEN 1
  WHEN 'Body Mist Lavendarine' THEN 2
  WHEN 'Mkhamaria Lavendarine' THEN 3
  WHEN 'Mkhamaria' THEN 4
  ELSE 99
END`

const getFeaturedProductsCached = unstable_cache(
  async () =>
    db
      .select()
      .from(products)
      .where(and(eq(products.featured, true), eq(products.published, true)))
      .orderBy(FEATURED_HOME_ORDER, desc(products.createdAt))
      .limit(4),
  ['featured-products', 'v8'],
  { revalidate: 120, tags: ['products'] },
)

export async function getFeaturedProducts() {
  return getFeaturedProductsCached()
}

const getNewProductsCached = unstable_cache(
  async () =>
    db
      .select()
      .from(products)
      .where(and(eq(products.newArrival, true), eq(products.published, true)))
      .orderBy(desc(products.updatedAt), desc(products.createdAt))
      .limit(8),
  ['new-products', 'v7'],
  { revalidate: 120, tags: ['products'] },
)

/** Admin-curated products for the "Nouveautes" storefront section. */
export async function getNewProducts() {
  return getNewProductsCached()
}

const getPromotionProductsCached = unstable_cache(
  async () =>
    db
      .select()
      .from(products)
      .where(
        and(
          eq(products.published, true),
          or(eq(products.promoTagEnabled, true), isNotNull(products.compareAtPrice)),
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(8),
  ['promotion-products'],
  { revalidate: 120, tags: ['products'] },
)

/** Products currently discounted or flagged with a promo tag. */
export async function getPromotionProducts() {
  return getPromotionProductsCached()
}

const getBestSellingProductsCached = unstable_cache(
  async () => {
    const rows = await db
      .select({ productId: orderItems.productId, sold: sql<number>`sum(${orderItems.quantity})::int` })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(ne(orders.status, 'cancelled'))
      .groupBy(orderItems.productId)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(8)

    if (rows.length === 0) return []

    const ids = rows.map((row) => row.productId)
    const rowsById = new Map(rows.map((row) => [row.productId, row.sold]))
    const items = await db
      .select()
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.published, true)))

    return items.sort((a, b) => (rowsById.get(b.id) ?? 0) - (rowsById.get(a.id) ?? 0))
  },
  ['best-selling-products'],
  { revalidate: 300, tags: ['products', 'orders'] },
)

/** Products ranked by total quantity sold across non-cancelled orders. */
export async function getBestSellingProducts() {
  return getBestSellingProductsCached()
}

export async function getProductById(id: number) {
  return unstable_cache(
    async () => {
      const result = await db
        .select()
        .from(products)
        .where(and(eq(products.id, id), eq(products.published, true)))
        .limit(1)
      return result[0] ?? null
    },
    ['product-by-id', 'v7', String(id)],
    { revalidate: 120, tags: ['products', `product-${id}`] },
  )()
}

const getPublishedProductEntriesCached = unstable_cache(
  async () =>
    db
      .select({
        id: products.id,
        updatedAt: products.updatedAt,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(eq(products.published, true))
      .orderBy(desc(products.updatedAt)),
  ['published-product-entries', 'v5'],
  { revalidate: 300, tags: ['products'] },
)

/** Published product ids for sitemap + static params. */
export async function getPublishedProductEntries() {
  return getPublishedProductEntriesCached()
}

const PRODUCT_OPTION_COLUMNS = {
  id: products.id,
  name: products.name,
  brand: products.brand,
  category: products.category,
  published: products.published,
} as const

const getProductOptionsCached = unstable_cache(
  async () =>
    db
      .select(PRODUCT_OPTION_COLUMNS)
      .from(products)
      .orderBy(asc(products.brand), asc(products.name)),
  ['product-options'],
  { revalidate: 60, tags: ['products'] },
)

/** Lightweight catalogue used by the related-products picker in the admin. */
export async function getProductOptions() {
  await requireAdminId()
  return getProductOptionsCached()
}

const ORDER_PRODUCT_CATALOG_COLUMNS = {
  id: products.id,
  name: products.name,
  brand: products.brand,
  price: products.price,
  sizes: products.sizes,
  inStock: products.inStock,
} as const

/** Compact product list for the admin "new order" modal — not page-capped. */
export async function getOrderProductCatalog() {
  await requireAdminId()
  return db
    .select(ORDER_PRODUCT_CATALOG_COLUMNS)
    .from(products)
    .orderBy(asc(products.brand), asc(products.name))
}

/** Admin picks come first, in the order they were chosen; anything missing is
 *  filled with other products from the same category. */
export async function getRelatedProducts(productId: number) {
  return unstable_cache(
    async () => {
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.id, productId), eq(products.published, true)))
        .limit(1)
      if (!product) return []

      const curatedIds = parseRelatedProductIds(product).filter((id) => id !== productId)

      const curatedRows = curatedIds.length
        ? await db
            .select()
            .from(products)
            .where(and(inArray(products.id, curatedIds), eq(products.published, true)))
        : []

      const curated = curatedIds
        .map((id) => curatedRows.find((row) => row.id === id))
        .filter((row): row is typeof products.$inferSelect => Boolean(row))
        .slice(0, RELATED_PRODUCTS_SHOWN)

      const missing = RELATED_PRODUCTS_SHOWN - curated.length
      if (missing <= 0) return curated

      const excluded = [productId, ...curated.map((row) => row.id)]
      const fallback = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.published, true),
            eq(products.category, product.category),
            excluded.length > 1 ? notInArray(products.id, excluded) : ne(products.id, productId),
          ),
        )
        .orderBy(desc(products.featured), desc(products.createdAt))
        .limit(missing)

      return [...curated, ...fallback]
    },
    ['related-products', 'v5', String(productId)],
    { revalidate: 120, tags: ['products', `product-${productId}`] },
  )()
}

export async function addProduct(data: {
  name: string
  brand: string
  description: string
  price: string
  compareAtPrice?: string | null
  category: string
  images: string[]
  sizes: { size: string; price: string }[]
  relatedProductIds?: number[]
  fragranceNotes?: string[]
  composition?: PerfumeComposition
  wearMoments?: string[]
  intensity?: string | null
  sex?: string | null
  inStock: boolean
  featured: boolean
  newArrival: boolean
  published: boolean
  promoTagEnabled?: boolean
  promoTagLabel?: string
  promoTagBgColor?: string
  promoTagTextColor?: string
}) {
  await requireAdminId()
  const imageData = normalizeProductImages(data.images)
  const compareAtPrice = data.compareAtPrice?.trim() || null
  const sizeVariants = data.sizes
    .map((variant) => ({ size: variant.size.trim(), price: variant.price.trim() }))
    .filter((variant) => variant.size && variant.price)
  const price = sizeVariants.length > 0 ? getListingPrice(sizeVariants, data.price) : data.price

  await db.insert(products).values({
    name: data.name,
    brand: data.brand,
    description: data.description,
    price,
    compareAtPrice,
    category: data.category,
    imageUrl: imageData.imageUrl,
    images: imageData.images,
    sizes: serializeProductSizeVariants(sizeVariants),
    relatedProductIds: serializeRelatedProductIds(data.relatedProductIds ?? []),
    fragranceNotes: serializeFragranceNotes(data.fragranceNotes ?? []),
    composition: serializePerfumeComposition(
      data.composition ?? { tete: [], coeur: [], fond: [] },
    ),
    wearMoments: serializeWearMoments(data.wearMoments ?? []),
    intensity: data.intensity?.trim() || null,
    sex: data.sex?.trim() || null,
    inStock: data.inStock,
    featured: data.featured,
    newArrival: data.newArrival,
    published: data.published,
    promoTagEnabled: data.promoTagEnabled ?? false,
    promoTagLabel: data.promoTagLabel?.trim() || 'Promotion',
    promoTagBgColor: data.promoTagBgColor || '#c81e1e',
    promoTagTextColor: data.promoTagTextColor || '#ffffff',
  })
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
  revalidateProductCaches()
}

export async function updateProduct(
  id: number,
  data: {
    name?: string
    brand?: string
    description?: string
    price?: string
    compareAtPrice?: string | null
    category?: string
    images?: string[]
    sizes?: { size: string; price: string }[]
    relatedProductIds?: number[]
    fragranceNotes?: string[]
    composition?: PerfumeComposition
    wearMoments?: string[]
    intensity?: string | null
    sex?: string | null
    inStock?: boolean
    featured?: boolean
    newArrival?: boolean
    published?: boolean
    promoTagEnabled?: boolean
    promoTagLabel?: string
    promoTagBgColor?: string
    promoTagTextColor?: string
  },
) {
  await requireAdminId()
  const updateData: Record<string, unknown> = { updatedAt: new Date() }

  if (data.name !== undefined) updateData.name = data.name
  if (data.brand !== undefined) updateData.brand = data.brand
  if (data.description !== undefined) updateData.description = data.description
  if (data.category !== undefined) updateData.category = data.category
  if (data.inStock !== undefined) updateData.inStock = data.inStock
  if (data.featured !== undefined) updateData.featured = data.featured
  if (data.newArrival !== undefined) updateData.newArrival = data.newArrival
  if (data.published !== undefined) updateData.published = data.published
  if (data.promoTagEnabled !== undefined) updateData.promoTagEnabled = data.promoTagEnabled
  if (data.promoTagLabel !== undefined) {
    updateData.promoTagLabel = data.promoTagLabel.trim() || 'Promotion'
  }
  if (data.promoTagBgColor !== undefined) updateData.promoTagBgColor = data.promoTagBgColor
  if (data.promoTagTextColor !== undefined) updateData.promoTagTextColor = data.promoTagTextColor

  if (data.relatedProductIds) {
    updateData.relatedProductIds = serializeRelatedProductIds(data.relatedProductIds)
  }
  if (data.fragranceNotes) {
    updateData.fragranceNotes = serializeFragranceNotes(data.fragranceNotes)
  }
  if (data.composition) {
    updateData.composition = serializePerfumeComposition(data.composition)
  }
  if (data.wearMoments) {
    updateData.wearMoments = serializeWearMoments(data.wearMoments)
  }
  if ('intensity' in data) {
    updateData.intensity = data.intensity?.trim() || null
  }
  if ('sex' in data) {
    updateData.sex = data.sex?.trim() || null
  }
  if (data.images) {
    const imageData = normalizeProductImages(data.images)
    updateData.images = imageData.images
    updateData.imageUrl = imageData.imageUrl
  }
  if ('compareAtPrice' in data) {
    updateData.compareAtPrice = data.compareAtPrice?.trim() || null
  }

  if (data.sizes) {
    const sizeVariants = data.sizes
      .map((variant) => ({ size: variant.size.trim(), price: variant.price.trim() }))
      .filter((variant) => variant.size && variant.price)
    updateData.sizes = serializeProductSizeVariants(sizeVariants)
    updateData.price =
      sizeVariants.length > 0
        ? getListingPrice(sizeVariants, data.price ?? '0')
        : data.price
  } else if (data.price !== undefined) {
    updateData.price = data.price
  }

  await db.update(products).set(updateData).where(eq(products.id, id))
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
  revalidateProductCaches(id)
  revalidateProductPage(id)
}

export async function deleteProduct(id: number) {
  await requireAdminId()
  await db.delete(products).where(eq(products.id, id))
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
  revalidateProductCaches(id)
  revalidateProductPage(id)
}
