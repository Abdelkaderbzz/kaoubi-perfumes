'use client'

import { useLocale } from '@/components/locale-provider'
import type { Locale } from '@/lib/i18n'
import { useEffect, useId, useRef, useState } from 'react'

function FranceFlag({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="8" height="16" fill="#002395" />
      <rect x="8" width="8" height="16" fill="#fff" />
      <rect x="16" width="8" height="16" fill="#ED2939" />
    </svg>
  )
}

function SaudiFlag({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="16" fill="#006C35" />
      {/* Simplified shahada band */}
      <rect x="4" y="4.2" width="16" height="1.1" rx="0.4" fill="#fff" />
      <rect x="5.5" y="6.2" width="13" height="1.1" rx="0.4" fill="#fff" />
      <rect x="7" y="8.2" width="10" height="1.1" rx="0.4" fill="#fff" />
      {/* Sword */}
      <path
        d="M5.5 12.2h11.5l1.2-.7M6.2 12.2v1.1"
        fill="none"
        stroke="#fff"
        strokeWidth="0.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const OPTIONS: {
  value: Locale
  label: string
  code: string
  Flag: typeof FranceFlag
}[] = [
  { value: 'fr', label: 'Français', code: 'FR', Flag: FranceFlag },
  { value: 'ar', label: 'العربية', code: 'AR', Flag: SaudiFlag },
]

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, isPending, dictionary } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const active = OPTIONS.find((option) => option.value === locale) ?? OPTIONS[0]
  const ActiveFlag = active.Flag

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        disabled={isPending}
        aria-label={dictionary.nav.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-1.5 text-foreground transition-colors hover:text-primary disabled:opacity-60"
      >
        <ActiveFlag className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-border/60" />
        <span className="text-[11px] font-medium tracking-[0.14em]">{active.code}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
          className={`opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={dictionary.nav.language}
          className="absolute end-0 top-full z-50 mt-1 min-w-[8.5rem] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg shadow-foreground/10"
        >
          {OPTIONS.map((option) => {
            const selected = locale === option.value
            const Flag = option.Flag
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setLocale(option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-start text-sm transition-colors disabled:opacity-60 ${
                    selected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <Flag className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-border/60" />
                  <span className="text-[11px] font-medium tracking-[0.14em]">{option.code}</span>
                  <span className="ms-auto text-xs text-muted-foreground">{option.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
