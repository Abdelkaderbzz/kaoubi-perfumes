'use client'

import { Moon, Sun } from '@phosphor-icons/react'
import { useDictionary } from '@/components/locale-provider'
import { applyTheme, readDocumentTheme, type Theme } from '@/lib/theme'

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
        <Moon size={18} weight="regular" aria-hidden />
        <span className="sr-only">{dictionary.theme.dark}</span>
      </span>
      <span className="hidden dark:inline">
        <Sun size={18} weight="regular" aria-hidden />
        <span className="sr-only">{dictionary.theme.light}</span>
      </span>
    </button>
  )
}
