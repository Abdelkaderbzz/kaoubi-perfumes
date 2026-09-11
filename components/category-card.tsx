import Link from 'next/link'
import { CategoryIcon } from '@/components/category-icon'
import type { StoreCategory } from '@/lib/store-categories'
import { cn } from '@/lib/utils'

/** Compact "shop by category" chip — a round icon with a label underneath. */
export function CategoryCard({ category }: { category: StoreCategory }) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      prefetch
      className="group flex w-[5.75rem] shrink-0 flex-col items-center gap-2.5 sm:w-28"
    >
      <div
        className={cn(
          'relative flex size-[4.75rem] items-center justify-center overflow-hidden rounded-full',
          'border border-primary/30 bg-card text-primary shadow-sm',
          'transition-all duration-300',
          'group-hover:border-primary/55 group-hover:bg-secondary group-hover:shadow-md group-hover:shadow-primary/10',
          'sm:size-24',
        )}
      >
        <CategoryIcon slug={category.slug} className="size-8 sm:size-10" />
      </div>
      <p className="text-center text-[13px] font-medium leading-snug text-foreground transition-colors group-hover:text-primary sm:text-[15px]">
        {category.name}
      </p>
    </Link>
  )
}
