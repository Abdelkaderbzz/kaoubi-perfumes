import { getBcp47Locale, type Locale } from '@/lib/i18n/config'
import { SITE_LOCALE } from '@/lib/locale'

/** Current/sale price is `price`. Optional `compareAtPrice` is the old (strikethrough) price. */

export function parsePrice(value: string | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : null
}

export function formatPriceTnd(value: number, locale?: Locale): string {
  return value.toLocaleString(locale ? getBcp47Locale(locale) : SITE_LOCALE, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

/** Discount % when compare-at is strictly greater than the current price. */
export function getDiscountPercent(
  price: string | number | null | undefined,
  compareAtPrice: string | number | null | undefined,
): number | null {
  const current = typeof price === 'number' ? price : parsePrice(price)
  const compareAt =
    typeof compareAtPrice === 'number' ? compareAtPrice : parsePrice(compareAtPrice)

  if (
    current == null ||
    compareAt == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(compareAt) ||
    current <= 0 ||
    compareAt <= current
  ) {
    return null
  }

  const percent = Math.round(((compareAt - current) / compareAt) * 100)
  // Avoid showing "-0%" when the difference rounds down
  return percent > 0 ? percent : null
}

export function hasActiveDiscount(
  price: string | number | null | undefined,
  compareAtPrice: string | number | null | undefined,
): boolean {
  return getDiscountPercent(price, compareAtPrice) != null
}
