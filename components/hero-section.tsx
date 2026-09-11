'use client'

import { useLocale } from '@/components/locale-provider'
import type { HeroImageSlot } from '@/lib/hero-images'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const SLIDE_MS = 7000

export function HeroSection({ images }: { images: HeroImageSlot[] }) {
  const { locale, dictionary } = useLocale()
  const arabic = locale === 'ar'
  const slides = images.length > 0 ? images : []
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (slides.length < 2 || paused || reduceMotion) return

    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length)
    }, SLIDE_MS)

    return () => window.clearInterval(id)
  }, [paused, reduceMotion, slides.length])

  const onSelect = useCallback((index: number) => {
    setActive(index)
  }, [])

  const typeCls = arabic ? 'font-arabic' : ''

  return (
    <section
      className="hero-stage relative isolate bg-[#1a1012]"
      aria-label={slides[active]?.alt || dictionary.hero.title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-window relative">
        <div className="hero-photos relative overflow-hidden">
          {slides.map((image, index) => {
            const isActive = index === active
            return (
              <div
                key={`${image.slot}-${image.imageUrl}`}
                className={`hero-slide absolute inset-0 ${isActive ? 'hero-slide-active' : ''}`}
                aria-hidden={!isActive}
              >
                <Image
                  src={image.imageUrl}
                  alt=""
                  fill
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  sizes="100vw"
                  className="object-cover"
                  style={{ objectPosition: image.objectPosition ?? 'center' }}
                />
              </div>
            )
          })}

          <div className="hero-veil pointer-events-none absolute inset-0" aria-hidden />
        </div>

        <div className="hero-copy-wrap">
          <div className={`hero-plate ${typeCls}`}>
            <p
              className={
                arabic
                  ? 'hero-kicker text-sm font-medium text-[#e8d5a8]'
                  : 'hero-kicker text-[11px] font-medium tracking-[0.22em] text-[#e8d5a8] sm:text-xs'
              }
            >
              {dictionary.hero.eyebrow}
            </p>

            <h1
              className={
                arabic
                  ? 'hero-title hero-title-ar mt-2 text-[1.85rem] font-bold leading-tight text-[#fff8fa] sm:text-4xl md:text-[2.75rem]'
                  : 'hero-title mt-2 font-serif text-[1.85rem] font-normal leading-[1.08] tracking-[0.04em] text-[#fff8fa] sm:text-4xl sm:tracking-[0.05em] md:text-[2.85rem]'
              }
            >
              {dictionary.hero.title}
            </h1>

            <div className="hero-rule mt-3 h-px w-14 bg-[#d4af37]/85 sm:mt-3.5 sm:w-16" />

            {dictionary.hero.tagline ? (
              <p
                className={
                  arabic
                    ? 'hero-copy mt-3 max-w-md text-base font-semibold leading-7 text-[#e8d5a8] sm:text-lg'
                    : 'hero-copy mt-3 max-w-md text-sm font-medium leading-relaxed text-[#e8d5a8] sm:text-[15px]'
                }
              >
                {dictionary.hero.tagline}
              </p>
            ) : null}

            <p
              className={
                arabic
                  ? `hero-copy ${dictionary.hero.tagline ? 'mt-1.5' : 'mt-3'} max-w-md text-[15px] font-medium leading-6 text-[#f7ebe0]/92 sm:text-base sm:leading-7`
                  : `hero-copy ${dictionary.hero.tagline ? 'mt-1.5' : 'mt-3'} max-w-md text-sm font-normal leading-relaxed text-[#f7ebe0]/90 sm:text-[15px] sm:leading-6`
              }
            >
              {dictionary.hero.copy}
            </p>

            <div className="hero-cta mt-5 flex flex-col items-stretch gap-3 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
              <Link
                href="/products"
                prefetch
                className={
                  arabic
                    ? 'inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90'
                    : 'inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 text-[11px] font-medium tracking-[0.2em] text-primary-foreground transition-colors hover:bg-primary/90 sm:tracking-[0.24em]'
                }
              >
                {dictionary.hero.discover}
              </Link>

              <div className="flex items-center justify-center gap-x-5 sm:justify-start">
                <Link
                  href="/products?category=femme"
                  prefetch
                  className={
                    arabic
                      ? 'inline-flex min-h-11 items-center text-sm font-semibold text-[#fff8fa]/85 transition-colors hover:text-[#d4af37]'
                      : 'inline-flex min-h-11 items-center text-[11px] font-medium tracking-[0.18em] text-[#fff8fa]/80 transition-colors hover:text-[#d4af37] sm:tracking-[0.22em]'
                  }
                >
                  {dictionary.hero.women}
                </Link>
                <span className="text-[#d4af37]/55" aria-hidden>
                  ·
                </span>
                <Link
                  href="/products?category=homme"
                  prefetch
                  className={
                    arabic
                      ? 'inline-flex min-h-11 items-center text-sm font-semibold text-[#fff8fa]/85 transition-colors hover:text-[#d4af37]'
                      : 'inline-flex min-h-11 items-center text-[11px] font-medium tracking-[0.18em] text-[#fff8fa]/80 transition-colors hover:text-[#d4af37] sm:tracking-[0.22em]'
                  }
                >
                  {dictionary.hero.men}
                </Link>
              </div>
            </div>
          </div>

          {slides.length > 1 ? (
            <div
              className="hero-film flex gap-2 overflow-x-auto pb-0.5 scrollbar-none sm:gap-2.5"
              role="tablist"
              aria-label={dictionary.hero.galleryLabel}
            >
              {slides.map((image, index) => {
                const selected = index === active
                return (
                  <button
                    key={`thumb-${image.slot}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={image.alt}
                    onClick={() => onSelect(index)}
                    className={`relative aspect-[3/2] h-12 shrink-0 overflow-hidden sm:h-14 md:h-[3.75rem] ${
                      selected ? 'hero-thumb-active' : 'hero-thumb'
                    }`}
                  >
                    <Image
                      src={image.imageUrl}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                      style={{ objectPosition: image.objectPosition ?? 'center' }}
                    />
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
