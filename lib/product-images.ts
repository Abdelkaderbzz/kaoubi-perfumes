const MAX_PRODUCT_IMAGES = 5

/** Same-path replacements stay cached by next/image for 30 days. */
const LEGACY_PRODUCT_URLS: Record<string, string> = {
  '/products/gel-nettoyant.webp': '/products/gel-nettoyant-v2.webp',
}

export function resolveProductImageUrl(url: string) {
  return LEGACY_PRODUCT_URLS[url] ?? url
}

export function parseProductImages(product: {
  images?: string | null
  imageUrl?: string | null
}): string[] {
  if (product.images) {
    try {
      const parsed = JSON.parse(product.images)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((url): url is string => typeof url === 'string' && url.length > 0)
          .map(resolveProductImageUrl)
      }
    } catch {
      // fall through to imageUrl
    }
  }

  if (product.imageUrl) return [resolveProductImageUrl(product.imageUrl)]
  return []
}

export function getPrimaryImage(product: {
  images?: string | null
  imageUrl?: string | null
}): string | null {
  return parseProductImages(product)[0] ?? null
}

export function serializeProductImages(images: string[]): string {
  return JSON.stringify(
    images.filter(Boolean).slice(0, MAX_PRODUCT_IMAGES),
  )
}

export { MAX_PRODUCT_IMAGES }
