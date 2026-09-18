'use client'

import type { ActiveBanner } from '@/app/actions/banners'
import { useDictionary } from '@/components/locale-provider'
import Link from 'next/link'
import { useEffect, useState, type CSSProperties } from 'react'

/** Dismissal is keyed by banner id and message, so editing the text brings the
 *  banner back for visitors who had already closed the previous version. */
function storageKey(banner: ActiveBanner) {
  let hash = 0
  for (let index = 0; index < banner.message.length; index += 1) {
    hash = (hash * 31 + banner.message.charCodeAt(index)) | 0
  }
  return `kaoubi-banner-dismissed-${banner.id}-${hash}`
}

/** One full pass = enter from the right, cross, exit left. Long messages get
 *  proportionally more time so the reading speed stays constant. */
function marqueeDuration(message: string) {
  const seconds = 9 + message.length * 0.16
  return `${Math.min(40, Math.max(12, Math.round(seconds)))}s`
}

export function SiteBanner({ banner }: { banner: ActiveBanner }) {
  const dictionary = useDictionary()
  const [dismissed, setDismissed] = useState(false)
  const key = storageKey(banner)

  useEffect(() => {
    if (!banner.dismissible) return
    try {
      if (window.localStorage.getItem(key) === '1') setDismissed(true)
    } catch {
      // Private mode or blocked storage — keep the banner visible.
    }
  }, [key, banner.dismissible])

  function dismiss() {
    setDismissed(true)
    try {
      window.localStorage.setItem(key, '1')
    } catch {
      // Nothing to persist; hiding for this page view is enough.
    }
  }

  if (dismissed) return null

  const variantLabels = {
    offer: 'OFFRE',
    news: dictionary.banner.news,
    discount: 'PROMO',
  } as const

  const hasLink = banner.linkHref !== ''
  const linkLabel = banner.linkLabel || dictionary.banner.discover
  const isExternal = /^https?:\/\//.test(banner.linkHref)
  const linkCls =
    'hidden shrink-0 rounded-full border border-current/40 px-3 py-1 font-light tracking-[0.15em] transition-opacity hover:opacity-70 sm:inline-block'

  return (
    <div
      role="region"
      aria-label={dictionary.banner.aria}
      style={{
        backgroundColor: banner.backgroundColor,
        color: banner.textColor,
        fontSize: `${banner.fontSize}px`,
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <span className="hidden shrink-0 rounded-full bg-current/15 px-2 py-0.5 text-[0.7em] font-medium tracking-[0.2em] sm:inline-block">
          {variantLabels[banner.variant]}
        </span>

        <div
          className="banner-marquee"
          style={{ '--banner-marquee-duration': marqueeDuration(banner.message) } as CSSProperties}
        >
          <p className="banner-marquee-track font-light tracking-wider">{banner.message}</p>
        </div>

        {hasLink &&
          (isExternal ? (
            <a
              href={banner.linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkCls} text-[0.8em]`}
            >
              {linkLabel.toUpperCase()}
            </a>
          ) : (
            <Link href={banner.linkHref} prefetch className={`${linkCls} text-[0.8em]`}>
              {linkLabel.toUpperCase()}
            </Link>
          ))}

        {banner.dismissible ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label={dictionary.banner.close}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <span className="w-3.5 shrink-0" aria-hidden />
        )}
      </div>
    </div>
  )
}
