'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useLocale } from '@/components/locale-provider'
import { ProductPrice } from '@/components/product-price'
import { ProductPromoTag } from '@/components/product-promo-tag'
import { formatPriceTnd } from '@/lib/product-price'
import {
  DEFAULT_SIZE,
  getVariantPrice,
  parseProductSizeVariants,
} from '@/lib/product-sizes'
import { resolveProductImageUrl } from '@/lib/product-images'
import { getCategoryLabel } from '@/lib/store-categories'

export type ProductCardProduct = {
  id: number
  name: string
  brand: string
  price: string
  compareAtPrice?: string | null
  imageUrl: string | null
  category: string
  inStock: boolean
  sizes?: string | null
  promoTagEnabled?: boolean | null
  promoTagLabel?: string | null
  promoTagBgColor?: string | null
  promoTagTextColor?: string | null
}

export function ProductCard({
  product,
  categories,
  priority = false,
}: {
  product: ProductCardProduct
  categories?: { slug: string; name: string }[]
  /** LCP hint for above-the-fold cards (e.g. first showcase row). */
  priority?: boolean
}) {
  const { locale, dictionary } = useLocale()
  const categoryLabel = getCategoryLabel(product.category, categories, locale)

  const variants = useMemo(
    () => parseProductSizeVariants(product.sizes, product.price),
    [product.sizes, product.price],
  )

  const [selectedSize, setSelectedSize] = useState(variants[0]?.size ?? DEFAULT_SIZE)

  const selectedPrice = useMemo(
    () => getVariantPrice(variants, selectedSize, product.price),
    [variants, selectedSize, product.price],
  )

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 sm:rounded-2xl">
      <Link
        href={`/products/${product.id}`}
        prefetch
        className="relative block aspect-4/5 overflow-hidden bg-secondary"
      >
        {product.imageUrl ? (
          <Image
            src={resolveProductImageUrl(product.imageUrl)}
            alt={`${product.brand} ${product.name} — ${categoryLabel}`}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
            >
              <path d="M12 2C8 2 5 5.5 5 9c0 5 7 13 7 13s7-8 7-13c0-3.5-3-7-7-7z" />
            </svg>
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="text-xs font-medium tracking-widest text-foreground">
              {dictionary.products.outOfStockBadge}
            </span>
          </div>
        )}
        <div className="absolute start-2 top-2 sm:start-3 sm:top-3">
          <span className="rounded-md bg-card/95 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-primary backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-[11px] sm:tracking-widest">
            {categoryLabel.toUpperCase()}
          </span>
        </div>
        <div className="absolute end-2 top-2 sm:end-3 sm:top-3">
          <ProductPromoTag
            enabled={product.promoTagEnabled || Boolean(product.compareAtPrice)}
            label={product.promoTagLabel}
            backgroundColor={product.promoTagBgColor}
            textColor={product.promoTagTextColor}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <Link href={`/products/${product.id}`} prefetch className="block min-w-0">
          <p className="truncate text-[9px] font-medium tracking-[0.14em] text-primary sm:text-[10px] sm:tracking-[0.18em]">
            {product.brand.toUpperCase()}
          </p>
          <h3 className="mt-0.5 line-clamp-2 font-serif text-[13px] leading-snug tracking-wide text-foreground sm:text-sm">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 sm:mt-2">
          {variants.length > 1 || product.compareAtPrice ? (
            <ProductPrice
              price={String(selectedPrice)}
              compareAtPrice={product.compareAtPrice}
            />
          ) : (
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {formatPriceTnd(selectedPrice, locale)}{' '}
              <span className="text-[11px] font-medium text-foreground/65">
                {dictionary.currency}
              </span>
            </p>
          )}
        </div>

        {/* Size chips are hard to tap in a 2-col phone grid — keep them from sm up. */}
        {variants.length > 0 && (
          <div className="mt-2 hidden sm:block">
            <p className="mb-1 text-[10px] font-medium tracking-[0.14em] text-foreground/65">
              {dictionary.products.size.toUpperCase()}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {variants.map((variant) => {
                const active = selectedSize === variant.size
                return (
                  <button
                    key={variant.size}
                    type="button"
                    onClick={() => setSelectedSize(variant.size)}
                    dir="ltr"
                    className={`min-h-9 rounded px-2.5 py-1.5 text-[11px] font-medium tracking-wide transition-all ${
                      active
                        ? 'bg-foreground text-background'
                        : 'border border-border text-foreground hover:border-primary/50 hover:text-primary'
                    }`}
                  >
                    {variant.size}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
