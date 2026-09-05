import { getDictionary, type Locale } from '@/lib/i18n'

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
]

/** @deprecated Prefer getHeroImages() from app/actions/hero — kept for showcase gallery refs. */
export const HERO_IMAGES = [
  { src: '/hero/campaign-ramadan.webp', alt: 'Campagne Water of Gold' },
  { src: '/hero/boutique-shelves.webp', alt: 'Boutique Water of Gold' },
  { src: '/hero/lifestyle-signature.webp', alt: 'Parfum signature' },
  { src: '/hero/gold-bottles.webp', alt: 'Selection Water of Gold' },
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
  { src: '/hero/boutique-shelves.webp', alt: 'Boutique Water of Gold', category: 'homme' },
  { src: '/hero/gold-bottles.webp', alt: 'Fragrances Water of Gold', category: 'femme' },
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

/** Ready-made translation for a known slug (femme/homme/unisexe/chta/sif), or
 *  undefined for a custom category an admin added — those just render
 *  whatever the admin typed, in whichever language they typed it. */
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
export function mergeStoreCategories(dbCategories: DbCategory[], locale: Locale = 'fr'): StoreCategory[] {
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
    .filter((category) => !STORE_CATEGORIES.some((item) => item.slug === category.slug))
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

export function getMergedCategoryBySlug(slug: string, dbCategories: DbCategory[], locale: Locale = 'fr') {
  return mergeStoreCategories(dbCategories, locale).find((category) => category.slug === slug)
}

export function getCategoryLabel(
  slug: string,
  categories?: { slug: string; name: string }[],
  locale: Locale = 'fr',
) {
  if (locale === 'ar') {
    const translated = localizedCategoryText(slug, 'ar')
    if (translated) return translated.name
  }
  const fromDb = categories?.find((c) => c.slug === slug)
  if (fromDb) return fromDb.name
  return getCategoryBySlug(slug)?.name ?? slug
}
