'use client'

import { useLocale } from '@/components/locale-provider'
import {
  formatPriceTnd,
  getDiscountPercent,
  parsePrice,
} from '@/lib/product-price'
import { cn } from '@/lib/utils'

type ProductPriceProps = {
  price: string
  compareAtPrice?: string | null
  size?: 'sm' | 'lg'
  className?: string
}

export function ProductPrice({
  price,
  compareAtPrice,
  size = 'sm',
  className,
}: ProductPriceProps) {
  const { locale, dictionary } = useLocale()
  const currency = dictionary.currency
  const current = parsePrice(price) ?? 0
  const percent = getDiscountPercent(price, compareAtPrice)
  const compareAt = parsePrice(compareAtPrice)

  if (percent == null || compareAt == null) {
    return (
      <p
        className={cn(
          'tabular-nums tracking-normal text-foreground',
          size === 'lg' ? 'text-3xl font-semibold' : 'text-sm font-semibold',
          className,
        )}
      >
        {formatPriceTnd(current, locale)}{' '}
        <span
          className={cn(
            'font-medium text-foreground/65',
            size === 'lg' ? 'text-base' : 'text-[11px]',
          )}
        >
          {currency}
        </span>
      </p>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <p
        className={cn(
          'tabular-nums text-foreground',
          size === 'lg' ? 'text-3xl font-semibold' : 'text-sm font-semibold',
        )}
      >
        {formatPriceTnd(current, locale)}{' '}
        <span
          className={cn(
            'font-medium text-foreground/65',
            size === 'lg' ? 'text-base' : 'text-[11px]',
          )}
        >
          {currency}
        </span>
      </p>
      <p
        className={cn(
          'tabular-nums text-foreground/55 line-through decoration-from-font',
          size === 'lg' ? 'text-lg font-medium' : 'text-[11px] font-medium',
        )}
      >
        {formatPriceTnd(compareAt, locale)} {currency}
      </p>
      <span
        className={cn(
          'font-semibold tracking-wide text-primary',
          size === 'lg' ? 'text-base' : 'text-[11px]',
        )}
      >
        -{percent}%
      </span>
    </div>
  )
}
