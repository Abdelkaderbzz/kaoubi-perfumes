'use server'

import { requireAdminId } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { categories, products } from '@/lib/db/schema'
import { asc, eq, sql } from 'drizzle-orm'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

export type CategoryRow = {
  id: number
  name: string
  slug: string
  bannerUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export type CategoryActionResult =
  | { success: true; category?: CategoryRow }
  | { success: false; error: string }

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function mapCategoryError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const message = error.message
    if (message.includes('23505') || message.toLowerCase().includes('unique')) {
      return 'Ce slug est deja utilise par une autre categorie.'
    }
    if (message.trim()) return message
  }
  return fallback
}

function revalidateCategoryPaths() {
  revalidateTag('categories', 'max')
  revalidatePath('/admin/categories')
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
}

export async function getCategories() {
  return unstable_cache(
    async () => db.select().from(categories).orderBy(asc(categories.name)),
    ['categories-list-v2'],
    { revalidate: 300, tags: ['categories'] },
  )()
}

export async function addCategory(data: {
  name: string
  slug?: string
  bannerUrl?: string | null
}): Promise<CategoryActionResult> {
  try {
    await requireAdminId()

    const name = data.name.trim()
    const slug = data.slug?.trim() || slugify(name)
    if (!name) {
      return { success: false, error: 'Nom requis.' }
    }
    if (!slug) {
      return { success: false, error: 'Nom invalide pour generer un slug.' }
    }

    const [category] = await db
      .insert(categories)
      .values({
        name,
        slug,
        bannerUrl: data.bannerUrl?.trim() || null,
      })
      .returning()

    revalidateCategoryPaths()
    return { success: true, category }
  } catch (error) {
    return { success: false, error: mapCategoryError(error, "Impossible d'ajouter la categorie.") }
  }
}

export async function updateCategory(
  id: number,
  data: { name?: string; slug?: string; bannerUrl?: string | null },
): Promise<CategoryActionResult> {
  try {
    await requireAdminId()

    const [existing] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    if (!existing) {
      return { success: false, error: 'Categorie introuvable.' }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name) updateData.name = data.name.trim()
    if (data.slug) updateData.slug = data.slug.trim()
    if (data.bannerUrl !== undefined) {
      updateData.bannerUrl = data.bannerUrl?.trim() || null
    }

    const [updated] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning()

    if (updated && updated.slug !== existing.slug) {
      await db
        .update(products)
        .set({ category: updated.slug, updatedAt: new Date() })
        .where(eq(products.category, existing.slug))
    }

    revalidateCategoryPaths()
    return { success: true, category: updated }
  } catch (error) {
    return { success: false, error: mapCategoryError(error, 'Impossible de modifier la categorie.') }
  }
}

export async function deleteCategory(id: number): Promise<CategoryActionResult> {
  try {
    await requireAdminId()

    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1)
    if (!category) {
      return { success: false, error: 'Categorie introuvable.' }
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.category, category.slug))

    if (count > 0) {
      return {
        success: false,
        error: `Cette categorie est utilisee par ${count} produit(s). Reassignez ou supprimez ces produits d'abord.`,
      }
    }

    await db.delete(categories).where(eq(categories.id, id))
    revalidateCategoryPaths()
    return { success: true }
  } catch (error) {
    return { success: false, error: mapCategoryError(error, 'Impossible de supprimer la categorie.') }
  }
}
