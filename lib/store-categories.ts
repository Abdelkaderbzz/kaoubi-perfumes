import { defaultLocale, getDictionary, type Locale } from '@/lib/i18n'

export type StoreCategory = {
  slug: string
  name: string
  tagline: string
  image: string
}

export const STORE_CATEGORIES: StoreCategory[] = [
  {
    slug: 'femme',
    name: 'Femme',
    tagline: 'Fragrances feminines de longue tenue',
    image: '/categories/femme.webp',
  },
  {
    slug: 'homme',
    name: 'Homme',
    tagline: 'Fragrances masculines de longue tenue',
    image: '/categories/homme.webp',
  },
  {
    slug: 'soins',
    name: 'Soins',
    tagline: 'Cremes, gels et cosmetiques MRAZIG',
    image: '/products/creme-mains.webp',
  },
  {
    slug: 'bakhoor',
    name: 'Bakhoor',
    tagline: 'Encens Mrazig traditionnel',
    image: '/products/bakhoor-mrazig.webp',
  },
]

/** Seasonal collections that should not appear in nav, homepage, or filters. */
export const HIDDEN_CATEGORY_SLUGS = new Set(['sif', 'chta'])

/** @deprecated Prefer getHeroImages() from app/actions/hero — kept for showcase gallery refs. */
export const HERO_IMAGES = [
  { src: '/hero/boutique-stand.webp', alt: 'Boutique KAOUBI PERFUMES' },
  { src: '/hero/boutique-counter-v2.webp', alt: 'Comptoir KAOUBI PERFUMES' },
  { src: '/hero/boutique-arches.png', alt: 'Rayonnages de la boutique KAOUBI PERFUMES' },
  { src: '/hero/boutique-signature.webp', alt: 'Mur logo de la boutique KAOUBI PERFUMES' },
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
  return STORE_CATEGORIES.find((c) => c.slug === slug)
}

export type DbCategory = {
  slug: string
  name: string
  bannerUrl?: string | null
}

/** Ready-made translation for a known slug
 *  (femme/homme/unisexe/soins/bakhoor), or undefined for a custom
 *  category an admin added — those just render whatever the admin typed. */
function localizedCategoryText(slug: string, locale: Locale) {
  const table = getDictionary(locale).categories as
    | Record<string, { name: string; tagline: string } | undefined>
    | undefined
  return table?.[slug]
}

/** Category names/taglines are admin-edited DB text, so in French (the
 *  default) the DB value always wins — that's what the admin typed. In
 *  Arabic there's no DB column for it, so known slugs get overridden with
 *  the fixed translation above; anything else falls back to the DB text. */
export function mergeStoreCategories(
  dbCategories: DbCategory[],
  locale: Locale = defaultLocale,
): StoreCategory[] {
  const dbBySlug = new Map(dbCategories.map((category) => [category.slug, category]))
  const arabic = locale === 'ar'

  const fromDefaults = STORE_CATEGORIES.map((category) => {
    const fromDb = dbBySlug.get(category.slug)
    const translated = arabic ? localizedCategoryText(category.slug, 'ar') : undefined
    return {
      ...category,
      name: translated?.name ?? fromDb?.name ?? category.name,
      tagline: translated?.tagline ?? category.tagline,
      image: fromDb?.bannerUrl ?? category.image,
    }
  })

  const extras = dbCategories
    .filter(
      (category) =>
        !HIDDEN_CATEGORY_SLUGS.has(category.slug) &&
        !STORE_CATEGORIES.some((item) => item.slug === category.slug),
    )
    .map((category) => {
      const translated = arabic ? localizedCategoryText(category.slug, 'ar') : undefined
      const frDefault = localizedCategoryText(category.slug, 'fr')
      return {
        slug: category.slug,
        name: translated?.name ?? category.name,
        tagline: translated?.tagline ?? frDefault?.tagline ?? category.name,
        image: category.bannerUrl ?? '',
      }
    })

  return [...fromDefaults, ...extras]
}

export function getMergedCategoryBySlug(
  slug: string,
  dbCategories: DbCategory[],
  locale: Locale = defaultLocale,
) {
  return mergeStoreCategories(dbCategories, locale).find((category) => category.slug === slug)
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
  const fromDb = categories?.find((c) => c.slug === slug)
  if (fromDb) return fromDb.name
  return getCategoryBySlug(slug)?.name ?? slug
}
