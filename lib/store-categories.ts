import { defaultLocale, getDictionary, type Locale } from '@/lib/i18n'

export type StoreCategory = {
  slug: string
  name: string
  tagline: string
  image: string
}

export const STORE_CATEGORIES: StoreCategory[] = [
  {
    slug: 'parfum',
    name: 'Parfum',
    tagline: 'Extrait de parfum, concentration et tenue maximales',
    image: '/products/bleu-chanel.webp',
  },
  {
    slug: 'eau-de-parfum',
    name: 'Eau de Parfum',
    tagline: 'Nos fragrances signature, pour elle et pour lui',
    image: '/products/baccarat-rouge-540.webp',
  },
  {
    slug: 'eau-de-ligne',
    name: 'Eau de Ligne',
    tagline: 'Brume de linge et de maison',
    image: '/products/oudy-eau-de-ligne.jpg',
  },
  {
    slug: 'body-mist',
    name: 'Body Mist',
    tagline: 'Brume corporelle legere',
    image: '/products/lavendarine-body-mist.jpg',
  },
  {
    slug: 'body-shimmer',
    name: 'Body Shimmer',
    tagline: 'Brume corporelle scintillante',
    image: '/products/body-shimmer.webp',
  },
  {
    slug: 'mkhamaria',
    name: 'Mkhamaria',
    tagline: 'Soin exfoliant et parfume pour le corps',
    image: '/products/mkhamaria-lavendarine.jpg',
  },
  {
    slug: 'enfant',
    name: 'Enfant',
    tagline: 'Fragrances douces pour enfants',
    image: '/hero/boutique-cosmetic.webp',
  },
  {
    slug: 'soins',
    name: 'Soins',
    tagline: 'Cremes, gels et cosmetiques MRAZIG',
    image: '/products/gel-nettoyant-v2.webp',
  },
  {
    slug: 'bakhoor',
    name: 'Bakhoor',
    tagline: 'Encens Mrazig traditionnel',
    image: '/products/bakhoor-maryam.webp',
  },
]

/** Seasonal collections that should not appear in nav, homepage, or filters. */
export const HIDDEN_CATEGORY_SLUGS = new Set(['sif', 'chta'])

/** Older slugs that should resolve to a current store category. Kept empty
 *  for now — categories used to double as gender (femme/homme/mixte), which
 *  moved to the separate `sex` field instead of aliasing to a category. */
export const CATEGORY_SLUG_ALIASES: Record<string, string> = {}

export function canonicalCategorySlug(slug: string) {
  return CATEGORY_SLUG_ALIASES[slug] ?? slug
}

export function categoryFilterSlugs(slug: string) {
  const canonical = canonicalCategorySlug(slug)
  const aliases = Object.entries(CATEGORY_SLUG_ALIASES)
    .filter(([, target]) => target === canonical)
    .map(([alias]) => alias)
  return [canonical, ...aliases]
}

/** @deprecated Prefer getHeroImages() from app/actions/hero — kept for showcase gallery refs. */
export const HERO_IMAGES = [
  { src: '/hero/boutique-counter-v2.webp', alt: 'Comptoir KAOUBI PERFUMES' },
  { src: '/hero/boutique-arches.png', alt: 'Rayonnages de la boutique KAOUBI PERFUMES' },
  { src: '/hero/boutique-signature.webp', alt: 'Mur logo de la boutique KAOUBI PERFUMES' },
  { src: '/hero/boutique-cosmetic.webp', alt: 'Univers cosmetique KAOUBI PERFUMES' },
]

export type ShowcaseImage = {
  src: string
  alt: string
  category: string
}

export const SHOWCASE_GALLERY: ShowcaseImage[] = [
  { src: '/hero/dg-devotion.webp', alt: 'Parfum femme', category: 'femme' },
  { src: '/hero/ysl-libre.webp', alt: 'Eau de parfum', category: 'femme' },
  { src: '/hero/campaign-ramadan.webp', alt: 'Collection femme', category: 'femme' },
  { src: '/hero/givenchy-gentleman.webp', alt: 'Parfum homme', category: 'homme' },
  { src: '/hero/boutique-arches.png', alt: 'Boutique KAOUBI PERFUMES', category: 'homme' },
  { src: '/hero/boutique-cosmetic.webp', alt: 'Fragrances KAOUBI PERFUMES', category: 'femme' },
]

export function getShowcaseByCategory(category: string) {
  return SHOWCASE_GALLERY.filter((img) => img.category === category)
}

export function getCategoryBySlug(slug: string) {
  return STORE_CATEGORIES.find((c) => c.slug === canonicalCategorySlug(slug))
}

export type DbCategory = {
  slug: string
  name: string
  bannerUrl?: string | null
}

/** Ready-made translation for a known slug
 *  (femme/homme/mixte/enfant/soins/bakhoor), or undefined for a custom
 *  category an admin added — those just render whatever the admin typed. */
function localizedCategoryText(slug: string, locale: Locale) {
  const table = getDictionary(locale).categories as
    | Record<string, { name: string; tagline: string } | undefined>
    | undefined
  return table?.[canonicalCategorySlug(slug)] ?? table?.[slug]
}

/** Category names/taglines are admin-edited DB text, so in French (the
 *  default) the DB value always wins — that's what the admin typed. In
 *  Arabic there's no DB column for it, so known slugs get overridden with
 *  the fixed translation above; anything else falls back to the DB text. */
export function mergeStoreCategories(
  dbCategories: DbCategory[],
  locale: Locale = defaultLocale,
): StoreCategory[] {
  const dbBySlug = new Map(
    dbCategories.map((category) => [canonicalCategorySlug(category.slug), category]),
  )
  const arabic = locale === 'ar'

  return STORE_CATEGORIES.map((category) => {
    const fromDb = dbBySlug.get(category.slug)
    const translated = arabic ? localizedCategoryText(category.slug, 'ar') : undefined
    return {
      ...category,
      name: translated?.name ?? fromDb?.name ?? category.name,
      tagline: translated?.tagline ?? category.tagline,
      image: fromDb?.bannerUrl ?? category.image,
    }
  })
}

export function getMergedCategoryBySlug(
  slug: string,
  dbCategories: DbCategory[],
  locale: Locale = defaultLocale,
) {
  const canonical = canonicalCategorySlug(slug)
  return mergeStoreCategories(dbCategories, locale).find((category) => category.slug === canonical)
}

export function getCategoryLabel(
  slug: string,
  categories?: { slug: string; name: string }[],
  locale: Locale = defaultLocale,
) {
  if (locale === 'ar') {
    const translated = localizedCategoryText(slug, 'ar')
    if (translated) return translated.name
  }
  const canonical = canonicalCategorySlug(slug)
  const fromDb = categories?.find((c) => canonicalCategorySlug(c.slug) === canonical)
  if (fromDb) return fromDb.name
  return getCategoryBySlug(canonical)?.name ?? slug
}
