export const ADMIN_PAGE_SIZE = 10
export const STORE_PAGE_SIZE = 12

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function normalizePage(value: unknown, fallback = 1) {
  const page = Number(value)
  if (!Number.isFinite(page) || page < 1) return fallback
  return Math.floor(page)
}

export function normalizePageSize(value: unknown, fallback: number, max = 50) {
  const size = Number(value)
  if (!Number.isFinite(size) || size < 1) return fallback
  return Math.min(Math.floor(size), max)
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return {
    items,
    total,
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
  }
}

export function paginationOffset(page: number, pageSize: number) {
  return (page - 1) * pageSize
}

/** Compact page list with ellipses for the storefront pager. */
export function storePageItems(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 1) return [1]
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = new Set([1, total, current - 1, current, current + 1])
  if (current <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (current >= total - 2) {
    pages.add(total - 3)
    pages.add(total - 2)
    pages.add(total - 1)
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
  const items: Array<number | 'ellipsis'> = []
  for (const page of sorted) {
    const previous = items[items.length - 1]
    if (typeof previous === 'number' && page - previous > 1) {
      items.push('ellipsis')
    }
    items.push(page)
  }
  return items
}
