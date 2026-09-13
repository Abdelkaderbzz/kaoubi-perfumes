import Link from 'next/link'
import type { StoreCategory } from '@/lib/store-categories'

/** Collection link as a text card. */
export function CategoryCard({ category }: { category: StoreCategory }) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      prefetch
      className="group flex h-full flex-col justify-center border border-border/70 bg-card px-4 py-5 text-center transition-colors hover:border-primary/45 hover:bg-secondary/35"
    >
      <p className="font-serif text-lg text-foreground transition-colors group-hover:text-primary sm:text-xl">
        {category.name}
      </p>
      {category.tagline ? (
        <p className="mt-1.5 line-clamp-2 text-xs font-light leading-relaxed text-muted-foreground">
          {category.tagline}
        </p>
      ) : null}
    </Link>
  )
}
