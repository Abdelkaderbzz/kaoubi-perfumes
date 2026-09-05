'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const STORE_ROUTES = ['/products', '/checkout'] as const

/** Prefetch key storefront routes during idle time for faster navigation. */
export function StoreRoutePrefetch() {
  const router = useRouter()

  useEffect(() => {
    function prefetchRoutes() {
      for (const href of STORE_ROUTES) {
        router.prefetch(href)
      }
    }

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetchRoutes, { timeout: 2500 })
      return () => window.cancelIdleCallback(id)
    }

    const timeoutId = setTimeout(prefetchRoutes, 400)
    return () => clearTimeout(timeoutId)
  }, [router])

  return null
}
