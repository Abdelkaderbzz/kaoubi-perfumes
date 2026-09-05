'use client'

import { useLocale } from '@/components/locale-provider'
import type { ElementType, ReactNode } from 'react'

/** Small tracked-caps label above a section title (eyebrow). Wide letter-spacing
 *  reads fine on sparse Latin caps but tears apart Arabic's joined letterforms,
 *  so Arabic gets a bigger, tracking-normal treatment instead. */
export function SectionEyebrow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { dir } = useLocale()
  const style =
    dir === 'rtl'
      ? 'text-sm font-light tracking-normal'
      : 'text-[10px] font-light tracking-[0.4em]'
  return <p className={`${style} text-primary ${className}`}>{children}</p>
}

const TITLE_SIZES = {
  sm: { ltr: 'text-lg', rtl: 'text-xl' },
  md: { ltr: 'text-2xl', rtl: 'text-3xl' },
  lg: { ltr: 'text-3xl', rtl: 'text-4xl' },
} as const

export function SectionTitle({
  children,
  as = 'h2',
  size = 'md',
  spaced = true,
  className = '',
}: {
  children: ReactNode
  as?: ElementType
  size?: keyof typeof TITLE_SIZES
  /** Adds the top margin used when the title stacks under its eyebrow.
   *  Turn off when the eyebrow and title share an inline row instead. */
  spaced?: boolean
  className?: string
}) {
  const { dir } = useLocale()
  const isRtl = dir === 'rtl'
  const sizeCls = isRtl ? TITLE_SIZES[size].rtl : TITLE_SIZES[size].ltr
  const weightCls = isRtl ? 'font-medium tracking-normal' : 'font-light tracking-widest'
  const Tag = as

  return (
    <Tag
      className={`${spaced ? 'mt-2 ' : ''}font-serif ${sizeCls} ${weightCls} text-foreground ${className}`}
    >
      {children}
    </Tag>
  )
}
