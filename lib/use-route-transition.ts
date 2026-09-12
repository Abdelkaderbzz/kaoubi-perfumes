'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'

function scheduleIdle(task: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(task, { timeout: 1200 })
    return () => window.cancelIdleCallback(id)
  }

  const timeoutId = window.setTimeout(task, 160)
  return () => window.clearTimeout(timeoutId)
}

/** Tracks pending `router.push` / `router.replace` for pagination & filter UX. */
export function useRouteTransition() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function push(href: string) {
    startTransition(() => {
      router.push(href)
    })
  }

  function replace(href: string) {
    startTransition(() => {
      router.replace(href)
    })
  }

  function refresh() {
    startTransition(() => {
      router.refresh()
    })
  }

  return { isPending, push, replace, refresh, router, startTransition }
}

/** Prefetch sibling list pages during idle time so pagination feels instant. */
export function usePrefetchHrefs(hrefs: readonly string[]) {
  const router = useRouter()
  const routesKey = hrefs.join('|')

  useEffect(() => {
    if (!routesKey) return undefined
    const routes = routesKey.split('|').filter(Boolean)
    return scheduleIdle(() => {
      for (const href of routes) {
        void router.prefetch(href)
      }
    })
  }, [router, routesKey])
}
