'use client'

import { Logo } from '@/components/logo'
import { useLocale } from '@/components/locale-provider'
import type { HeroImageSlot } from '@/lib/hero-images'
import Image from 'next/image'
import Link from 'next/link'

const HERO_SEX_LINKS = ['femme', 'homme', 'mixte', 'enfant'] as const

export function HeroSection({ images }: { images: HeroImageSlot[] }) {
  const { locale, dictionary } = useLocale()
  const arabic = locale === 'ar'
  const [image] = images
  const typeCls = arabic ? 'font-arabic' : ''
  const sexLabels = dictionary.sex as Record<string, string>

  return (
    <section className="hero-stage" aria-label={dictionary.hero.title}>
      <div className="hero-window">
        <div className={`hero-copy-col ${typeCls}`}>
          <Logo size="sm" className="hero-mark" priority />

          <p
            className={
              arabic
                ? 'hero-kicker text-sm font-medium text-muted-foreground'
                : 'hero-kicker text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase sm:text-xs'
            }
          >
            {dictionary.hero.eyebrow}
          </p>

          <h1
            className={
              arabic
                ? 'hero-title hero-title-ar text-[2.1rem] font-bold leading-tight text-foreground sm:text-4xl md:text-[2.85rem]'
                : 'hero-title font-serif text-[2.35rem] font-normal leading-[1.04] tracking-[-0.02em] text-foreground sm:text-5xl md:text-[3.35rem]'
            }
          >
            {dictionary.hero.title}
          </h1>

          {dictionary.hero.tagline ? (
            <p
              className={
                arabic
                  ? 'hero-copy text-base font-semibold leading-7 text-[#8a6a2a] dark:text-[#e0c15a] sm:text-lg'
                  : 'hero-copy text-sm font-medium leading-relaxed text-[#8a6a2a] dark:text-[#e0c15a] sm:text-[15px]'
              }
            >
              {dictionary.hero.tagline}
            </p>
          ) : null}

          <p
            className={
              arabic
                ? 'hero-copy max-w-sm text-[15px] font-medium leading-7 text-muted-foreground sm:text-base'
                : 'hero-copy max-w-sm text-sm font-normal leading-relaxed text-muted-foreground sm:text-[15px] sm:leading-6'
            }
          >
            {dictionary.hero.copy}
          </p>

          <div className="hero-cta flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/products"
              prefetch
              className={
                arabic
                  ? 'hero-discover inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-semibold'
                  : 'hero-discover inline-flex min-h-11 items-center justify-center rounded-full px-6 text-[11px] font-medium tracking-[0.22em] uppercase'
              }
            >
              <span className="hero-discover-dot" aria-hidden />
              {dictionary.hero.discover}
            </Link>

            <div className="hero-sex-links flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
              {HERO_SEX_LINKS.map((sex) => (
                <Link
                  key={sex}
                  href={`/products?sex=${sex}`}
                  prefetch
                  className={
                    arabic
                      ? 'hero-sex-link inline-flex min-h-10 items-center justify-center rounded-full border border-[#c4a35a]/50 px-3 text-center text-[13px] font-semibold text-foreground transition-colors hover:border-[#c4a35a] hover:text-primary sm:min-h-11 sm:justify-start sm:rounded-none sm:border-0 sm:px-0 sm:text-sm'
                      : 'hero-sex-link inline-flex min-h-10 items-center justify-center rounded-full border border-[#c4a35a]/50 px-3 text-center text-[10px] font-medium tracking-[0.16em] text-foreground uppercase transition-colors hover:border-[#c4a35a] hover:text-primary sm:min-h-11 sm:justify-start sm:rounded-none sm:border-0 sm:px-0 sm:text-[11px] sm:tracking-[0.2em]'
                  }
                >
                  {sexLabels[sex] ?? sex}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-visual">
          {image ? (
            <figure className="hero-tile" aria-label={dictionary.hero.galleryLabel}>
              <Image
                src={image.imageUrl}
                alt={image.alt}
                fill
                priority
                fetchPriority="high"
                sizes="(min-width: 768px) 46vw, 92vw"
                className="object-cover"
                style={{ objectPosition: image.objectPosition ?? 'center' }}
              />
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  )
}
