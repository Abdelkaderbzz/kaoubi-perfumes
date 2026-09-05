export type ProductSizeVariant = {
  size: string
  price: string
}

const DEFAULT_SIZE = 'Unique'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Parse `products.sizes` JSON. Supports legacy string arrays and `{ size, price }` objects. */
export function parseProductSizeVariants(
  sizesJson: string | null | undefined,
  fallbackPrice?: string | number | null,
): ProductSizeVariant[] {
  const fallback =
    fallbackPrice == null || fallbackPrice === ''
      ? ''
      : typeof fallbackPrice === 'number'
        ? fallbackPrice.toFixed(3)
        : String(fallbackPrice)

  try {
    const parsed = JSON.parse(sizesJson || '[]') as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((entry): ProductSizeVariant | null => {
        if (typeof entry === 'string') {
          const size = entry.trim()
          if (!size) return null
          return { size, price: fallback }
        }
        if (isRecord(entry)) {
          const size = String(entry.size ?? '').trim()
          if (!size) return null
          const priceRaw = entry.price
          const price =
            priceRaw == null || priceRaw === ''
              ? fallback
              : typeof priceRaw === 'number'
                ? priceRaw.toFixed(3)
                : String(priceRaw).trim()
          return { size, price }
        }
        return null
      })
      .filter((entry): entry is ProductSizeVariant => entry !== null)
  } catch {
    return []
  }
}

export function serializeProductSizeVariants(variants: ProductSizeVariant[]): string {
  const cleaned = variants
    .map((variant) => ({
      size: variant.size.trim(),
      price: String(variant.price).trim(),
    }))
    .filter((variant) => variant.size.length > 0 && variant.price.length > 0)
  return JSON.stringify(cleaned)
}

export function getSizeLabels(variants: ProductSizeVariant[]): string[] {
  return variants.map((variant) => variant.size)
}

export function getVariantPrice(
  variants: ProductSizeVariant[],
  size: string,
  fallbackPrice: string | number,
): number {
  const match = variants.find((variant) => variant.size === size)
  if (match) {
    const parsed = parseFloat(match.price)
    if (!Number.isNaN(parsed)) return parsed
  }
  return typeof fallbackPrice === 'number' ? fallbackPrice : parseFloat(fallbackPrice) || 0
}

/** Listing price: cheapest size variant, or the product base price. */
export function getListingPrice(
  variants: ProductSizeVariant[],
  basePrice: string | number,
): string {
  const prices = variants
    .map((variant) => parseFloat(variant.price))
    .filter((price) => !Number.isNaN(price) && price > 0)
  if (prices.length > 0) {
    return Math.min(...prices).toFixed(3)
  }
  return typeof basePrice === 'number' ? basePrice.toFixed(3) : String(basePrice)
}

export function resolveCartSize(variants: ProductSizeVariant[]): string {
  return variants[0]?.size ?? DEFAULT_SIZE
}

export { DEFAULT_SIZE }
