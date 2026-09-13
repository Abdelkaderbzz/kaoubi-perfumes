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
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

const socialIconCls =
  'flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-primary/5 hover:text-primary'

const desktopLinkCls =
  'text-[13px] font-medium tracking-[0.12em] text-foreground/80 whitespace-nowrap transition-colors hover:text-primary'

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

function DesktopCategoryNav({
  categories,
  boutiqueLabel,
  collectionsLabel,
  collectionsAria,
  allBoutiqueLabel,
  collectionsOpen,
  collectionsId,
  onToggleCollections,
  onNavigate,
}: {
  categories: StoreCategory[]
  boutiqueLabel: string
  collectionsLabel: string
  collectionsAria: string
  allBoutiqueLabel: string
  collectionsOpen: boolean
  collectionsId: string
  onToggleCollections: () => void
  onNavigate: () => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const sizerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(categories.length)

  useLayoutEffect(() => {
    const row = rowRef.current
    const sizer = sizerRef.current
    if (!row || !sizer) return

    function measure() {
      const available = row.clientWidth
      const boutique = sizer.querySelector<HTMLElement>('[data-nav-boutique]')
      const more = sizer.querySelector<HTMLElement>('[data-nav-more]')
      const items = [...sizer.querySelectorAll<HTMLElement>('[data-nav-item]')]
      if (!boutique) return

      const styles = getComputedStyle(sizer)
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 28
      const moreWidth = more?.offsetWidth ?? 0
      let used = boutique.offsetWidth
      let visible = 0

      for (let index = 0; index < items.length; index += 1) {
        const remainingAfter = items.length - (visible + 1)
        const reserve = remainingAfter > 0 ? gap + moreWidth : 0
        const next = used + gap + items[index].offsetWidth
        if (next + reserve <= available + 1) {
          used = next
          visible += 1
        } else {
          break
        }
      }

      setVisibleCount((current) => (current === visible ? current : visible))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [categories, boutiqueLabel, collectionsLabel])

  const visibleCategories = categories.slice(0, visibleCount)
  const overflowCategories = categories.slice(visibleCount)
  const showCollections = overflowCategories.length > 0

  return (
    <div ref={rowRef} className="relative min-w-0 flex-1">
      <div
        ref={sizerRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-y-0 start-0 flex items-center gap-7"
      >
        <span data-nav-boutique="" className={desktopLinkCls}>
          {boutiqueLabel}
        </span>
        {categories.map((category) => (
          <span key={category.slug} data-nav-item="" className={desktopLinkCls}>
            {category.name}
          </span>
        ))}
        <span data-nav-more="" className={`${desktopLinkCls} inline-flex items-center gap-1.5`}>
          {collectionsLabel}
          <CaretDown size={12} weight="bold" />
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-7 overflow-hidden">
        <Link href="/products" prefetch onClick={onNavigate} className={desktopLinkCls}>
          {boutiqueLabel}
        </Link>
        {visibleCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            prefetch
            onClick={onNavigate}
            className={desktopLinkCls}
          >
            {category.name}
          </Link>
        ))}
        {showCollections ? (
          <button
            type="button"
            className={`${desktopLinkCls} inline-flex items-center gap-1.5 ${collectionsOpen ? 'text-primary' : ''}`}
            aria-expanded={collectionsOpen}
            aria-controls={collectionsId}
            aria-haspopup="true"
            aria-label={collectionsAria}
            onClick={onToggleCollections}
          >
            {collectionsLabel}
            <CaretDown
              size={12}
              weight="bold"
              aria-hidden
              className={`opacity-70 transition-transform duration-200 ${collectionsOpen ? 'rotate-180' : ''}`}
            />
          </button>
        ) : null}
      </div>

      {collectionsOpen && showCollections ? (
        <div
          id={collectionsId}
          role="region"
          aria-label={collectionsLabel}
          className="absolute start-0 top-[calc(100%+0.55rem)] z-50 w-[min(22rem,70vw)] rounded-xl border border-border/80 bg-card/98 p-2 shadow-[0_18px_40px_-24px_rgba(58,34,40,0.45)]"
        >
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              prefetch
              onClick={onNavigate}
              className="block rounded-md px-3 py-2.5 transition-colors hover:bg-secondary/50"
            >
              <p className="font-serif text-[1.02rem] text-foreground">{category.name}</p>
              {category.tagline ? (
                <p className="mt-0.5 line-clamp-2 text-xs font-light text-muted-foreground">
                  {category.tagline}
                </p>
              ) : null}
            </Link>
          ))}
          <Link
            href="/products"
            prefetch
            onClick={onNavigate}
            className="mt-1 block border-t border-border/60 px-3 py-2.5 text-[12px] font-medium tracking-[0.14em] text-foreground/70 hover:text-primary"
          >
            {allBoutiqueLabel}
          </Link>
        </div>
      ) : null}
    </div>
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-3" prefetch aria-label={dictionary.nav.homeAria}>
          <Logo size="sm" priority />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center px-4 lg:flex">
          <DesktopCategoryNav
            categories={storeCategories}
            boutiqueLabel={dictionary.nav.boutique}
            collectionsLabel={dictionary.nav.collections}
            collectionsAria={dictionary.nav.collectionsAria}
            allBoutiqueLabel={dictionary.home.allBoutique}
            collectionsOpen={collectionsOpen}
            collectionsId={collectionsId}
            onToggleCollections={() => setCollectionsOpen((open) => !open)}
            onNavigate={closeMenus}
          />
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
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
