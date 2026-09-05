'use client'

import { GoogleReviewCard, InstagramCommentCard, WhatsAppCommentCard } from '@/components/testimonial-cards'
import { useDictionary } from '@/components/locale-provider'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'
import {
  TESTIMONIAL_SOURCES,
  googleTestimonials,
  socialTestimonials,
  usedTestimonialSources,
  type TestimonialItem,
} from '@/lib/testimonials'

/** Seconds for one full pass. Higher = slower drift. */
const ROW_DURATION_SECONDS = { top: 78, bottom: 94 } as const

/** How many times the item list repeats inside a single pass. One pass must be
 *  wider than the viewport or a gap opens at the trailing edge. */
function repeatsFor(count: number) {
  return Math.max(4, Math.ceil(12 / Math.max(count, 1)))
}

/** Shared by cards in a row so the marquee track stays even. */
const CARD_ITEM_CLS = 'flex h-auto shrink-0 overflow-hidden rounded-2xl'

/** All cards are HTML now (no more raw screenshots), so they share one width. */
const CARD_WIDTH_CLS = 'w-72 sm:w-80 lg:w-96'

function TestimonialItemCard({ item, decorative }: { item: TestimonialItem; decorative: boolean }) {
  if (item.kind === 'google') {
    return (
      <li
        aria-hidden={decorative}
        className={`${CARD_ITEM_CLS} ${CARD_WIDTH_CLS} border border-border/60 shadow-sm shadow-foreground/5`}
      >
        <GoogleReviewCard item={item} />
      </li>
    )
  }

  return (
    <li
      aria-hidden={decorative}
      className={`${CARD_ITEM_CLS} ${CARD_WIDTH_CLS} border border-white/10 shadow-sm shadow-black/20`}
    >
      {item.source === 'instagram' ? (
        <InstagramCommentCard item={item} />
      ) : (
        <WhatsAppCommentCard item={item} />
      )}
    </li>
  )
}

function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items: TestimonialItem[]
  direction: 'left' | 'right'
  duration: number
}) {
  if (items.length === 0) return null

  const pass = Array.from({ length: repeatsFor(items.length) }, () => items).flat()

  return (
    <div className="marquee">
      <ul
        className="marquee-track"
        data-direction={direction}
        style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
      >
        {[...pass, ...pass].map((item, index) => {
          // Only the first run of unique items is exposed to assistive tech; the
          // rest exist purely to make the loop seamless.
          const decorative = index >= items.length
          return (
            <TestimonialItemCard
              key={`${item.id}-${index}`}
              item={item}
              decorative={decorative}
            />
          )
        })}
      </ul>
    </div>
  )
}

export function TestimonialsSection() {
  const dictionary = useDictionary()
  const sources = usedTestimonialSources()

  return (
    <section className="border-t border-border bg-secondary py-8 md:py-10">
      <div className="mx-auto mb-5 max-w-6xl px-4">
        <Reveal className="flex items-baseline gap-3">
          <SectionEyebrow>{dictionary.testimonials.eyebrow}</SectionEyebrow>
          <span className="h-px flex-1 bg-border" />
          <SectionTitle size="sm" spaced={false}>
            {dictionary.testimonials.title}
          </SectionTitle>
        </Reveal>
      </div>

      <Reveal variant="fade">
        <div className="relative flex flex-col gap-3.5 py-2">
          <MarqueeRow
            items={googleTestimonials()}
            direction="left"
            duration={ROW_DURATION_SECONDS.top}
          />
          <MarqueeRow
            items={socialTestimonials()}
            direction="right"
            duration={ROW_DURATION_SECONDS.bottom}
          />

          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-secondary to-transparent sm:w-20 lg:w-28" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-secondary to-transparent sm:w-20 lg:w-28" />
        </div>
      </Reveal>

      {sources.length > 0 ? (
        <Reveal className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[11px] font-light tracking-widest text-muted-foreground" delay={80}>
          {sources.map((source) => (
            <span key={source} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${TESTIMONIAL_SOURCES[source].dotClass}`} />
              {TESTIMONIAL_SOURCES[source].label}
            </span>
          ))}
        </Reveal>
      ) : null}
    </section>
  )
}
