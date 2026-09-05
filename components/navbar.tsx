'use client'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { useCart } from '@/components/cart-context'
import { useDictionary } from '@/components/locale-provider'
import { InstagramIcon, TikTokIcon } from '@/components/instagram-section-static'
import { INSTAGRAM_URL, TIKTOK_URL } from '@/lib/social-links'
import type { StoreCategory } from '@/lib/store-categories'
import Link from 'next/link'
import { useState } from 'react'

const socialIconCls =
  'flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-primary/5 hover:text-primary'

export function Navbar({ storeCategories }: { storeCategories: StoreCategory[] }) {
  const { count } = useCart()
  const dictionary = useDictionary()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '/products', label: dictionary.nav.boutique },
    ...storeCategories.map((category) => ({
      href: `/products?category=${category.slug}`,
      label: category.name.toUpperCase(),
    })),
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur-md supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-1.5 sm:px-4 sm:py-2">
        <Link href="/" className="flex shrink-0 items-center gap-3" prefetch aria-label={dictionary.nav.homeAria}>
          <Logo size="sm" priority />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              className="text-xs font-medium tracking-[0.18em] text-foreground/80 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-1">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Water of Gold"
              className={socialIconCls}
            >
              <InstagramIcon />
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok Water of Gold"
              className={socialIconCls}
            >
              <TikTokIcon />
            </a>
          </div>
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/checkout"
            prefetch
            aria-label={dictionary.nav.cartWithCount(count)}
            className="relative flex min-h-11 min-w-11 items-center justify-center gap-2 text-sm font-medium tracking-widest text-foreground transition-colors hover:text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="sr-only">{dictionary.nav.cart}</span>
            {count > 0 && (
              <span className="absolute end-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5 lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? dictionary.nav.closeMenu : dictionary.nav.openMenu}
          >
            <span className={`block h-px w-6 bg-foreground transition-all ${menuOpen ? 'translate-y-2.5 rotate-45' : ''}`} />
            <span className={`block h-px w-6 bg-foreground transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-6 bg-foreground transition-all ${menuOpen ? '-translate-y-2.5 -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-card px-3 py-3 sm:px-4 sm:py-5 lg:hidden">
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center border-b border-border/50 text-sm font-medium tracking-wide text-foreground last:border-b-0 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 pt-4">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Water of Gold"
                className={socialIconCls}
              >
                <InstagramIcon />
              </a>
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok Water of Gold"
                className={socialIconCls}
              >
                <TikTokIcon />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
