'use client'

import { useDictionary } from '@/components/locale-provider'
import { applyTheme, readDocumentTheme, type Theme } from '@/lib/theme'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.5M12 19.5V21M4.93 4.93l1.06 1.06M17.99 17.99l1.06 1.06M3 12h1.5M19.5 12H21M4.93 19.07l1.06-1.06M17.99 6.01l1.06-1.06" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z" />
    </svg>
  )
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const dictionary = useDictionary()

  function toggle() {
    const next: Theme = readDocumentTheme() === 'dark' ? 'light' : 'dark'
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dictionary.theme.toggle}
      title={dictionary.theme.toggle}
      className={`relative flex min-h-11 min-w-11 items-center justify-center text-foreground transition-colors hover:text-primary ${className}`}
    >
      <span className="dark:hidden">
        <MoonIcon />
        <span className="sr-only">{dictionary.theme.dark}</span>
      </span>
      <span className="hidden dark:inline">
        <SunIcon />
        <span className="sr-only">{dictionary.theme.light}</span>
      </span>
    </button>
  )
}
