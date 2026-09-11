import type { Locale } from '@/lib/i18n'

export type TestimonialSource = 'google' | 'instagram' | 'whatsapp'

export type LocalizedCopy = {
  ar: string
  fr: string
}

type BaseTestimonial = {
  id: string
  source: TestimonialSource
}

/** A comment rendered as a card, styled after the platform it came from. */
export type TestimonialComment = BaseTestimonial & {
  kind: 'comment'
  source: 'instagram' | 'whatsapp'
  username: string
  message: string
  time: string
  avatar: string
  /** Instagram only: draw the gradient story ring around the avatar. */
  storyRing?: boolean
}

/** A Google Maps review, rebuilt as a themed card instead of a raw screenshot
 *  so it follows dark mode and matches the rest of the section. Review body
 *  (`text`) is Tunisian Arabic; Google chrome (`meta`, `timeAgo`) follows the
 *  active locale. */
export type TestimonialGoogleReview = BaseTestimonial & {
  kind: 'google'
  source: 'google'
  name: string
  avatarInitial: string
  avatarColor: string
  meta: LocalizedCopy
  rating: number
  timeAgo: LocalizedCopy
  text: string
}

export type TestimonialItem = TestimonialComment | TestimonialGoogleReview

export function localizedCopy(copy: LocalizedCopy, locale: Locale) {
  return copy[locale]
}

/** One ordered wall of social proof. Google reviews live on the top row;
 *  Instagram and WhatsApp comments share the bottom. The rows and the source
 *  legend both derive from this list. */
export const TESTIMONIAL_ITEMS: TestimonialItem[] = [
  {
    kind: 'google',
    id: 'google-pulut',
    source: 'google',
    name: 'Pulut Plghuv',
    avatarInitial: 'P',
    avatarColor: '#a142f4',
    meta: { ar: '8 تقييمات', fr: '8 avis' },
    rating: 5,
    timeAgo: { ar: 'هاذي عام', fr: 'il y a 1 an' },
    text: 'الخدمة مزيانة برشا',
  },
  {
    kind: 'comment',
    id: 'ig-fedi',
    source: 'instagram',
    username: 'fedi.alaya',
    message: 'Produit original w qualité top, merci KAOUBI PERFUMES 🔥',
    time: '7 sem',
    avatar: 'FA',
  },
  {
    kind: 'comment',
    id: 'wa-beyahaw',
    source: 'whatsapp',
    username: 'beyahaw',
    message: 'التوصيل للدار سريع برشا، الريحة روعة ❤️',
    time: '14:32',
    avatar: 'BY',
  },
  {
    kind: 'google',
    id: 'google-mohamed',
    source: 'google',
    name: 'Mohamed Regaya',
    avatarInitial: 'M',
    avatarColor: '#4285f4',
    meta: { ar: 'مرشد محلي · 9 تقييمات · 4 صور', fr: 'Guide Local · 9 avis · 4 photos' },
    rating: 5,
    timeAgo: { ar: 'هاذي 3 سنين', fr: 'il y a 3 ans' },
    text: 'فما برشا عطور جودة عالية. ننصح بيها.',
  },
  {
    kind: 'comment',
    id: 'ig-ala',
    source: 'instagram',
    username: 'ala_chafroud',
    message: 'Commande recue, tout est parfait ❤️ ❤️',
    time: '7 sem',
    avatar: 'AC',
    storyRing: true,
  },
  {
    kind: 'comment',
    id: 'wa-olfa',
    source: 'whatsapp',
    username: 'Olfa Ali',
    message: 'الريحة تحفة برشا، شكرا كعوبي 🙏',
    time: '09:15',
    avatar: 'OA',
  },
  {
    kind: 'google',
    id: 'google-faouzia',
    source: 'google',
    name: 'Faouzia CHOUKI',
    avatarInitial: 'F',
    avatarColor: '#ea4335',
    meta: { ar: 'مرشد محلي · 49 تقييم · 1 صورة', fr: 'Guide Local · 49 avis · 1 photo' },
    rating: 5,
    timeAgo: { ar: 'هاذي 3 سنين', fr: 'il y a 3 ans' },
    text: 'تلقاو كل أنواع العطور متاع الماركات الكبيرة',
  },
  {
    kind: 'comment',
    id: 'wa-sarra',
    source: 'whatsapp',
    username: 'Sarra M.',
    message: 'وصلتني الطلبية اليوم، العطر أصلي 100% ✨',
    time: '18:47',
    avatar: 'SM',
  },
  {
    kind: 'google',
    id: 'google-luk',
    source: 'google',
    name: 'luk becha',
    avatarInitial: 'L',
    avatarColor: '#34a853',
    meta: { ar: '3 تقييمات', fr: '3 avis' },
    rating: 5,
    timeAgo: { ar: 'هاذي 3 سنين', fr: 'il y a 3 ans' },
    text: 'الأحسن بلا منازع',
  },
  {
    kind: 'comment',
    id: 'ig-olfa',
    source: 'instagram',
    username: 'olfa.ali_',
    message: 'Ma commande est arrivee tres vite ❤️ ❤️ ❤️',
    time: '3 j',
    avatar: 'OL',
  },
]

export const TESTIMONIAL_SOURCES: Record<TestimonialSource, { dotClass: string }> = {
  google: { dotClass: 'bg-[#4285f4]' },
  instagram: { dotClass: 'bg-linear-to-r from-pink-500 to-orange-400' },
  whatsapp: { dotClass: 'bg-emerald-500' },
}

const SOURCE_ORDER: TestimonialSource[] = ['google', 'instagram', 'whatsapp']

export function usedTestimonialSources(items: TestimonialItem[] = TESTIMONIAL_ITEMS) {
  const present = new Set(items.map((item) => item.source))
  return SOURCE_ORDER.filter((source) => present.has(source))
}

export function googleTestimonials(items: TestimonialItem[] = TESTIMONIAL_ITEMS) {
  return items.filter((item) => item.source === 'google')
}

export function socialTestimonials(items: TestimonialItem[] = TESTIMONIAL_ITEMS) {
  return items.filter((item) => item.source === 'instagram' || item.source === 'whatsapp')
}
