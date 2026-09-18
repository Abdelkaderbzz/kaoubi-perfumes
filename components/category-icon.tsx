import {
  Baby,
  Circle,
  Cloud,
  Flask,
  FlowerLotus,
  Jar,
  SprayBottle,
  UsersThree,
  Wind,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, Icon> = {
  parfum: Flask,
  'eau-de-parfum': FlowerLotus,
  'parfum-solide': Circle,
  'parfum-de-linge': SprayBottle,
  /** Legacy slug, kept so old links and un-migrated rows still get an icon. */
  'eau-de-ligne': SprayBottle,
  'parfum-d-ambiance': Wind,
  'parfum-originaux': Flask,
  'body-mist': Cloud,
  mkhamaria: Jar,
}

function resolveIcon(slug: string): Icon {
  if (CATEGORY_ICONS[slug]) return CATEGORY_ICONS[slug]
  if (slug.includes('parfum') && slug.includes('solide')) return Circle
  if (slug.includes('ambiance')) return Wind
  if (slug.includes('parfum')) return Flask
  if (slug.includes('linge') || slug.includes('ligne')) return SprayBottle
  if (slug.includes('mist')) return Cloud
  if (slug.includes('mkhamaria')) return Jar
  if (slug.includes('enfant') || slug.includes('child') || slug.includes('kids')) return Baby
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
