'use client'

import { useDictionary } from '@/components/locale-provider'
import { FACEBOOK_URL, INSTAGRAM_URL, SOCIAL_HANDLE, TIKTOK_URL } from '@/lib/social-links'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'
import { FacebookIcon, InstagramIcon, TikTokIcon } from '@/components/social-icons'

export { FacebookIcon, InstagramIcon, TikTokIcon }

const followButtonCls =
  'inline-flex items-center gap-2.5 rounded-full border border-border px-6 py-2.5 text-[11px] font-light tracking-[0.25em] text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary'

export function InstagramSectionHeader() {
  const dictionary = useDictionary()
  return (
    <Reveal className="mb-8 text-center">
      <SectionEyebrow>{dictionary.instagram.eyebrow}</SectionEyebrow>
      <SectionTitle>@{SOCIAL_HANDLE}</SectionTitle>
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
      <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className={followButtonCls}>
        <FacebookIcon />
        {dictionary.instagram.follow}
      </a>
    </div>
  )
}
