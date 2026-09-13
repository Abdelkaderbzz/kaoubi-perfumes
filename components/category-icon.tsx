import {
  Baby,
  Compass,
  Drop,
  Fire,
  FlowerLotus,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, Icon> = {
  femme: FlowerLotus,
  homme: Compass,
  unisexe: UsersThree,
  mixte: UsersThree,
  enfant: Baby,
  soins: Drop,
  bakhoor: Fire,
}

function resolveIcon(slug: string): Icon {
  if (CATEGORY_ICONS[slug]) return CATEGORY_ICONS[slug]
  if (slug.includes('femme')) return FlowerLotus
  if (slug.includes('homme')) return Compass
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
