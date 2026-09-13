'use client'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { useCart } from '@/components/cart-context'
import { useDictionary } from '@/components/locale-provider'
import { FacebookIcon, InstagramIcon, TikTokIcon } from '@/components/social-icons'
import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from '@/lib/social-links'
import type { StoreCategory } from '@/lib/store-categories'
import { CaretDown, Handbag } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

const socialIconCls =
  'flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-primary/5 hover:text-primary'

const desktopLinkCls =
  'text-[13px] font-medium tracking-[0.16em] text-foreground/80 transition-colors hover:text-primary'

function SocialLinks() {
  return (
    <>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram KAOUBI PERFUMES"
        className={socialIconCls}
      >
        <InstagramIcon />
      </a>
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok KAOUBI PERFUMES"
        className={socialIconCls}
      >
        <TikTokIcon />
      </a>
      <a
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook Beit El Otour"
        className={socialIconCls}
      >
        <FacebookIcon />
      </a>
    </>
  )
}

export function Navbar({ storeCategories }: { storeCategories: StoreCategory[] }) {
  const { count } = useCart()
  const dictionary = useDictionary()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const collectionsId = useId()

  useEffect(() => {
    if (!collectionsOpen) return

    function onPointerDown(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setCollectionsOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setCollectionsOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [collectionsOpen])

  useEffect(() => {
    if (menuOpen) setCollectionsOpen(false)
  }, [menuOpen])

  function closeMenus() {
    setMenuOpen(false)
    setCollectionsOpen(false)
  }

  function closeMenusAfterNavigate() {
    window.setTimeout(closeMenus, 0)
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur-md supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-3" prefetch aria-label={dictionary.nav.homeAria}>
          <Logo size="sm" priority />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <Link href="/products" prefetch onClick={closeMenus} className={desktopLinkCls}>
            {dictionary.nav.boutique}
          </Link>
          {storeCategories.length > 0 ? (
            <button
              type="button"
              className={`${desktopLinkCls} inline-flex items-center gap-1.5 ${collectionsOpen ? 'text-primary' : ''}`}
              aria-expanded={collectionsOpen}
              aria-controls={collectionsId}
              aria-haspopup="true"
              aria-label={dictionary.nav.collectionsAria}
              onClick={() => setCollectionsOpen((open) => !open)}
            >
              {dictionary.nav.collections}
              <CaretDown
                size={12}
                weight="bold"
                aria-hidden
                className={`opacity-70 transition-transform duration-200 ${collectionsOpen ? 'rotate-180' : ''}`}
              />
            </button>
          ) : null}
        </nav>

        {collectionsOpen && storeCategories.length > 0 ? (
          <div
            id={collectionsId}
            role="region"
            aria-label={dictionary.nav.collections}
            className="absolute inset-x-0 top-full hidden border-b border-border/80 bg-card/98 shadow-[0_18px_40px_-24px_rgba(58,34,40,0.45)] lg:block"
          >
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-7">
              <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                {storeCategories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/products?category=${category.slug}`}
                    prefetch
                    onClick={closeMenusAfterNavigate}
                    className="group rounded-md px-3 py-3 transition-colors hover:bg-secondary/40"
                  >
                    <p className="font-serif text-[1.05rem] leading-snug text-foreground transition-colors group-hover:text-primary">
                      {category.name}
                    </p>
                    {category.tagline ? (
                      <p className="mt-1 line-clamp-2 text-xs font-light leading-relaxed text-muted-foreground">
                        {category.tagline}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
              <div className="mt-4 border-t border-border/60 pt-4">
                <Link
                  href="/products"
                  prefetch
                  onClick={closeMenusAfterNavigate}
                  className="inline-flex text-[12px] font-medium tracking-[0.16em] text-foreground/70 transition-colors hover:text-primary"
                >
                  {dictionary.home.allBoutique}
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <div className="hidden items-center gap-0.5 lg:flex">
            <SocialLinks />
          </div>
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/checkout"
            prefetch
            aria-label={dictionary.nav.cartWithCount(count)}
            className="relative flex min-h-11 min-w-11 items-center justify-center gap-2 text-sm font-medium tracking-widest text-foreground transition-colors hover:text-primary"
          >
            <Handbag size={20} weight="regular" aria-hidden />
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
            <Link
              href="/products"
              prefetch
              onClick={closeMenusAfterNavigate}
              className="flex min-h-12 items-center border-b border-border/50 text-sm font-medium tracking-wide text-foreground hover:text-primary"
            >
              {dictionary.nav.boutique}
            </Link>
            {storeCategories.length > 0 ? (
              <p className="pt-4 pb-1 text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
                {dictionary.nav.collections}
              </p>
            ) : null}
            {storeCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                prefetch
                onClick={closeMenusAfterNavigate}
                className="flex min-h-12 items-center border-b border-border/50 text-sm font-medium tracking-wide text-foreground last:border-b-0 hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
            <div className="flex items-center gap-3 pt-4">
              <SocialLinks />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
