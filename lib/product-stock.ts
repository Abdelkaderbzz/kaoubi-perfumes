/** Stock is tracked with an optional counter: `stockQuantity = null` means the
 *  shop never entered a number for that product, so the manual `inStock`
 *  switch stays in charge. Once a number exists it wins, and hitting 0 marks
 *  the product "Épuisé" everywhere (card, product page, checkout). */

/** At or below this many units left, the storefront nudges the shopper. */
export const LOW_STOCK_THRESHOLD = 5

export type ProductStock = {
  inStock: boolean
  stockQuantity?: number | null
}

/** Units left, or null when the product is not counted. */
export function stockCount(product: ProductStock): number | null {
  const quantity = product.stockQuantity
  if (quantity === null || quantity === undefined) return null
  if (!Number.isFinite(quantity)) return null
  return Math.max(0, Math.trunc(quantity))
}

/** Can a shopper still order this? */
export function isProductAvailable(product: ProductStock): boolean {
  if (!product.inStock) return false
  const count = stockCount(product)
  return count === null || count > 0
}

/** Worth showing a "last units" nudge: counted, available, and running low. */
export function isLowStock(product: ProductStock): boolean {
  const count = stockCount(product)
  return (
    product.inStock && count !== null && count > 0 && count <= LOW_STOCK_THRESHOLD
  )
}

/** How many units a single cart line may hold — null when uncounted. */
export function maxOrderableQuantity(product: ProductStock): number | null {
  if (!product.inStock) return 0
  return stockCount(product)
}

/** Admin input ("", "0", "12") → column value. Blank keeps the product uncounted. */
export function parseStockQuantityInput(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, parsed)
}

/** Column value → admin input string. */
export function formatStockQuantityInput(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value)
}
