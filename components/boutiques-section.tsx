'use client'

import { useDictionary, useLocale } from '@/components/locale-provider'
import { localizeBoutique, phoneHref, type Boutique } from '@/lib/boutiques'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'
import type { Dictionary } from '@/lib/i18n'

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
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
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M21 16.9v2.4a1.5 1.5 0 01-1.6 1.5 16.3 16.3 0 01-7.1-2.5 16 16 0 01-4.9-4.9A16.3 16.3 0 014.9 6.3 1.5 1.5 0 016.4 4.7h2.4a1.5 1.5 0 011.5 1.3c.1.8.3 1.6.6 2.4a1.5 1.5 0 01-.4 1.6l-1 1a12.7 12.7 0 004.9 4.9l1-1a1.5 1.5 0 011.6-.4c.8.3 1.6.5 2.4.6a1.5 1.5 0 011.3 1.5z" />
    </svg>
  )
}

function BoutiqueEntry({
  boutique,
  labels,
  rtl,
}: {
  boutique: Boutique
  labels: Dictionary['boutiques']
  rtl: boolean
}) {
  return (
    <article className="px-4 py-4 md:px-5 md:py-5">
      <span className="mb-3 block h-px w-8 bg-primary" aria-hidden />

      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={`font-serif text-lg text-foreground md:text-xl ${
            rtl ? 'font-medium tracking-normal' : 'font-light tracking-wide'
          }`}
        >
          {boutique.city}
        </h3>
        {boutique.rating != null ? (
          <p className="shrink-0 text-[11px] font-light tabular-nums text-primary">
            {boutique.rating.toFixed(1)}
            {boutique.reviewCount ? (
              <span className="text-muted-foreground"> · {labels.reviews(boutique.reviewCount).replace(/ · $/, '')}</span>
            ) : null}
          </p>
        ) : null}
      </div>

      {boutique.region && boutique.region !== boutique.city ? (
        <p className="mt-0.5 text-xs font-light text-muted-foreground">{boutique.region}</p>
      ) : null}

      {boutique.description ? (
        <p className="mt-2 line-clamp-2 text-xs font-light leading-relaxed text-muted-foreground">
          {boutique.description}
        </p>
      ) : null}

      {boutique.address || boutique.phone ? (
        <dl className="mt-3 space-y-1.5">
          {boutique.address ? (
            <div className="flex items-start gap-2">
              <dt className="mt-px text-primary">
                <PinIcon className="shrink-0" />
                <span className="sr-only">{labels.address}</span>
              </dt>
              <dd className="text-xs font-light leading-snug text-foreground/80">{boutique.address}</dd>
            </div>
          ) : null}
          {boutique.phone ? (
            <div className="flex items-start gap-2">
              <dt className="mt-px text-primary">
                <PhoneIcon className="shrink-0" />
                <span className="sr-only">{labels.phone}</span>
              </dt>
              <dd>
                <a
                  href={phoneHref(boutique.phone)}
                  className="text-xs font-light tracking-wide text-foreground/80 transition-colors hover:text-primary"
                  dir="ltr"
                >
                  +216 {boutique.phone}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {boutique.directionsUrl ? (
          <a
            href={boutique.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-light text-primary underline-offset-4 hover:underline"
          >
            {labels.directions}
          </a>
        ) : null}
        {boutique.phone ? (
          <a
            href={phoneHref(boutique.phone)}
            className="text-[11px] font-light text-primary underline-offset-4 hover:underline"
          >
            {labels.call}
          </a>
        ) : null}
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

function gridClass(count: number) {
  if (count <= 1) return ''
  if (count === 2) return 'md:grid-cols-2'
  return 'md:grid-cols-3'
}

export function BoutiquesSection({ boutiques }: { boutiques: Boutique[] }) {
  const dictionary = useDictionary()
  const { locale, dir } = useLocale()
  const rtl = dir === 'rtl'
  const localized = boutiques.map((boutique) => localizeBoutique(boutique, locale))
  if (localized.length === 0) return null

  return (
    <section id="boutiques" className="scroll-mt-16 border-t border-border py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-4">
          <SectionEyebrow>{dictionary.boutiques.eyebrow}</SectionEyebrow>
          <SectionTitle size="sm">{dictionary.boutiques.title}</SectionTitle>
          <p className="mt-2 max-w-xl text-xs font-light text-muted-foreground">
            {buildTagline(localized, dictionary.boutiques)}
          </p>
        </Reveal>

        <div className="max-w-4xl border border-border bg-card/80">
          <ul className={`grid ${gridClass(localized.length)}`}>
            {localized.map((boutique, index) => (
              <li
                key={boutique.id}
                className={
                  index < localized.length - 1
                    ? 'border-b border-border md:border-b-0 md:border-e'
                    : undefined
                }
              >
                <Reveal delay={index * 60}>
                  <BoutiqueEntry boutique={boutique} labels={dictionary.boutiques} rtl={rtl} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
