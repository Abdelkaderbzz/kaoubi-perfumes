'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const DEFAULT_ROUTES = ['/products', '/checkout'] as const

function scheduleIdle(task: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(task, { timeout: 1800 })
    return () => window.cancelIdleCallback(id)
  }

  const timeoutId = window.setTimeout(task, 200)
  return () => window.clearTimeout(timeoutId)
}

/** Prefetch key storefront routes during idle time for faster navigation. */
export function StoreRoutePrefetch({ hrefs }: { hrefs?: readonly string[] }) {
  const router = useRouter()
  const routesKey = (hrefs && hrefs.length > 0 ? hrefs : DEFAULT_ROUTES).join('|')

  useEffect(() => {
    const routes = routesKey.split('|').filter(Boolean)
    return scheduleIdle(() => {
      for (const href of routes) {
        void router.prefetch(href)
      }
    })
  }, [router, routesKey])

  return null
}
