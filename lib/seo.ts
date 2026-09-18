import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from '@/lib/social-links'
import {
  STORE_ADDRESS,
  STORE_CITY,
  STORE_EMAIL,
  STORE_GOVERNORATE,
  STORE_MAPS_URL,
  STORE_PHONE_E164,
  STORE_POSTAL_CODE,
} from '@/lib/contact'
import { getSiteUrl } from '@/lib/site'
import { parsePerfumeComposition } from '@/lib/perfume-composition'
import { parsePrice } from '@/lib/product-price'
import { parseProductImages } from '@/lib/product-images'
import { isProductAvailable } from '@/lib/product-stock'

const BRAND = 'KAOUBI PERFUMES'
const DEFAULT_SHIPPING_TND = '7.000'

export function toAbsoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  const siteUrl = getSiteUrl()
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function languageAlternates(path: string) {
  return {
    'x-default': path,
    'fr-TN': path,
    fr: path,
    'ar-TN': path,
    ar: path,
  }
}

export function catalogPath(categorySlug?: string | null, page = 1) {
  const params = new URLSearchParams()
  if (categorySlug && categorySlug !== 'all') {
    params.set('category', categorySlug)
  }
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/products?${query}` : '/products'
}

function storeTelephone() {
  return `+${STORE_PHONE_E164}`
}

function storePostalAddress() {
  return {
    '@type': 'PostalAddress',
    streetAddress: STORE_ADDRESS,
    addressLocality: STORE_CITY,
    addressRegion: STORE_GOVERNORATE,
    postalCode: STORE_POSTAL_CODE,
    addressCountry: 'TN',
  }
}

export function organizationJsonLd() {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    url: siteUrl,
    logo: toAbsoluteUrl('/logo.webp'),
    image: toAbsoluteUrl('/logo.webp'),
    email: STORE_EMAIL,
    telephone: storeTelephone(),
    address: storePostalAddress(),
    sameAs: [INSTAGRAM_URL, TIKTOK_URL, FACEBOOK_URL],
  }
}

export function websiteJsonLd() {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND,
    url: siteUrl,
    inLanguage: ['fr-TN', 'ar-TN'],
    publisher: {
      '@type': 'Organization',
      name: BRAND,
      logo: toAbsoluteUrl('/logo.webp'),
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function perfumeStoreJsonLd(boutiques: {
  name: string
  city: string
  address?: string | null
  phone?: string | null
  directionsUrl?: string
  image?: string | null
  rating?: number | null
  reviewCount?: number | null
}[]) {
  const siteUrl = getSiteUrl()
  const published = boutiques.filter((boutique) => boutique.city)
  const primary = published[0]
  const rated = published.find((boutique) => boutique.rating && boutique.reviewCount)

  const locations = published.map((boutique) => ({
    '@type': 'Store',
    name: boutique.name,
    image: boutique.image ? toAbsoluteUrl(boutique.image) : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: boutique.address || undefined,
      addressLocality: boutique.city,
      addressCountry: 'TN',
    },
    telephone: boutique.phone || storeTelephone(),
    url: boutique.directionsUrl || siteUrl,
    hasMap: boutique.directionsUrl || STORE_MAPS_URL,
  }))

  return {
    '@context': 'https://schema.org',
    '@type': ['Store', 'LocalBusiness'],
    name: BRAND,
    url: siteUrl,
    image: [
      toAbsoluteUrl(primary?.image || '/logo.webp'),
      toAbsoluteUrl('/hero/boutique-arches.png'),
    ],
    logo: toAbsoluteUrl('/logo.webp'),
    description:
      'Parfumerie a Douz, Kébili. Parfums femme et homme, soins MRAZIG et bakhoor traditionnel.',
    priceRange: '$$',
    currenciesAccepted: 'TND',
    paymentAccepted: 'Cash, Cash on delivery',
    areaServed: {
      '@type': 'Country',
      name: 'Tunisia',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: primary?.address || STORE_ADDRESS,
      addressLocality: STORE_CITY,
      addressRegion: STORE_GOVERNORATE,
      postalCode: STORE_POSTAL_CODE,
      addressCountry: 'TN',
    },
    email: STORE_EMAIL,
    telephone: storeTelephone(),
    hasMap: primary?.directionsUrl || STORE_MAPS_URL,
    sameAs: [INSTAGRAM_URL, TIKTOK_URL, FACEBOOK_URL],
    ...(rated
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rated.rating,
            reviewCount: rated.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(locations.length > 0 ? { department: locations } : {}),
  }
}

export function productJsonLd(product: {
  id: number
  name: string
  brand: string
  description?: string | null
  price: string
  compareAtPrice?: string | null
  imageUrl?: string | null
  images?: string | null
  inStock: boolean
  stockQuantity?: number | null
  category: string
  composition?: string | null
  intensity?: string | null
  wearMoments?: string | null
}) {
  const siteUrl = getSiteUrl()
  const images = parseProductImages(product).map(toAbsoluteUrl)
  const price = parsePrice(product.price)
  const url = `${siteUrl}/products/${product.id}`
  const composition = parsePerfumeComposition(product.composition)
  const noteNames = [...composition.tete, ...composition.coeur, ...composition.fond].map(
    (note) => note.name,
  )
  const additionalProperty = [
    product.intensity
      ? { '@type': 'PropertyValue', name: 'Intensite', value: product.intensity }
      : null,
    noteNames.length > 0
      ? { '@type': 'PropertyValue', name: 'Notes olfactives', value: noteNames.join(', ') }
      : null,
  ].filter(Boolean)
  const priceValidUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    .toISOString()
    .slice(0, 10)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.brand} — ${product.name}`,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    category: product.category,
    image: images.length > 0 ? images : [toAbsoluteUrl('/logo.webp')],
    sku: String(product.id),
    mpn: String(product.id),
    url,
    mainEntityOfPage: url,
    ...(additionalProperty.length > 0 ? { additionalProperty } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'TND',
      price: price != null ? price.toFixed(3) : product.price,
      priceValidUntil,
      availability: isProductAvailable(product)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: BRAND,
      },
      areaServed: {
        '@type': 'Country',
        name: 'Tunisia',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: DEFAULT_SHIPPING_TND,
          currency: 'TND',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'TN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 4,
            unitCode: 'd',
          },
        },
      },
    },
  }
}

export function collectionJsonLd({
  name,
  description,
  path,
  items,
  total,
}: {
  name: string
  description: string
  path: string
  items: { id: number; name: string }[]
  total: number
}) {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: toAbsoluteUrl(path),
    isPartOf: {
      '@type': 'WebSite',
      name: BRAND,
      url: siteUrl,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}/products/${item.id}`,
        name: item.name,
      })),
    },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  }
}
