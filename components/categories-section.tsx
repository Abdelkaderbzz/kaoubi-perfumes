'use client'

import { CategoryCard } from '@/components/category-card'
import { useDictionary } from '@/components/locale-provider'
import { Reveal } from '@/components/reveal'
import { SectionTitle } from '@/components/section-heading'
import type { StoreCategory } from '@/lib/store-categories'

export function CategoriesSection({ categories }: { categories: StoreCategory[] }) {
  const dictionary = useDictionary()

  return (
    <section className="border-t border-border py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-6 text-center">
          <SectionTitle size="sm">{dictionary.home.categoriesTitle}</SectionTitle>
        </Reveal>

        <nav
          aria-label={dictionary.home.categoriesTitle}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3"
        >
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </nav>
      </div>
    </section>
  )
}
