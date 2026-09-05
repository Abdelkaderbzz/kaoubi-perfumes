'use client'

import { useDictionary } from '@/components/locale-provider'
import { INSTAGRAM_URL, TIKTOK_URL } from '@/lib/social-links'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  )
}

const followButtonCls =
  'inline-flex items-center gap-2.5 rounded-full border border-border px-6 py-2.5 text-[11px] font-light tracking-[0.25em] text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary'

export function InstagramSectionHeader() {
  const dictionary = useDictionary()
  return (
    <Reveal className="mb-8 text-center">
      <SectionEyebrow>{dictionary.instagram.eyebrow}</SectionEyebrow>
      <SectionTitle>@waterofgold</SectionTitle>
      <p className="mx-auto mt-3 max-w-md text-sm font-light text-muted-foreground">
        {dictionary.instagram.copy}
      </p>
    </Reveal>
  )
}

export function InstagramFollowButton() {
  const dictionary = useDictionary()
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={followButtonCls}>
        <InstagramIcon />
        {dictionary.instagram.follow}
      </a>
      <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className={followButtonCls}>
        <TikTokIcon />
        {dictionary.instagram.follow}
      </a>
    </div>
  )
}
