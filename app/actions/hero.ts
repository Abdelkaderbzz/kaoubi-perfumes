'use server'

import { requireAdminId } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { heroImages } from '@/lib/db/schema'
import { DEFAULT_HERO_IMAGES, HERO_SLOT_COUNT, mergeHeroImages, type HeroImageSlot } from '@/lib/hero-images'
import { asc } from 'drizzle-orm'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'

export type HeroActionResult =
  | { success: true; images: HeroImageSlot[] }
  | { success: false; error: string }

async function listHeroRows() {
  return db.select().from(heroImages).orderBy(asc(heroImages.slot))
}

async function revalidateHeroPaths() {
  revalidateTag('hero-images', 'max')
  revalidatePath('/admin/hero')
  revalidatePath('/')
}

const getHeroImagesCached = unstable_cache(
  async () => mergeHeroImages(await listHeroRows()),
  ['hero-images', 'v14'],
  { revalidate: 300, tags: ['hero-images'] },
)

export async function getHeroImages(): Promise<HeroImageSlot[]> {
  return getHeroImagesCached()
}

export async function getAdminHeroImages(): Promise<HeroImageSlot[]> {
  await requireAdminId()
  return mergeHeroImages(await listHeroRows())
}

export async function updateHeroImage(
  slot: number,
  data: { imageUrl: string; alt?: string },
): Promise<HeroActionResult> {
  try {
    await requireAdminId()

    if (!Number.isInteger(slot) || slot < 0 || slot >= HERO_SLOT_COUNT) {
      return { success: false, error: 'Emplacement invalide.' }
    }

    const imageUrl = data.imageUrl.trim()
    if (!imageUrl) {
      return { success: false, error: 'Image requise.' }
    }

    const fallback = DEFAULT_HERO_IMAGES[slot]
    const alt = data.alt?.trim() || fallback.alt

    await db
      .insert(heroImages)
      .values({
        slot,
        imageUrl,
        alt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: heroImages.slot,
        set: {
          imageUrl,
          alt,
          updatedAt: new Date(),
        },
      })

    await revalidateHeroPaths()
    return { success: true, images: mergeHeroImages(await listHeroRows()) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Impossible d'enregistrer l image.",
    }
  }
}

export async function resetHeroImage(slot: number): Promise<HeroActionResult> {
  try {
    await requireAdminId()

    if (!Number.isInteger(slot) || slot < 0 || slot >= HERO_SLOT_COUNT) {
      return { success: false, error: 'Emplacement invalide.' }
    }

    const fallback = DEFAULT_HERO_IMAGES[slot]
    await db
      .insert(heroImages)
      .values({
        slot,
        imageUrl: fallback.imageUrl,
        alt: fallback.alt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: heroImages.slot,
        set: {
          imageUrl: fallback.imageUrl,
          alt: fallback.alt,
          updatedAt: new Date(),
        },
      })

    await revalidateHeroPaths()
    return { success: true, images: mergeHeroImages(await listHeroRows()) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Impossible de restaurer l image.",
    }
  }
}
