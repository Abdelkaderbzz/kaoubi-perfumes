import type { TestimonialComment, TestimonialGoogleReview } from '@/lib/testimonials'

const AVATAR_GRADIENTS = {
  instagram: 'from-pink-500 via-purple-500 to-orange-400',
  whatsapp: 'from-emerald-500 to-teal-600',
} as const

function Avatar({ item }: { item: TestimonialComment }) {
  const badge = (
    <div
      className={`flex size-full items-center justify-center rounded-full bg-linear-to-br ${AVATAR_GRADIENTS[item.source]} text-[10px] font-semibold text-white`}
    >
      {item.avatar}
    </div>
  )

  if (!item.storyRing) {
    return <div className="size-8 shrink-0 self-start">{badge}</div>
  }

  return (
    <div className="size-9 shrink-0 self-start rounded-full bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
      <div className="size-full overflow-hidden rounded-full bg-[#121212] p-[2px]">{badge}</div>
    </div>
  )
}

function InstagramGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
    </svg>
  )
}

function ReadReceipt() {
  return (
    <svg width="13" height="9" viewBox="0 0 16 11" fill="#53bdeb" aria-hidden>
      <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.146.445.445 0 0 0-.14.334.43.43 0 0 0 .146.331l2.932 2.77a.463.463 0 0 0 .326.127.48.48 0 0 0 .313-.114l6.566-8.099a.43.43 0 0 0 .096-.323.444.444 0 0 0-.172-.3z" />
      <path d="M15.266.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-8.79 10.86-1.09-1.03a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.146.445.445 0 0 0-.14.334.43.43 0 0 0 .146.331l1.617 1.53a.463.463 0 0 0 .326.127.48.48 0 0 0 .313-.114l9.166-11.32a.43.43 0 0 0 .096-.323.444.444 0 0 0-.172-.3z" />
    </svg>
  )
}

/** WhatsApp's tiled chat wallpaper, inlined so it costs no extra request. */
const CHAT_WALLPAPER = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`

export function InstagramCommentCard({ item }: { item: TestimonialComment }) {
  return (
    <div className="flex h-full w-full flex-col bg-[#121212] px-3.5 py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[9px] tracking-wider text-white/40">
        <InstagramGlyph />
        INSTAGRAM
      </div>
      <div className="flex flex-1 gap-2.5">
        <Avatar item={item} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-3 text-[12px] leading-snug text-white">
            <span className="font-semibold">{item.username}</span>{' '}
            <span className="font-normal text-white/90">{item.message}</span>
          </p>
          <p className="mt-1.5 text-[10px] text-white/40">{item.time}</p>
        </div>
      </div>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} sur 5 etoiles`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill={index < rating ? '#f5b400' : 'none'}
          stroke={index < rating ? 'none' : 'currentColor'}
          strokeWidth="1.5"
          className={index < rating ? '' : 'text-border'}
          aria-hidden
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

export function GoogleReviewCard({ item }: { item: TestimonialGoogleReview }) {
  return (
    <div className="flex h-full w-full flex-col bg-card px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
          style={{ backgroundColor: item.avatarColor }}
        >
          {item.avatarInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium leading-tight text-foreground">{item.name}</p>
          <p className="truncate text-[10px] leading-tight text-muted-foreground">{item.meta}</p>
        </div>
        <GoogleGlyph />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <StarRow rating={item.rating} />
        <span className="text-[10px] text-muted-foreground">{item.timeAgo}</span>
      </div>

      <p className="mt-1.5 line-clamp-3 text-[12px] leading-snug text-foreground/80">{item.text}</p>
    </div>
  )
}

export function WhatsAppCommentCard({ item }: { item: TestimonialComment }) {
  return (
    <div className="flex h-full w-full flex-col bg-[#0b141a]">
      <div className="flex items-center gap-2 border-b border-white/5 bg-[#1f2c34] px-3 py-1.5">
        <Avatar item={item} />
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium leading-tight text-white">{item.username}</p>
          <p className="text-[9px] leading-tight text-emerald-400">en ligne</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-3 py-2" style={{ backgroundImage: CHAT_WALLPAPER }}>
        <div className="max-w-[92%] rounded-lg rounded-tl-none bg-[#005c4b] px-2.5 py-1.5">
          <p className="line-clamp-3 text-[12px] leading-snug text-[#e9edef]">{item.message}</p>
          <div className="mt-0.5 flex items-center justify-end gap-1">
            <span className="text-[9px] text-white/50">{item.time}</span>
            <ReadReceipt />
          </div>
        </div>
      </div>
    </div>
  )
}
