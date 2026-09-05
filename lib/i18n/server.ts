import { cookies } from 'next/headers'
import {
  defaultLocale,
  getDirection,
  getHtmlLang,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from './config'
import { getDictionary, type Dictionary } from './dictionaries'

export async function getRequestLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : defaultLocale
}

export async function getRequestDictionary(): Promise<{
  locale: Locale
  dictionary: Dictionary
  dir: 'ltr' | 'rtl'
  lang: string
}> {
  const locale = await getRequestLocale()
  return {
    locale,
    dictionary: getDictionary(locale),
    dir: getDirection(locale),
    lang: getHtmlLang(locale),
  }
}
