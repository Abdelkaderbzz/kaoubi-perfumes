'use client'

import { CategoryIcon } from '@/components/category-icon'
import { useDictionary } from '@/components/locale-provider'
import { Reveal } from '@/components/reveal'
import type { StoreCategory } from '@/lib/store-categories'

export function CategoryPhotos({
  category,
  categories,
}: {
  category: string
  categories: StoreCategory[]
}) {
  const dictionary = useDictionary()

  if (category === 'all') {
    return (
      <Reveal className="mb-5" variant="fade">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-secondary/60">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-primary">
                {dictionary.products.catalogEyebrow}
              </p>
              <h1 className="mt-0.5 font-serif text-2xl tracking-wide text-foreground sm:text-3xl">
                {dictionary.products.catalogTitle}
              </h1>
            </div>
            <p className="max-w-xs text-sm text-foreground/65 sm:text-end">
              {dictionary.products.catalogCopy}
            </p>
          </div>
        </div>
      </Reveal>
    )
  }

  const storeCategory = categories.find((item) => item.slug === category)
  if (!storeCategory) return null

  return (
    <Reveal className="mb-5" variant="fade">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-secondary/60">
        <div className="flex items-center gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-card text-primary shadow-sm sm:size-14"
            aria-hidden
          >
            <CategoryIcon slug={storeCategory.slug} className="size-6 sm:size-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.18em] text-primary">
              {storeCategory.tagline.toUpperCase()}
            </p>
            <h1 className="mt-0.5 font-serif text-2xl tracking-wide text-foreground sm:text-3xl">
              {storeCategory.name}
            </h1>
          </div>
        </div>
      </div>
    </Reveal>
  )
}
