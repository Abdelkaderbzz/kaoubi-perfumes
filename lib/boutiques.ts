import type { Locale } from '@/lib/i18n'
import { TUNISIA_GOVERNORATES } from '@/lib/tunisia-governorates'

/** A boutique as the storefront consumes it, mapped from the database row. */
export type Boutique = {
  id: number
  slug: string
  name: string
  city: string
  region: string
  description: string
  image: string | null
  imageAlt: string
  address: string | null
  phone: string | null
  rating: number | null
  reviewCount: number | null
  ratingSource: string
  directionsUrl: string
  pickupEnabled: boolean
  /** Open on the storefront. Unpublished shops stay in admin only. */
  published: boolean
}

/** A pickup point offered at checkout. */
export type PickupBoutique = {
  id: number
  name: string
  city: string
  region: string
  address: string | null
  phone: string | null
}

/** Arabic storefront copy for boutique fields that live as French in the DB. */
const BOUTIQUE_AR: Record<
  string,
  Partial<Pick<Boutique, 'city' | 'region' | 'description' | 'address'>>
> = {
  'douz-kebili': {
    city: 'دوز',
    region: 'دوز الشمالية',
    description:
      'متجرنا في دوز، قبلي. تلقاو فيه كامل المجموعة للنساء والرجال، مع نصيحة ومرافقة شخصية على عين المكان.',
    address: 'نهج الحبيب بورقيبة، دوز الشمالية، دوز، قبلي، 4260',
  },
  'moknine-monastir': {
    city: 'المكنين',
    region: 'المنستير',
    description: '',
    address: null,
  },
}

const CITY_AR_EXTRA: Record<string, string> = {
  Douz: 'دوز',
  'Douz Nord': 'دوز الشمالية',
  'Kébili': 'قبلي',
  Kebili: 'قبلي',
  Moknine: 'المكنين',
  Monastir: 'المنستير',
  Sahloul: 'سهلول',
}

function cityInArabic(city: string) {
  const fromExtra = CITY_AR_EXTRA[city]
  if (fromExtra) return fromExtra
  const governorate = TUNISIA_GOVERNORATES.find(
    (g) => g.name.toLowerCase() === city.toLowerCase(),
  )
  return governorate?.nameAr ?? city
}

/** Localize boutique display fields for the active storefront locale. */
export function localizeBoutique<T extends Pick<Boutique, 'slug' | 'city' | 'region' | 'description' | 'address'>>(
  boutique: T,
  locale: Locale,
): T {
  if (locale !== 'ar') return boutique
  const override = BOUTIQUE_AR[boutique.slug]
  return {
    ...boutique,
    city: override?.city ?? cityInArabic(boutique.city),
    region: override?.region ?? cityInArabic(boutique.region),
    description: override?.description ?? boutique.description,
    address: override?.address ?? boutique.address,
  }
}

/** Display number -> tel: href (Tunisian mobile, no spaces). */
export function phoneHref(phone: string) {
  return `tel:+216${phone.replace(/\s+/g, '')}`
}

export function boutiqueLabel(boutique: Pick<PickupBoutique, 'city' | 'region'>) {
  return boutique.region && boutique.region !== boutique.city
    ? `${boutique.city} — ${boutique.region}`
    : boutique.city
}

export function slugifyBoutique(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}
