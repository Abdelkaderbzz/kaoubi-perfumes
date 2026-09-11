import { getActiveBanner } from '@/app/actions/banners'
import { getCategories } from '@/app/actions/categories'
import { CartProvider } from '@/components/cart-context'
import { SiteBanner } from '@/components/site-banner'
import { SiteFooter } from '@/components/site-footer'
import { StoreRoutePrefetch } from '@/components/store-route-prefetch'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { Navbar } from '@/components/navbar'
import { getRequestDictionary } from '@/lib/i18n/server'
import { mergeStoreCategories } from '@/lib/store-categories'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [{ dictionary, locale }, categories, banner] = await Promise.all([
    getRequestDictionary(),
    getCategories(),
    getActiveBanner(),
  ])
  const storeCategories = mergeStoreCategories(categories, locale)
  const prefetchHrefs = [
    '/products',
    '/checkout',
    ...storeCategories.map((category) => `/products?category=${category.slug}`),
  ]

  return (
    <CartProvider>
      <StoreRoutePrefetch hrefs={prefetchHrefs} />
      {banner && <SiteBanner banner={banner} />}
      <Navbar storeCategories={storeCategories} />
      <main className="min-h-screen">{children}</main>
      <SiteFooter locale={locale} dictionary={dictionary} categories={storeCategories} />
      <WhatsAppButton />
    </CartProvider>
  )
}
