'use client'

import { useCart } from '@/components/cart-context'
import { useDictionary } from '@/components/locale-provider'
import { ProductPrice } from '@/components/product-price'
import {
  getVariantPrice,
  resolveDefaultSize,
  type ProductSizeVariant,
} from '@/lib/product-sizes'
import { resolveProductImageUrl } from '@/lib/product-images'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type Product = {
  id: number
  name: string
  brand: string
  price: string
  compareAtPrice?: string | null
  imageUrl: string | null
}

export function AddToCartButton({
  product,
  variants,
}: {
  product: Product
  variants: ProductSizeVariant[]
}) {
  const { addItem } = useCart()
  const dictionary = useDictionary()
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState(resolveDefaultSize(variants))
  const [added, setAdded] = useState(false)

  const selectedPrice = useMemo(
    () => getVariantPrice(variants, selectedSize, product.price),
    [variants, selectedSize, product.price],
  )

  function handleAdd() {
    addItem({
      productId: product.id,
      productName: product.name,
      productBrand: product.brand,
      size: selectedSize,
      quantity: 1,
      price: selectedPrice,
      imageUrl: product.imageUrl ? resolveProductImageUrl(product.imageUrl) : undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleOrder() {
    handleAdd()
    router.push('/checkout')
  }

  const sizePicker =
    variants.length > 0 ? (
      <div>
        <p className="mb-2.5 text-xs font-medium tracking-[0.18em] text-foreground/70">
          {dictionary.product.sizePrice}
        </p>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => {
            const active = selectedSize === variant.size
            return (
              <button
                key={variant.size}
                type="button"
                onClick={() => setSelectedSize(variant.size)}
                className={`min-h-11 min-w-14 rounded-md border px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-foreground hover:border-primary/50 hover:bg-primary/5'
                }`}
                dir="ltr"
              >
                {variant.size}
              </button>
            )
          })}
        </div>
      </div>
    ) : null

  return (
    <div className="flex flex-col gap-4">
      {sizePicker}

      <ProductPrice
        price={String(selectedPrice)}
        compareAtPrice={product.compareAtPrice}
        size="lg"
        className="hidden md:block"
      />

      {/* Desktop / tablet actions */}
      <div className="hidden gap-3 md:flex">
        <button
          type="button"
          onClick={handleAdd}
          className="min-h-12 flex-1 rounded-md border border-primary bg-primary/5 px-3 text-sm font-semibold tracking-[0.12em] text-primary transition-all hover:bg-primary hover:text-primary-foreground"
        >
          {added ? dictionary.product.added : dictionary.product.addToCart}
        </button>
        <button
          type="button"
          onClick={handleOrder}
          className="min-h-12 rounded-md border border-foreground bg-foreground px-5 text-sm font-semibold tracking-[0.12em] text-background transition-all hover:border-primary hover:bg-primary"
        >
          {dictionary.product.order}
        </button>
      </div>

      {/* Mobile sticky buy bar — always reachable while reading composition */}
      <div
        data-mobile-buybar
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/95 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-3 py-2.5">
          <ProductPrice
            price={String(selectedPrice)}
            compareAtPrice={product.compareAtPrice}
            size="sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="min-h-11 rounded-md border border-primary bg-primary/10 px-2 text-[11px] font-semibold tracking-[0.06em] text-primary active:bg-primary active:text-primary-foreground"
            >
              {added ? dictionary.product.added : dictionary.product.addToCart}
            </button>
            <button
              type="button"
              onClick={handleOrder}
              className="min-h-11 rounded-md bg-foreground px-2 text-[11px] font-semibold tracking-[0.06em] text-background active:bg-primary"
            >
              {dictionary.product.order}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer so composition content clears the sticky bar */}
      <div className="h-24 md:hidden" aria-hidden />
    </div>
  )
}
