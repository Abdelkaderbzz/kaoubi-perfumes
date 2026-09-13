'use server'

import { requireAdminId } from '@/lib/admin-auth'
import { slugifyBoutique, type Boutique, type PickupBoutique } from '@/lib/boutiques'
import { STORE_MAPS_URL } from '@/lib/contact'
import { db } from '@/lib/db'
import { boutiques } from '@/lib/db/schema'
import type { BoutiqueFormValues } from '@/lib/validations'
import { and, asc, eq, ne, sql } from 'drizzle-orm'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

type BoutiqueRow = typeof boutiques.$inferSelect

export type BoutiqueActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

const LEGACY_MAPS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=Rue+de+Habib+Bourguiba%2C+Douz+Nord%2C+Douz%2C+Kebili%2C+Tunisia+4260'

function toBoutique(row: BoutiqueRow): Boutique {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    region: row.region,
    description: row.description,
    image: row.imageUrl,
    imageAlt: row.imageAlt,
    address: row.address,
    phone: row.phone,
    rating: row.rating == null ? null : parseFloat(row.rating),
    reviewCount: row.reviewCount,
    ratingSource: row.ratingSource,
    directionsUrl:
      !row.directionsUrl || row.directionsUrl === LEGACY_MAPS_URL
        ? STORE_MAPS_URL
        : row.directionsUrl,
    pickupEnabled: row.pickupEnabled,
    published: row.published,
  }
}

function revalidateBoutiques() {
  revalidateTag('boutiques', 'max')
  revalidatePath('/')
  revalidatePath('/checkout')
  revalidatePath('/admin/boutiques')
}

const orderedBoutiques = [asc(boutiques.sortOrder), asc(boutiques.name)] as const

const getStorefrontBoutiquesCached = unstable_cache(
  async () =>
    db.select().from(boutiques).where(eq(boutiques.published, true)).orderBy(...orderedBoutiques),
  ['storefront-boutiques', 'v3'],
  { revalidate: 300, tags: ['boutiques'] },
)

/** Homepage boutiques section: open shops only. */
export async function getBoutiques(): Promise<Boutique[]> {
  const rows = await getStorefrontBoutiquesCached()
  return rows.map(toBoutique)
}

const getPickupBoutiquesCached = unstable_cache(
  async () =>
    db
      .select({
        id: boutiques.id,
        name: boutiques.name,
        city: boutiques.city,
        region: boutiques.region,
        address: boutiques.address,
        phone: boutiques.phone,
      })
      .from(boutiques)
      .where(and(eq(boutiques.published, true), eq(boutiques.pickupEnabled, true)))
      .orderBy(...orderedBoutiques),
  ['pickup-boutiques', 'v2'],
  { revalidate: 300, tags: ['boutiques'] },
)

/** Pickup points offered at checkout. */
export async function getPickupBoutiques(): Promise<PickupBoutique[]> {
  return getPickupBoutiquesCached()
}

export async function getAdminBoutiques() {
  await requireAdminId()
  return db.select().from(boutiques).orderBy(...orderedBoutiques)
}

function toRowValues(data: BoutiqueFormValues) {
  return {
    name: data.name.trim(),
    city: data.city.trim(),
    region: data.region.trim(),
    description: data.description.trim(),
    imageUrl: data.imageUrl.trim() || null,
    imageAlt: data.imageAlt.trim(),
    address: data.address.trim() || null,
    phone: data.phone.trim() || null,
    rating: data.rating.trim() === '' ? null : parseFloat(data.rating).toFixed(1),
    reviewCount: data.reviewCount.trim() === '' ? null : Number(data.reviewCount),
    ratingSource: data.ratingSource.trim() || 'Google Maps',
    directionsUrl: data.directionsUrl.trim(),
    pickupEnabled: data.pickupEnabled,
    published: data.published,
  }
}

async function resolveSlug(data: BoutiqueFormValues, excludeId?: number) {
  const base = slugifyBoutique(data.slug || `${data.name} ${data.city}`)
  if (!base) return null

  const clash = await db
    .select({ id: boutiques.id })
    .from(boutiques)
    .where(excludeId ? and(eq(boutiques.slug, base), ne(boutiques.id, excludeId)) : eq(boutiques.slug, base))
    .limit(1)

  return clash.length > 0 ? `${base}-${Date.now().toString(36).slice(-4)}` : base
}

export async function addBoutique(
  data: BoutiqueFormValues,
): Promise<BoutiqueActionResult<BoutiqueRow>> {
  try {
    await requireAdminId()

    const slug = await resolveSlug(data)
    if (!slug) {
      return { success: false, error: 'Nom de boutique invalide.' }
    }

    const [counts] = await db
      .select({ nextOrder: sql<number>`coalesce(max(${boutiques.sortOrder}), -1) + 1` })
      .from(boutiques)

    const [row] = await db
      .insert(boutiques)
      .values({ ...toRowValues(data), slug, sortOrder: counts?.nextOrder ?? 0 })
      .returning()

    revalidateBoutiques()
    return { success: true, data: row }
  } catch {
    return { success: false, error: "Impossible d'ajouter la boutique." }
  }
}

export async function updateBoutique(
  id: number,
  data: BoutiqueFormValues,
): Promise<BoutiqueActionResult<BoutiqueRow>> {
  try {
    await requireAdminId()

    const slug = await resolveSlug(data, id)
    if (!slug) {
      return { success: false, error: 'Nom de boutique invalide.' }
    }

    const [row] = await db
      .update(boutiques)
      .set({ ...toRowValues(data), slug, updatedAt: new Date() })
      .where(eq(boutiques.id, id))
      .returning()

    if (!row) {
      return { success: false, error: 'Boutique introuvable.' }
    }

    revalidateBoutiques()
    return { success: true, data: row }
  } catch {
    return { success: false, error: 'Impossible de modifier la boutique.' }
  }
}

export async function deleteBoutique(id: number): Promise<BoutiqueActionResult> {
  try {
    await requireAdminId()

    const [row] = await db.delete(boutiques).where(eq(boutiques.id, id)).returning({ id: boutiques.id })
    if (!row) {
      return { success: false, error: 'Boutique introuvable.' }
    }

    revalidateBoutiques()
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Impossible de supprimer la boutique.' }
  }
}

export async function moveBoutique(
  id: number,
  direction: 'up' | 'down',
): Promise<BoutiqueActionResult> {
  try {
    await requireAdminId()

    const rows = await db.select().from(boutiques).orderBy(...orderedBoutiques)
    const index = rows.findIndex((row) => row.id === id)
    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || swapWith < 0 || swapWith >= rows.length) {
      return { success: true, data: undefined }
    }

    // sortOrder may contain duplicates from seeding, so rewrite the whole list.
    const reordered = [...rows]
    ;[reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]]

    await Promise.all(
      reordered.map((row, position) =>
        db.update(boutiques).set({ sortOrder: position }).where(eq(boutiques.id, row.id)),
      ),
    )

    revalidateBoutiques()
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Impossible de reordonner les boutiques.' }
  }
}
