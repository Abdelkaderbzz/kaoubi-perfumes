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
    imageUrl: '/hero/campaign-ramadan.webp',
    alt: 'Campagne Water of Gold',
    label: 'Haut gauche',
    shape: 'tall',
    position: 'Colonne gauche, image haute',
  },
  {
    slot: 1,
    imageUrl: '/hero/boutique-shelves.webp',
    alt: 'Boutique Water of Gold',
    label: 'Haut droite',
    shape: 'square',
    position: 'Colonne droite, image carree',
  },
  {
    slot: 2,
    imageUrl: '/hero/lifestyle-signature.webp',
    alt: 'Parfum signature Water of Gold',
    label: 'Bas gauche',
    shape: 'square',
    position: 'Colonne gauche, image carree',
  },
  {
    slot: 3,
    imageUrl: '/hero/gold-bottles.webp',
    alt: 'Selection Water of Gold',
    label: 'Bas droite',
    shape: 'tall',
    position: 'Colonne droite, image haute',
  },
]

const DEFAULT_HERO_PATHS = new Set(DEFAULT_HERO_IMAGES.map((image) => image.imageUrl))

/** Local collage files shipped in public/hero, or a Cloudinary upload for this project. */
function isUsableHeroUrl(url: string) {
  if (DEFAULT_HERO_PATHS.has(url)) return true
  return url.startsWith('https://res.cloudinary.com/')
}

export function mergeHeroImages(
  rows: { slot: number; imageUrl: string; alt: string }[],
): HeroImageSlot[] {
  const bySlot = new Map(rows.map((row) => [row.slot, row]))

  return DEFAULT_HERO_IMAGES.map((fallback) => {
    const row = bySlot.get(fallback.slot)
    if (!row?.imageUrl || !isUsableHeroUrl(row.imageUrl)) return fallback
    return {
      ...fallback,
      imageUrl: row.imageUrl,
      alt: row.alt?.trim() || fallback.alt,
    }
  })
}
