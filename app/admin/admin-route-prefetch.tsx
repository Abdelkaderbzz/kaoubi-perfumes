'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ADMIN_PREFETCH_ROUTES } from './admin-routes'

export function AdminRoutePrefetch() {
  const router = useRouter()

  useEffect(() => {
    function prefetchRoutes() {
      for (const href of ADMIN_PREFETCH_ROUTES) {
        void router.prefetch(href)
      }
    }

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetchRoutes, { timeout: 1800 })
      return () => window.cancelIdleCallback(id)
    }

    const timeoutId = window.setTimeout(prefetchRoutes, 200)
    return () => window.clearTimeout(timeoutId)
  }, [router])

  return null
}
