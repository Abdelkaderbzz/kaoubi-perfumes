'use client'

import Image from 'next/image'
import { useDictionary, useLocale } from '@/components/locale-provider'
import { localizeBoutique, phoneHref, type Boutique } from '@/lib/boutiques'
import { FACEBOOK_URL } from '@/lib/social-links'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'
import type { Dictionary } from '@/lib/i18n'

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5l2.9 6.2 6.6.9-4.8 4.7 1.2 6.7L12 17.8l-5.9 3.2 1.2-6.7L2.5 9.6l6.6-.9L12 2.5z" />
    </svg>
  )
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z" />
      <circle cx="12" cy="10" r="2.75" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M21 16.9v2.4a1.5 1.5 0 01-1.6 1.5 16.3 16.3 0 01-7.1-2.5 16 16 0 01-4.9-4.9A16.3 16.3 0 014.9 6.3 1.5 1.5 0 016.4 4.7h2.4a1.5 1.5 0 011.5 1.3c.1.8.3 1.6.6 2.4a1.5 1.5 0 01-.4 1.6l-1 1a12.7 12.7 0 004.9 4.9l1-1a1.5 1.5 0 011.6-.4c.8.3 1.6.5 2.4.6a1.5 1.5 0 011.3 1.5z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14.5 8.5h2.5V5.2c-.4-.06-1.4-.2-2.6-.2-2.6 0-4.3 1.6-4.3 4.6V12H7.5v3.6h2.6V22h3.6v-6.4h2.6l.4-3.6h-3V9.9c0-1 .3-1.4 1.3-1.4z" />
    </svg>
  )
}

const actionCls =
  'inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-[11px] font-light tracking-[0.18em] text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary'

function BoutiqueHero({ boutique, rtl }: { boutique: Boutique; rtl: boolean }) {
  const place = boutique.region || boutique.city
  const badge = rtl ? place : place.toUpperCase()

  return (
    <div className="relative aspect-4/3 overflow-hidden bg-secondary">
      {boutique.image ? (
        <Image
          src={boutique.image}
          alt={boutique.imageAlt || boutique.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-primary/40">
          <PinIcon className="size-10" />
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
      <span
        className={`absolute bottom-4 start-5 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[10px] font-light text-white backdrop-blur-sm ${
          rtl ? 'tracking-normal' : 'tracking-[0.3em]'
        }`}
      >
        <PinIcon className="shrink-0" />
        {badge}
      </span>
    </div>
  )
}

function BoutiqueCard({
  boutique,
  labels,
  rtl,
}: {
  boutique: Boutique
  labels: Dictionary['boutiques']
  rtl: boolean
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-border/80 bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10">
      {boutique.directionsUrl ? (
        <a
          href={boutique.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <BoutiqueHero boutique={boutique} rtl={rtl} />
        </a>
      ) : (
        <BoutiqueHero boutique={boutique} rtl={rtl} />
      )}

      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3
            className={`font-serif text-2xl text-foreground ${
              rtl ? 'font-medium tracking-normal' : 'font-light tracking-wide'
            }`}
          >
            {boutique.city}
          </h3>
          {boutique.rating != null ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-light tracking-wider text-primary">
                <StarIcon />
                {boutique.rating.toFixed(1)}
              </span>
              <span className="text-[11px] font-light tracking-wider text-muted-foreground">
                {boutique.reviewCount ? labels.reviews(boutique.reviewCount) : ''}
                {boutique.ratingSource}
              </span>
            </div>
          ) : null}
        </div>

        {boutique.description ? (
          <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
            {boutique.description}
          </p>
        ) : null}

        {boutique.address || boutique.phone ? (
          <dl className="mt-5 space-y-2.5 border-t border-border/60 pt-5">
            {boutique.address ? (
              <div className="flex items-start gap-2.5">
                <dt className="mt-0.5 text-primary">
                  <PinIcon className="shrink-0" />
                  <span className="sr-only">{labels.address}</span>
                </dt>
                <dd className="text-sm font-light text-muted-foreground">{boutique.address}</dd>
              </div>
            ) : null}
            {boutique.phone ? (
              <div className="flex items-start gap-2.5">
                <dt className="mt-0.5 text-primary">
                  <PhoneIcon className="shrink-0" />
                  <span className="sr-only">{labels.phone}</span>
                </dt>
                <dd>
                  <a
                    href={phoneHref(boutique.phone)}
                    className="text-sm font-light tracking-wide text-muted-foreground transition-colors hover:text-primary hover:underline"
                    dir="ltr"
                  >
                    +216 {boutique.phone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {boutique.directionsUrl ? (
            <a
              href={boutique.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={actionCls}
            >
              <PinIcon />
              {labels.directions}
            </a>
          ) : null}
          {boutique.phone ? (
            <a href={phoneHref(boutique.phone)} className={actionCls}>
              <PhoneIcon />
              {labels.call}
            </a>
          ) : null}
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className={actionCls}>
            <FacebookIcon />
            FACEBOOK
          </a>
        </div>
      </div>
    </article>
  )
}

function buildTagline(boutiques: Boutique[], labels: Dictionary['boutiques']) {
  const cities = [...new Set(boutiques.map((boutique) => boutique.city))]
  if (cities.length === 0) return ''
  if (cities.length === 1) return labels.taglineOne(cities[0])

  const last = cities[cities.length - 1]
  return labels.taglineMany(cities.slice(0, -1).join(', '), last)
}

export function BoutiquesSection({ boutiques }: { boutiques: Boutique[] }) {
  const dictionary = useDictionary()
  const { locale, dir } = useLocale()
  const rtl = dir === 'rtl'
  const localized = boutiques.map((boutique) => localizeBoutique(boutique, locale))
  if (localized.length === 0) return null

  return (
    <section id="boutiques" className="scroll-mt-16 border-t border-border bg-secondary/20 py-12 md:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-8 text-center">
          <SectionEyebrow>{dictionary.boutiques.eyebrow}</SectionEyebrow>
          <SectionTitle>{dictionary.boutiques.title}</SectionTitle>
          <p className="mx-auto mt-3 max-w-lg text-sm font-light text-muted-foreground">
            {buildTagline(localized, dictionary.boutiques)}
          </p>
        </Reveal>

        <div
          className={`grid gap-6 ${
            localized.length === 1 ? 'mx-auto max-w-xl' : 'md:grid-cols-2'
          }`}
        >
          {localized.map((boutique, index) => (
            <Reveal key={boutique.id} variant={index % 2 === 0 ? 'left' : 'right'} delay={index * 90}>
              <BoutiqueCard boutique={boutique} labels={dictionary.boutiques} rtl={rtl} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
