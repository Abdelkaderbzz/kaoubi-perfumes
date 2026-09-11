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

/** Defaults match the homepage campaign slides (lead photo first). */
export const DEFAULT_HERO_IMAGES: HeroImageSlot[] = [
  {
    slot: 0,
    imageUrl: '/hero/boutique-stand.webp',
    alt: 'KAOUBI PERFUMES au salon, equipe et produits',
    label: 'Salon',
    shape: 'wide',
    position: 'Diapositive 1 — maison',
    objectPosition: 'center 38%',
  },
  {
    slot: 1,
    imageUrl: '/hero/boutique-counter-v2.webp',
    alt: 'Comptoir Chanel de la boutique KAOUBI PERFUMES a Douz',
    label: 'Comptoir',
    shape: 'wide',
    position: 'Diapositive 2 — accueil',
    objectPosition: 'center 48%',
  },
  {
    slot: 2,
    imageUrl: '/hero/boutique-arches.png',
    alt: 'Rayonnages roses de la boutique KAOUBI PERFUMES',
    label: 'Rayonnages',
    shape: 'wide',
    position: 'Diapositive 3 — collection',
    objectPosition: 'center center',
  },
  {
    slot: 3,
    imageUrl: '/hero/boutique-signature.webp',
    alt: 'Mur logo KAOUBI PERFUMES, flacons dorees et brumes a Douz',
    label: 'Vue principale',
    shape: 'wide',
    position: 'Diapositive 4 — mur signature',
    objectPosition: 'center 22%',
  },
]

const LEGACY_HERO_URLS: Record<string, string> = {
  '/hero/boutique-arches.webp': '/hero/boutique-arches.png',
  '/hero/boutique-counter.webp': '/hero/boutique-counter-v2.webp',
  '/hero/boutique-logo-wall.webp': '/hero/boutique-stand.webp',
}

export function mergeHeroImages(
  rows: { slot: number; imageUrl: string; alt: string }[],
): HeroImageSlot[] {
  const bySlot = new Map(rows.map((row) => [row.slot, row]))

  return DEFAULT_HERO_IMAGES.map((fallback) => {
    const row = bySlot.get(fallback.slot)
    if (!row?.imageUrl) return fallback
    const imageUrl = LEGACY_HERO_URLS[row.imageUrl] ?? row.imageUrl
    return {
      ...fallback,
      imageUrl,
      alt: row.alt?.trim() || fallback.alt,
    }
  })
}
