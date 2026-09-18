/** The homepage hero shows a single campaign photo. It used to be a 4-tile
 *  mosaic, so merge/migration code still has to cope with rows for slots 1–3. */
export const HERO_SLOT_COUNT = 1

export type HeroImageSlot = {
  slot: number
  imageUrl: string
  alt: string
  /** Short label for admin UI */
  label: string
  /** Aspect hint shown in admin */
  shape: 'wide' | 'tall' | 'square'
  position: string
  /** CSS object-position for the campaign crop */
  objectPosition?: string
}

export const DEFAULT_HERO_IMAGES: HeroImageSlot[] = [
  {
    slot: 0,
    imageUrl: '/hero/boutique-counter-v2.webp',
    alt: 'Comptoir Chanel de la boutique KAOUBI PERFUMES a Douz',
    label: 'Photo hero',
    shape: 'wide',
    position: 'Page d accueil',
    objectPosition: 'center 48%',
  },
]

const LEGACY_HERO_URLS: Record<string, string> = {
  '/hero/boutique-arches.webp': '/hero/boutique-arches.png',
  '/hero/boutique-counter.webp': '/hero/boutique-counter-v2.webp',
}

const REMOVED_HERO_URLS = new Set(['/hero/boutique-stand.webp', '/hero/boutique-logo-wall.webp'])

/** Slot 0 wins. When only leftover mosaic rows survive (slots 1–3), the first
 *  usable one is promoted so the hero never falls back to a stale default. */
export function mergeHeroImages(
  rows: { slot: number; imageUrl: string; alt: string }[],
): HeroImageSlot[] {
  const usable = rows
    .map((row) => ({
      ...row,
      imageUrl: LEGACY_HERO_URLS[row.imageUrl] ?? row.imageUrl,
    }))
    .filter((row) => row.imageUrl && !REMOVED_HERO_URLS.has(row.imageUrl))
    .sort((a, b) => a.slot - b.slot)

  return DEFAULT_HERO_IMAGES.map((fallback, index) => {
    const row = usable.find((item) => item.slot === fallback.slot) ?? usable[index]
    if (!row?.imageUrl) return { ...fallback, slot: index }

    return {
      ...fallback,
      slot: index,
      imageUrl: row.imageUrl,
      alt: row.alt?.trim() || fallback.alt,
    }
  })
}
