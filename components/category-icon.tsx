import {
  Baby,
  Cloud,
  Drop,
  Fire,
  Flask,
  FlowerLotus,
  Jar,
  Sparkle,
  SprayBottle,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, Icon> = {
  parfum: Flask,
  'eau-de-parfum': FlowerLotus,
  'eau-de-ligne': SprayBottle,
  'body-mist': Cloud,
  'body-shimmer': Sparkle,
  mkhamaria: Jar,
  enfant: Baby,
  soins: Drop,
  bakhoor: Fire,
}

function resolveIcon(slug: string): Icon {
  if (CATEGORY_ICONS[slug]) return CATEGORY_ICONS[slug]
  if (slug.includes('parfum')) return Flask
  if (slug.includes('ligne')) return SprayBottle
  if (slug.includes('mist')) return Cloud
  if (slug.includes('shimmer')) return Sparkle
  if (slug.includes('mkhamaria')) return Jar
  if (slug.includes('enfant') || slug.includes('child') || slug.includes('kids')) return Baby
  if (slug.includes('soin')) return Drop
  if (slug.includes('bakhoor') || slug.includes('encens')) return Fire
  return UsersThree
}

export function CategoryIcon({
  slug,
  className,
}: {
  slug: string
  className?: string
}) {
  const Icon = resolveIcon(slug)
  return <Icon weight="duotone" className={cn('size-8', className)} aria-hidden />
}
