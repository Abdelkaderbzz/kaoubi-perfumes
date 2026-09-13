'use client'

import { ProductCard } from '@/components/product-card'
import { useDictionary } from '@/components/locale-provider'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'
import Link from 'next/link'

type Product = {
  id: number
  name: string
  brand: string
  price: string
  compareAtPrice?: string | null
  imageUrl: string | null
  category: string
  sex?: string | null
  inStock: boolean
  sizes?: string | null
  promoTagEnabled?: boolean | null
  promoTagLabel?: string | null
  promoTagBgColor?: string | null
  promoTagTextColor?: string | null
}

/** Reusable storefront section for a curated row of products (featured, new, promo, best-sellers). */
export function ProductShowcaseSection({
  eyebrow,
  title,
  products,
  categories,
  tone = 'default',
  priorityImages = false,
}: {
  eyebrow: string
  title: string
  products: Product[]
  categories?: { slug: string; name: string }[]
  tone?: 'default' | 'muted'
  /** Prefetch LCP images for the first row only. */
  priorityImages?: boolean
}) {
  const dictionary = useDictionary()
  if (products.length === 0) return null

  return (
    <section
      className={`mx-auto max-w-6xl px-4 py-12 md:py-14 ${tone === 'muted' ? 'border-t border-border' : ''}`}
    >
      <Reveal className="mb-8 text-center">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <SectionTitle>{title}</SectionTitle>
      </Reveal>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            categories={categories}
            priority={priorityImages && index < 4}
          />
        ))}
      </div>
      <Reveal className="mt-8 text-center" variant="zoom" delay={160}>
        <Link
          href="/products"
          prefetch
          className="boutique-cta inline-flex items-center justify-center rounded-full bg-primary px-9 py-3 text-[11px] font-medium tracking-[0.28em] text-primary-foreground transition-[transform,background-color] duration-500 hover:bg-primary/90"
        >
          {dictionary.home.allBoutique}
        </Link>
      </Reveal>
    </section>
  )
}
