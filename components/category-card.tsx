import Link from 'next/link'
import { Mars, Snowflake, Sun, Users, Venus, type LucideIcon } from 'lucide-react'
import type { StoreCategory } from '@/lib/store-categories'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  femme: Venus,
  homme: Mars,
  unisexe: Users,
  mixte: Users,
  sif: Sun,
  ete: Sun,
  chta: Snowflake,
  hiver: Snowflake,
}

function CategoryIcon({ slug }: { slug: string }) {
  const Icon = CATEGORY_ICONS[slug] ?? Users
  return <Icon className="size-8 sm:size-9" strokeWidth={1.25} aria-hidden />
}

/** Compact "shop by category" chip — a round icon with a label underneath. */
export function CategoryCard({ category }: { category: StoreCategory }) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      prefetch
      className="group flex w-20 shrink-0 flex-col items-center gap-2 sm:w-24"
    >
      <div
        className={cn(
          'relative flex size-20 items-center justify-center overflow-hidden rounded-full',
          'border border-border/70 bg-card text-primary shadow-sm',
          'transition-all duration-300',
          'group-hover:border-primary/50 group-hover:bg-primary/5 group-hover:shadow-md group-hover:shadow-primary/10',
          'sm:size-24',
        )}
      >
        <CategoryIcon slug={category.slug} />
      </div>
      <p className="text-center text-[10px] font-light tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-primary">
        {category.name.toUpperCase()}
      </p>
    </Link>
  )
}
