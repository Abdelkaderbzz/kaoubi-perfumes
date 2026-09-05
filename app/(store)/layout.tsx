import { getActiveBanner } from '@/app/actions/banners'
import { getCategories } from '@/app/actions/categories'
import { CartProvider } from '@/components/cart-context'
import { SiteBanner } from '@/components/site-banner'
import { StoreRoutePrefetch } from '@/components/store-route-prefetch'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from '@/lib/social-links'
import { Logo } from '@/components/logo'
import { Navbar } from '@/components/navbar'
import { Reveal } from '@/components/reveal'
import { getRequestDictionary } from '@/lib/i18n/server'
import { mergeStoreCategories } from '@/lib/store-categories'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [{ dictionary, locale }, categories, banner] = await Promise.all([
    getRequestDictionary(),
    getCategories(),
    getActiveBanner(),
  ])
  const storeCategories = mergeStoreCategories(categories, locale)

  return (
    <CartProvider>
      <StoreRoutePrefetch />
      {banner && <SiteBanner banner={banner} />}
      <Navbar storeCategories={storeCategories} />
      <main className="min-h-screen">{children}</main>
      <footer className="border-t border-border bg-card py-8">
        <Reveal className="mx-auto max-w-6xl px-4 text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <p className="text-xs font-light tracking-widest text-primary">
            {dictionary.footer.tagline}
          </p>
          <p className="mt-1 text-[11px] font-light tracking-widest text-muted-foreground">
            {dictionary.footer.location}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-light tracking-widest text-primary hover:underline"
            >
              @waterofgold
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-light tracking-widest text-primary hover:underline"
            >
              @waterofgold
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-light tracking-widest text-primary hover:underline"
            >
              Facebook
            </a>
          </div>
          <p className="mt-4 text-sm font-light tracking-wider text-muted-foreground">
            {dictionary.footer.madeBy}{' '}
            <a
              href="https://www.revixa.agency/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-primary hover:underline"
            >
              Revixa Agency
            </a>
          </p>
        </Reveal>
      </footer>
      <WhatsAppButton />
    </CartProvider>
  )
}
