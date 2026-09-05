import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bodoni_Moda, Josefin_Sans } from 'next/font/google'
import localFont from 'next/font/local'
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

const josefin = Josefin_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})

const thmanyahArabic = localFont({
  src: [
    { path: './fonts/thmanyah/thmanyahsans-Light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/thmanyah/thmanyahsans-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/thmanyah/thmanyahsans-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/thmanyah/thmanyahsans-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/thmanyah/thmanyahsans-Black.woff2', weight: '900', style: 'normal' },
  ],
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
      template: '%s | Water of Gold',
    },
    description: siteDescription,
    applicationName: 'Water of Gold',
    authors: [{ name: 'Water of Gold' }],
    creator: 'Water of Gold',
    publisher: 'Water of Gold',
    keywords: [
      'parfum',
      'parfumerie',
      'Sousse',
      'Tunisie',
      'Water of Gold',
      'عطور',
      'سوسة',
      'تونس',
      'parfum femme',
      'parfum homme',
    ],
    alternates: {
      canonical: '/',
      languages: {
        'x-default': '/',
        'fr-TN': '/',
        fr: '/',
        'ar-TN': '/',
        ar: '/',
      },
    },
    openGraph: {
      type: 'website',
      locale: getOgLocale(locale),
      alternateLocale: locale === 'ar' ? ['fr_TN'] : ['ar_TN'],
      url: siteUrl,
      siteName: 'Water of Gold',
      title: siteTitle,
      description: siteDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
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
      icon: [{ url: '/logo.webp', type: 'image/webp' }],
      apple: [{ url: '/logo.png' }],
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
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6efdc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0b' },
  ],
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
      className={`bg-background ${bodoni.variable} ${josefin.variable} ${thmanyahArabic.variable}`}
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
        {process.env.VERCEL === '1' && <Analytics />}
      </body>
    </html>
  )
}
