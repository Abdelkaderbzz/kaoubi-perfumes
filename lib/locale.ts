import {
  defaultLocale,
  getBcp47Locale,
  getHtmlLang,
  getOgLocale,
  type Locale,
} from '@/lib/i18n/config'

/** @deprecated Prefer getRequestLocale() / getBcp47Locale(locale). Kept for admin. */
export const SITE_LANG = getHtmlLang(defaultLocale)
export const SITE_LOCALE = getBcp47Locale(defaultLocale)
export const SITE_OG_LOCALE = getOgLocale(defaultLocale)

export function formatDateFr(value: Date | string | number, locale: Locale = defaultLocale) {
  return new Date(value).toLocaleDateString(getBcp47Locale(locale))
}
