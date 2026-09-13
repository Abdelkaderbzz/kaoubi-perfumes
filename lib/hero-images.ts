export const HERO_SLOT_COUNT = 4

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

/** Defaults match the homepage editorial mosaic (top-left first). */
export const DEFAULT_HERO_IMAGES: HeroImageSlot[] = [
  {
    slot: 0,
    imageUrl: '/hero/boutique-counter-v2.webp',
    alt: 'Comptoir Chanel de la boutique KAOUBI PERFUMES a Douz',
    label: 'Comptoir',
    shape: 'square',
    position: 'Haut gauche',
    objectPosition: 'center 48%',
  },
  {
    slot: 1,
    imageUrl: '/hero/boutique-arches.png',
    alt: 'Rayonnages roses de la boutique KAOUBI PERFUMES',
    label: 'Rayonnages',
    shape: 'square',
    position: 'Haut droite',
    objectPosition: 'center center',
  },
  {
    slot: 2,
    imageUrl: '/hero/boutique-signature.webp',
    alt: 'Mur logo KAOUBI PERFUMES, flacons dorees et brumes a Douz',
    label: 'Mur signature',
    shape: 'square',
    position: 'Bas gauche',
    objectPosition: 'center 22%',
  },
  {
    slot: 3,
    imageUrl: '/hero/boutique-cosmetic.webp',
    alt: 'Univers cosmetique de la boutique KAOUBI PERFUMES',
    label: 'Cosmetique',
    shape: 'square',
    position: 'Bas droite',
    objectPosition: 'center 35%',
  },
]

const LEGACY_HERO_URLS: Record<string, string> = {
  '/hero/boutique-arches.webp': '/hero/boutique-arches.png',
  '/hero/boutique-counter.webp': '/hero/boutique-counter-v2.webp',
}

const REMOVED_HERO_URLS = new Set(['/hero/boutique-stand.webp', '/hero/boutique-logo-wall.webp'])

export function mergeHeroImages(
  rows: { slot: number; imageUrl: string; alt: string }[],
): HeroImageSlot[] {
  const usable = rows
    .map((row) => ({
      ...row,
      imageUrl: LEGACY_HERO_URLS[row.imageUrl] ?? row.imageUrl,
    }))
    .filter((row) => row.imageUrl && !REMOVED_HERO_URLS.has(row.imageUrl))

  const used = new Set<string>()

  return DEFAULT_HERO_IMAGES.map((fallback, index) => {
    const row =
      usable.find((item) => item.imageUrl === fallback.imageUrl && !used.has(item.imageUrl)) ??
      usable.find((item) => item.slot === fallback.slot && !used.has(item.imageUrl)) ??
      usable.find((item) => item.slot === fallback.slot + 1 && !used.has(item.imageUrl))

    if (!row?.imageUrl) return { ...fallback, slot: index }

    used.add(row.imageUrl)
    return {
      ...fallback,
      slot: index,
      imageUrl: row.imageUrl,
      alt: row.alt?.trim() || fallback.alt,
    }
  })
}
