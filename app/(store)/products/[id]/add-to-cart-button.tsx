'use client'

import { useCart } from '@/components/cart-context'
import { useDictionary } from '@/components/locale-provider'
import { ProductPrice } from '@/components/product-price'
import {
  DEFAULT_SIZE,
  getVariantPrice,
  type ProductSizeVariant,
} from '@/lib/product-sizes'
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
  const [selectedSize, setSelectedSize] = useState(variants[0]?.size ?? DEFAULT_SIZE)
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
      imageUrl: product.imageUrl ?? undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      {variants.length > 0 && (
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
                  className={`min-h-10 rounded-md border px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {variant.size}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <ProductPrice
        price={String(selectedPrice)}
        compareAtPrice={product.compareAtPrice}
        size="lg"
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className="min-h-12 flex-1 rounded-md border border-primary bg-primary/5 px-3 text-sm font-semibold tracking-[0.12em] text-primary transition-all hover:bg-primary hover:text-primary-foreground"
        >
          {added ? dictionary.product.added : dictionary.product.addToCart}
        </button>
        <button
          type="button"
          onClick={() => {
            handleAdd()
            router.push('/checkout')
          }}
          className="min-h-12 rounded-md border border-foreground bg-foreground px-5 text-sm font-semibold tracking-[0.12em] text-background transition-all hover:border-primary hover:bg-primary"
        >
          {dictionary.product.order}
        </button>
      </div>
    </div>
  )
}
