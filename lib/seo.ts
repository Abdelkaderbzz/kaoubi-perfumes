import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from '@/lib/social-links'
import { getSiteUrl } from '@/lib/site'
import { parsePrice } from '@/lib/product-price'
import { getPrimaryImage } from '@/lib/product-images'

const BRAND = 'Water of Gold'

export function organizationJsonLd() {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    url: siteUrl,
    logo: `${siteUrl}/logo.webp`,
    sameAs: [INSTAGRAM_URL, TIKTOK_URL, FACEBOOK_URL],
  }
}

export function perfumeStoreJsonLd(boutiques: {
  name: string
  city: string
  address?: string | null
  phone?: string | null
  directionsUrl?: string
}[]) {
  const siteUrl = getSiteUrl()
  const locations = boutiques.map((boutique) => ({
    '@type': 'Store',
    name: boutique.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: boutique.address || undefined,
      addressLocality: boutique.city,
      addressCountry: 'TN',
    },
    telephone: boutique.phone || undefined,
    url: boutique.directionsUrl || siteUrl,
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'PerfumeStore',
    name: BRAND,
    url: siteUrl,
    image: `${siteUrl}/logo.webp`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Sousse',
      addressCountry: 'TN',
    },
    sameAs: [INSTAGRAM_URL, TIKTOK_URL, FACEBOOK_URL],
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
  category: string
}) {
  const siteUrl = getSiteUrl()
  const primaryImage = getPrimaryImage(product)
  const price = parsePrice(product.price)
  const url = `${siteUrl}/products/${product.id}`

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
    image: primaryImage ? [primaryImage] : [`${siteUrl}/logo.webp`],
    sku: String(product.id),
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'TND',
      price: price != null ? price.toFixed(3) : product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: BRAND,
      },
    },
  }
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  }
}
