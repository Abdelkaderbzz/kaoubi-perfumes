export type ProductSexOption = {
  value: string
  label: string
}

/** Who the product is for, single choice per product. Distinct from `category`
 *  (product format/type: parfum, eau de ligne, mkhamaria, etc). Null = not
 *  applicable (most soins/bakhoor items). */
export const PRODUCT_SEX_OPTIONS: ProductSexOption[] = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'mixte', label: 'Mixte' },
]

const PRODUCT_SEX_LABEL_BY_VALUE = new Map(
  PRODUCT_SEX_OPTIONS.map((option) => [option.value, option.label]),
)

export function getProductSexLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return PRODUCT_SEX_LABEL_BY_VALUE.get(value) ?? value
}

export function isValidProductSex(value: string): boolean {
  return PRODUCT_SEX_LABEL_BY_VALUE.has(value)
}
