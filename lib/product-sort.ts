import { products } from '@/lib/db/schema'
import { asc, desc } from 'drizzle-orm'

export const PRODUCT_SORTS = [
  'newest',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
] as const

export type ProductSort = (typeof PRODUCT_SORTS)[number]

export const DEFAULT_PRODUCT_SORT: ProductSort = 'newest'

export function parseProductSort(value: string | undefined | null): ProductSort {
  if (value && (PRODUCT_SORTS as readonly string[]).includes(value)) {
    return value as ProductSort
  }
  return DEFAULT_PRODUCT_SORT
}

export function productSortOrder(sort: ProductSort) {
  switch (sort) {
    case 'price-asc':
      return [asc(products.price), asc(products.name)] as const
    case 'price-desc':
      return [desc(products.price), asc(products.name)] as const
    case 'name-asc':
      return [asc(products.name)] as const
    case 'name-desc':
      return [desc(products.name)] as const
    default:
      return [desc(products.createdAt)] as const
  }
}
