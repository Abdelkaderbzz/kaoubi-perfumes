'use client'

import { CategoryCard } from '@/components/category-card'
import { useDictionary } from '@/components/locale-provider'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'
import type { StoreCategory } from '@/lib/store-categories'

export function CategoriesSection({ categories }: { categories: StoreCategory[] }) {
  const dictionary = useDictionary()

  return (
    <section className="border-t border-border bg-secondary/40 py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-5 flex items-baseline gap-3">
          <SectionEyebrow>{dictionary.home.categoriesEyebrow}</SectionEyebrow>
          <span className="h-px flex-1 bg-border" />
          <SectionTitle size="sm" spaced={false}>
            {dictionary.home.categoriesTitle}
          </SectionTitle>
        </Reveal>

        <div className="-mx-4 flex gap-x-6 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-x-10 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          {categories.map((category, index) => (
            <Reveal key={category.slug} variant="zoom" delay={index * 60} className="shrink-0">
              <CategoryCard category={category} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
