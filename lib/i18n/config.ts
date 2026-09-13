export const locales = ['fr', 'ar'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fr'

export const LOCALE_COOKIE = 'kaoubi-locale'

export function isLocale(value: unknown): value is Locale {
  return value === 'fr' || value === 'ar'
}

export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function getHtmlLang(locale: Locale): string {
  return locale === 'ar' ? 'ar' : 'fr'
}

export function getBcp47Locale(locale: Locale): string {
  return locale === 'ar' ? 'ar-TN' : 'fr-TN'
}

export function getOgLocale(locale: Locale): string {
  return locale === 'ar' ? 'ar_TN' : 'fr_TN'
}
