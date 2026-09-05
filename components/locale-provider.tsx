'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  defaultLocale,
  getDirection,
  getDictionary,
  isLocale,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale,
} from '@/lib/i18n'

type LocaleContextValue = {
  locale: Locale
  dictionary: Dictionary
  dir: 'ltr' | 'rtl'
  setLocale: (locale: Locale) => void
  isPending: boolean
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function writeLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${maxAge};samesite=lax`
}

export function LocaleProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const locale = isLocale(initialLocale) ? initialLocale : defaultLocale
  const dictionary = useMemo(() => getDictionary(locale), [locale])
  const dir = getDirection(locale)

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return
      writeLocaleCookie(next)
      document.documentElement.lang = next === 'ar' ? 'ar' : 'fr'
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
      startTransition(() => {
        router.refresh()
      })
    },
    [locale, router],
  )

  const value = useMemo(
    () => ({ locale, dictionary, dir, setLocale, isPending }),
    [locale, dictionary, dir, setLocale, isPending],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return ctx
}

export function useDictionary() {
  return useLocale().dictionary
}
