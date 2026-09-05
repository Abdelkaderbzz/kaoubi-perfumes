export type TestimonialSource = 'google' | 'instagram' | 'whatsapp'

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
 *  so it follows dark mode and matches the rest of the section. Quoted text
 *  (`text`) is kept verbatim from the real review; only the surrounding
 *  Google chrome (`meta`, `timeAgo`) is localized. */
export type TestimonialGoogleReview = BaseTestimonial & {
  kind: 'google'
  source: 'google'
  name: string
  avatarInitial: string
  avatarColor: string
  meta: string
  rating: number
  timeAgo: string
  text: string
}

export type TestimonialItem = TestimonialComment | TestimonialGoogleReview

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
    meta: '8 avis',
    rating: 5,
    timeAgo: 'il y a 1 an',
    text: 'Nice service',
  },
  {
    kind: 'comment',
    id: 'ig-fedi',
    source: 'instagram',
    username: 'fedi.alaya',
    message: 'Produit original w qualité top, merci Water of Gold 🔥',
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
    meta: 'Guide Local · 9 avis · 4 photos',
    rating: 5,
    timeAgo: 'il y a 3 ans',
    text: 'A wide variety of quality perfumes. I recommend it.',
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
    message: 'الريحة تحفة برشا، شكرا Water of Gold 🙏',
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
    meta: 'Guide Local · 49 avis · 1 photo',
    rating: 5,
    timeAgo: 'il y a 3 ans',
    text: 'On trouve toutes sortes de parfums de grandes marques',
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
    meta: '3 avis',
    rating: 5,
    timeAgo: 'il y a 3 ans',
    text: 'Numer one',
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

export const TESTIMONIAL_SOURCES: Record<TestimonialSource, { label: string; dotClass: string }> = {
  google: { label: 'Avis Google', dotClass: 'bg-[#4285f4]' },
  instagram: { label: 'Instagram', dotClass: 'bg-linear-to-r from-pink-500 to-orange-400' },
  whatsapp: { label: 'WhatsApp', dotClass: 'bg-emerald-500' },
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
