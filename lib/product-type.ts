export type ProductTypeOption = {
  value: string
  label: string
}

/** Product format/type, single choice per product. Distinct from `category` (audience). */
export const PRODUCT_TYPES: ProductTypeOption[] = [
  { value: 'parfum', label: 'Parfum' },
  { value: 'eau-de-parfum', label: 'Eau de Parfum' },
  { value: 'eau-de-ligne', label: 'Eau de Ligne' },
  { value: 'body-mist', label: 'Body Mist' },
  { value: 'body-shimmer', label: 'Body Shimmer' },
  { value: 'mkhamaria', label: 'Mkhamaria' },
]

const PRODUCT_TYPE_LABEL_BY_VALUE = new Map(PRODUCT_TYPES.map((type) => [type.value, type.label]))

export function getProductTypeLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return PRODUCT_TYPE_LABEL_BY_VALUE.get(value) ?? value
}

export function isValidProductType(value: string): boolean {
  return PRODUCT_TYPE_LABEL_BY_VALUE.has(value)
}
