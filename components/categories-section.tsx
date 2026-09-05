'use client'

import { CategoryCard } from '@/components/category-card'
import { useDictionary } from '@/components/locale-provider'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'
import type { StoreCategory } from '@/lib/store-categories'

export function CategoriesSection({ categories }: { categories: StoreCategory[] }) {
  const dictionary = useDictionary()

  return (
    <section className="border-t border-border bg-secondary/20 py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-5 flex items-baseline gap-3">
          <SectionEyebrow>{dictionary.home.categoriesEyebrow}</SectionEyebrow>
          <span className="h-px flex-1 bg-border" />
          <SectionTitle size="sm" spaced={false}>
            {dictionary.home.categoriesTitle}
          </SectionTitle>
        </Reveal>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 sm:gap-x-8">
          {categories.map((category, index) => (
            <Reveal key={category.slug} variant="zoom" delay={index * 60}>
              <CategoryCard category={category} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
