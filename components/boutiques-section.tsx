'use client'

import Image from 'next/image'
import { MapPin, Phone } from '@phosphor-icons/react'
import { useDictionary, useLocale } from '@/components/locale-provider'
import { localizeBoutique, phoneHref, type Boutique } from '@/lib/boutiques'
import { STORE_MAPS_URL } from '@/lib/contact'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'
import type { Dictionary } from '@/lib/i18n'

function uniqueCities(boutiques: Boutique[]) {
  return [...new Set(boutiques.map((boutique) => boutique.city).filter(Boolean))]
}

function buildTagline(open: Boutique[], hasIncoming: boolean, labels: Dictionary['boutiques']) {
  const openCities = uniqueCities(open)
  const parts: string[] = []

  if (openCities.length === 1) parts.push(labels.taglineOne(openCities[0]))
  else if (openCities.length > 1) {
    const last = openCities[openCities.length - 1]
    parts.push(labels.taglineMany(openCities.slice(0, -1).join(', '), last))
  }

  if (hasIncoming) parts.push(labels.comingSoonLine)
  return parts.join(' ')
}

function OpenBoutique({
  boutique,
  labels,
  rtl,
}: {
  boutique: Boutique
  labels: Dictionary['boutiques']
  rtl: boolean
}) {
  const mapsUrl = boutique.directionsUrl || STORE_MAPS_URL
  const place = boutique.region && boutique.region !== boutique.city ? boutique.region : null

  return (
    <article className="grid overflow-hidden border border-border/70 bg-card md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="relative block h-36 sm:h-40 md:h-44">
        {boutique.image ? (
          <Image
            src={boutique.image}
            alt={boutique.imageAlt || boutique.name}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary text-primary/40">
            <MapPin className="size-7" weight="duotone" aria-hidden />
          </div>
        )}
      </a>

      <div className="flex flex-col justify-center px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h3
            className={`font-serif text-xl text-foreground sm:text-2xl ${
              rtl ? 'font-medium tracking-normal' : 'font-light tracking-wide'
            }`}
          >
            {boutique.city}
          </h3>
          <p className={`text-primary ${rtl ? 'text-xs font-light' : 'text-[10px] font-medium tracking-[0.28em]'}`}>
            {labels.open}
            {place ? ` · ${place}` : ''}
          </p>
        </div>

        {boutique.description ? (
          <p className="mt-1.5 line-clamp-2 max-w-md text-xs font-light leading-relaxed text-muted-foreground sm:text-sm">
            {boutique.description}
          </p>
        ) : null}

        <ul className="mt-2.5 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
          {boutique.address ? (
            <li className="min-w-0">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 truncate text-xs font-light text-muted-foreground transition-colors hover:text-primary"
              >
                <MapPin className="size-3.5 shrink-0 text-primary" weight="duotone" aria-hidden />
                <span className="truncate">
                  <span className="sr-only">{labels.address}: </span>
                  {boutique.address}
                </span>
              </a>
            </li>
          ) : null}
          {boutique.phone ? (
            <li>
              <a
                href={phoneHref(boutique.phone)}
                className="flex items-center gap-1.5 text-xs font-light tracking-wide text-muted-foreground transition-colors hover:text-primary"
                dir="ltr"
              >
                <Phone className="size-3.5 shrink-0 text-primary" weight="duotone" aria-hidden />
                <span>
                  <span className="sr-only">{labels.phone}: </span>
                  +216 {boutique.phone}
                </span>
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </article>
  )
}

/** Anonymous coming-soon storefront — no city, address, or copy from the pending row. */
function IncomingBoutique({ labels, rtl }: { labels: Dictionary['boutiques']; rtl: boolean }) {
  return (
    <article
      aria-label={labels.comingSoon}
      className="relative overflow-hidden border border-dashed border-primary/40 bg-secondary/35 px-5 py-4"
    >
      <div className="relative flex items-center gap-5">
        <div className="incoming-facade shrink-0" aria-hidden>
          <span className="incoming-facade-roof" />
          <span className="incoming-facade-body">
            <span className="incoming-facade-window" />
            <span className="incoming-facade-window" />
            <span className="incoming-facade-door" />
            <span className="incoming-facade-window" />
          </span>
        </div>
        <p
          className={`text-primary ${
            rtl ? 'text-sm font-medium' : 'text-[11px] font-medium tracking-[0.38em]'
          }`}
        >
          {labels.comingSoon}
        </p>
      </div>
    </article>
  )
}

export function BoutiquesSection({ boutiques }: { boutiques: Boutique[] }) {
  const dictionary = useDictionary()
  const { locale, dir } = useLocale()
  const rtl = dir === 'rtl'
  const localized = boutiques.map((boutique) => localizeBoutique(boutique, locale))
  const open = localized.filter((boutique) => boutique.published)
  const hasIncoming = localized.some((boutique) => !boutique.published)

  if (localized.length === 0) return null

  const labels = dictionary.boutiques
  const tagline = buildTagline(open, hasIncoming, labels)

  return (
    <section id="boutiques" className="scroll-mt-16 border-t border-border bg-background py-10 md:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-6 md:mb-7">
          <SectionEyebrow>{labels.eyebrow}</SectionEyebrow>
          <SectionTitle>{labels.title}</SectionTitle>
          {tagline ? (
            <p className="mt-2 max-w-lg text-sm font-light leading-relaxed text-muted-foreground">{tagline}</p>
          ) : null}
        </Reveal>

        {open.length > 0 ? (
          <div className="space-y-4">
            {open.map((boutique, index) => (
              <Reveal key={boutique.id} variant={index % 2 === 0 ? 'left' : 'right'} delay={index * 80}>
                <OpenBoutique boutique={boutique} labels={labels} rtl={rtl} />
              </Reveal>
            ))}
          </div>
        ) : null}

        {hasIncoming ? (
          <Reveal className={open.length > 0 ? 'mt-5 md:mt-6' : ''} delay={80}>
            <IncomingBoutique labels={labels} rtl={rtl} />
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
