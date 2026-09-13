import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import { Bodoni_Moda, Montserrat, Tajawal } from 'next/font/google'
import { LocaleProvider } from '@/components/locale-provider'
import { StorefrontScale } from '@/components/storefront-scale'
import { ThemeScript } from '@/components/theme-script'
import { ToastProvider } from '@/components/toast-provider'
import {
  getDictionary,
  getDirection,
  getHtmlLang,
  getOgLocale,
} from '@/lib/i18n'
import { getRequestLocale } from '@/lib/i18n/server'
import { languageAlternates } from '@/lib/seo'
import { getSiteUrl } from '@/lib/site'
import './globals.css'

const bodoni = Bodoni_Moda({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
  preload: true,
})

const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-arabic',
  display: 'swap',
  preload: true,
})

const siteUrl = getSiteUrl()

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const siteTitle = dictionary.meta.title
  const siteDescription = dictionary.meta.description

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteTitle,
      template: '%s | KAOUBI PERFUMES',
    },
    description: siteDescription,
    applicationName: 'KAOUBI PERFUMES',
    authors: [{ name: 'KAOUBI PERFUMES' }],
    creator: 'KAOUBI PERFUMES',
    publisher: 'KAOUBI PERFUMES',
    category: 'shopping',
    keywords: [
      'parfum',
      'parfumerie',
      'parfum Tunisie',
      'parfumerie Douz',
      'Douz',
      'Kébili',
      'Tunisie',
      'KAOUBI PERFUMES',
      'Kaoubi',
      'parfum femme',
      'parfum homme',
      'bakhoor',
      'MRAZIG',
      'عطور',
      'عطور تونس',
      'دوز',
      'قبلي',
      'تونس',
    ],
    alternates: {
      canonical: '/',
      languages: languageAlternates('/'),
    },
    openGraph: {
      type: 'website',
      locale: getOgLocale(locale),
      alternateLocale: locale === 'ar' ? ['fr_TN'] : ['ar_TN'],
      url: siteUrl,
      siteName: 'KAOUBI PERFUMES',
      title: siteTitle,
      description: siteDescription,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: ['/opengraph-image'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/logo-mark.png', type: 'image/png', sizes: '512x512' },
        { url: '/logo-mark.webp', type: 'image/webp', sizes: '512x512' },
      ],
      apple: [{ url: '/logo-mark.png', sizes: '180x180', type: 'image/png' }],
      shortcut: '/favicon.ico',
    },
    other: {
      'content-language': getHtmlLang(locale),
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light',
  themeColor: '#f6e2e7',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getRequestLocale()
  const lang = getHtmlLang(locale)
  const dir = getDirection(locale)

  return (
    <html
      lang={lang}
      dir={dir}
      className={`bg-background ${bodoni.variable} ${montserrat.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`font-sans antialiased ${locale === 'ar' ? 'font-arabic' : ''}`}
        suppressHydrationWarning
      >
        <ThemeScript />
        <StorefrontScale />
        <LocaleProvider locale={locale}>
          <ToastProvider>{children}</ToastProvider>
        </LocaleProvider>
        {process.env.VERCEL === '1' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}
