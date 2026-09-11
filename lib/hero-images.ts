export const HERO_SLOT_COUNT = 4

export type HeroImageSlot = {
  slot: number
  imageUrl: string
  alt: string
  /** Short label for admin UI */
  label: string
  /** Aspect hint shown in admin */
  shape: 'tall' | 'square'
  position: string
}

/** Defaults match the homepage collage layout (top-left, top-right, bottom-left, bottom-right). */
export const DEFAULT_HERO_IMAGES: HeroImageSlot[] = [
  {
    slot: 0,
    imageUrl: '/hero/boutique-arches.webp',
    alt: 'Rayonnages de la boutique KAOUBI PERFUMES',
    label: 'Haut gauche',
    shape: 'tall',
    position: 'Colonne gauche, image haute',
  },
  {
    slot: 1,
    imageUrl: '/hero/boutique-cosmetic.webp',
    alt: 'Espace cosmetique KAOUBI PERFUMES',
    label: 'Haut droite',
    shape: 'square',
    position: 'Colonne droite, image carree',
  },
  {
    slot: 2,
    imageUrl: '/hero/boutique-counter.webp',
    alt: 'Comptoir de la boutique KAOUBI PERFUMES',
    label: 'Bas gauche',
    shape: 'square',
    position: 'Colonne gauche, image carree',
  },
  {
    slot: 3,
    imageUrl: '/hero/boutique-logo-wall.webp',
    alt: 'Boutique KAOUBI PERFUMES a Douz',
    label: 'Bas droite',
    shape: 'tall',
    position: 'Colonne droite, image haute',
  },
]

export function mergeHeroImages(
  rows: { slot: number; imageUrl: string; alt: string }[],
): HeroImageSlot[] {
  const bySlot = new Map(rows.map((row) => [row.slot, row]))

  return DEFAULT_HERO_IMAGES.map((fallback) => {
    const row = bySlot.get(fallback.slot)
    if (!row?.imageUrl) return fallback
    return {
      ...fallback,
      imageUrl: row.imageUrl,
      alt: row.alt?.trim() || fallback.alt,
    }
  })
}
