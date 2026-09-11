'use client'

import { CategoryPhotos } from '@/components/category-photos'
import { useDictionary } from '@/components/locale-provider'
import { ProductCard } from '@/components/product-card'
import { Reveal } from '@/components/reveal'
import { useRouteTransition } from '@/lib/use-route-transition'
import type { StoreCategory } from '@/lib/store-categories'
import { WEAR_MOMENT_OPTIONS } from '@/lib/product-wear'
import { INTENSITY_LEVELS } from '@/lib/product-intensity'
import { CaretDown, MagnifyingGlass, Sliders, X } from '@phosphor-icons/react'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

type Product = {
  id: number
  name: string
  brand: string
  price: string
  compareAtPrice?: string | null
  imageUrl: string | null
  category: string
  inStock: boolean
  sizes?: string | null
  promoTagEnabled?: boolean | null
  promoTagLabel?: string | null
  promoTagBgColor?: string | null
  promoTagTextColor?: string | null
}

const SEASON_VALUES = new Set(['ete', 'hiver', 'printemps', 'automne'])
const MOMENT_VALUES = new Set(['jour', 'nuit'])

export function ProductsClient({
  products,
  total,
  page,
  totalPages,
  search: initialSearch,
  category,
  wear,
  intensity,
  storeCategories,
}: {
  products: Product[]
  total: number
  page: number
  totalPages: number
  search: string
  category: string
  wear: string[]
  intensity: string
  storeCategories: StoreCategory[]
}) {
  const pathname = usePathname()
  const dictionary = useDictionary()
  const wearLabels = dictionary.wear as Record<string, string>
  const intensityLabels = dictionary.intensity as Record<string, string>
  const { isPending, push } = useRouteTransition()
  const [search, setSearch] = useState(initialSearch)
  const hasSecondaryFilters = wear.length > 0 || Boolean(intensity)
  const [filtersOpen, setFiltersOpen] = useState(hasSecondaryFilters)

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    if (hasSecondaryFilters) setFiltersOpen(true)
  }, [hasSecondaryFilters])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [category, page])

  const allCategories = useMemo(
    () => [
      { value: 'all', label: dictionary.products.all },
      ...storeCategories.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    ],
    [storeCategories, dictionary.products.all],
  )

  const seasonOptions = WEAR_MOMENT_OPTIONS.filter((option) => SEASON_VALUES.has(option.value)).map(
    (option) => ({ ...option, label: wearLabels[option.value] ?? option.label }),
  )
  const momentOptions = WEAR_MOMENT_OPTIONS.filter((option) => MOMENT_VALUES.has(option.value)).map(
    (option) => ({ ...option, label: wearLabels[option.value] ?? option.label }),
  )
  const intensityOptions = INTENSITY_LEVELS.map((level) => ({
    ...level,
    label: intensityLabels[level.value] ?? level.label,
  }))

  function syncUrl(overrides: {
    search?: string
    category?: string
    wear?: string[]
    intensity?: string
    page?: number
  }) {
    const nextSearch = overrides.search ?? search
    const nextCategory = overrides.category ?? category
    const nextWear = overrides.wear ?? wear
    const nextIntensity = overrides.intensity ?? intensity
    const nextPage = overrides.page ?? 1

    const params = new URLSearchParams()
    if (nextSearch.trim()) params.set('search', nextSearch.trim())
    if (nextCategory !== 'all') params.set('category', nextCategory)
    if (nextWear.length > 0) params.set('wear', nextWear.join(','))
    if (nextIntensity) params.set('intensity', nextIntensity)
    if (nextPage > 1) params.set('page', String(nextPage))

    const query = params.toString()
    push(query ? `${pathname}?${query}` : pathname)
  }

  const activeChips: { key: string; label: string; onClear: () => void }[] = []
  if (initialSearch.trim()) {
    activeChips.push({
      key: 'search',
      label: `« ${initialSearch.trim()} »`,
      onClear: () => {
        setSearch('')
        syncUrl({ search: '' })
      },
    })
  }
  for (const tag of wear) {
    activeChips.push({
      key: `wear-${tag}`,
      label: wearLabels[tag] ?? tag,
      onClear: () => syncUrl({ wear: wear.filter((value) => value !== tag) }),
    })
  }
  if (intensity) {
    activeChips.push({
      key: 'intensity',
      label: intensityLabels[intensity] ?? intensity,
      onClear: () => syncUrl({ intensity: '' }),
    })
  }

  function selectCategory(value: string) {
    if (value === category || isPending) return
    syncUrl({ category: value })
  }

  function toggleWear(value: string) {
    if (isPending) return
    const next = wear.includes(value) ? wear.filter((tag) => tag !== value) : [...wear, value]
    syncUrl({ wear: next })
  }

  function selectIntensity(value: string) {
    if (isPending) return
    syncUrl({ intensity: intensity === value ? '' : value })
  }

  function clearSecondaryFilters() {
    if (isPending) return
    syncUrl({ wear: [], intensity: '' })
  }

  function clearAllFilters() {
    if (isPending) return
    setSearch('')
    syncUrl({ search: '', wear: [], intensity: '' })
  }

  function submitSearch() {
    if (isPending) return
    syncUrl({ search })
  }

  const activeFilterCount = wear.length + (intensity ? 1 : 0)

  return (
    <>
      <CategoryPhotos category={category} categories={storeCategories} />

      <Reveal className="mb-6 space-y-4 sm:mb-8 sm:space-y-5">
        {/* Search + refine toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault()
              submitSearch()
            }}
          >
            <MagnifyingGlass
              className="pointer-events-none absolute start-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder={dictionary.products.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isPending}
              className="w-full rounded-none border-0 border-b border-border bg-transparent py-3 ps-8 pe-24 text-base font-light text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary disabled:opacity-60 sm:text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="absolute end-0 top-1/2 min-h-11 -translate-y-1/2 px-1 text-[11px] font-medium tracking-[0.2em] text-primary transition-opacity hover:opacity-70 disabled:opacity-40"
            >
              {dictionary.products.search}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            disabled={isPending}
            aria-expanded={filtersOpen}
            aria-label={dictionary.products.refineAria}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border-b px-1 text-[11px] font-medium tracking-[0.18em] transition-colors disabled:opacity-60 sm:mb-px sm:pb-3 sm:pt-2 ${
              filtersOpen || activeFilterCount > 0
                ? 'border-primary text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            <Sliders className="size-3.5" weight="bold" aria-hidden />
            <span>{dictionary.products.refine}</span>
            {activeFilterCount > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : (
              <CaretDown
                className={`size-3.5 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
                weight="bold"
                aria-hidden
              />
            )}
          </button>
        </div>

        {/* Primary: categories as underline tabs */}
        <nav
          aria-label={dictionary.products.categoriesAria}
          className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex min-w-max gap-1 border-b border-border/70">
            {allCategories.map((cat) => {
              const active = category === cat.value
              return (
                <li key={cat.value}>
                  <button
                    type="button"
                    onClick={() => selectCategory(cat.value)}
                    disabled={isPending}
                    className={`relative min-h-11 whitespace-nowrap px-3 py-2.5 text-[11px] font-medium tracking-[0.14em] transition-colors disabled:opacity-60 sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.18em] ${
                      active
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.label.toUpperCase()}
                    {active ? (
                      <span className="absolute inset-x-3 bottom-0 h-px bg-primary" />
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Secondary filters panel */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden" inert={!filtersOpen || undefined}>
            <div className="space-y-5 border border-border/70 bg-card/40 px-4 py-5 sm:px-5">
              <FilterGroup label={dictionary.products.season}>
                {seasonOptions.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={wear.includes(option.value)}
                    disabled={isPending}
                    onClick={() => toggleWear(option.value)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label={dictionary.products.moment}>
                {momentOptions.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    active={wear.includes(option.value)}
                    disabled={isPending}
                    onClick={() => toggleWear(option.value)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label={dictionary.products.intensity}>
                {intensityOptions.map((level) => (
                  <FilterChip
                    key={level.value}
                    label={level.label}
                    active={intensity === level.value}
                    disabled={isPending}
                    onClick={() => selectIntensity(level.value)}
                  />
                ))}
              </FilterGroup>

              {activeFilterCount > 0 ? (
                <div className="flex justify-end border-t border-border/60 pt-3">
                  <button
                    type="button"
                    onClick={clearSecondaryFilters}
                    disabled={isPending}
                    className="text-[11px] font-light tracking-[0.18em] text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline disabled:opacity-60"
                  >
                    {dictionary.products.clearFilters}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Results summary + active chips */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-light tracking-wide text-muted-foreground">
            <span className="text-foreground">{total}</span>
            {total === 1 ? ` ${dictionary.products.perfume}` : ` ${dictionary.products.perfumes}`}
            {category !== 'all'
              ? ` · ${allCategories.find((item) => item.value === category)?.label ?? category}`
              : null}
          </p>

          {activeChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClear}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 border border-primary/25 bg-primary/5 py-1 pl-2.5 pr-1.5 text-[11px] font-light text-primary transition-colors hover:border-primary/50 disabled:opacity-60"
                >
                  {chip.label}
                  <X className="size-3" weight="bold" aria-hidden />
                  <span className="sr-only">{dictionary.products.remove}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                disabled={isPending}
                className="text-[11px] font-light tracking-[0.15em] text-muted-foreground hover:text-primary disabled:opacity-60"
              >
                {dictionary.products.clearAll}
              </button>
            </div>
          ) : null}
        </div>
      </Reveal>

      <div className="relative min-h-[30vh]">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
              {dictionary.products.loading}
            </div>
          </div>
        )}

        {total === 0 ? (
          category !== 'all' && storeCategories.some((item) => item.slug === category) ? (
            <p className="py-8 text-center text-sm font-light tracking-widest text-muted-foreground">
              {dictionary.products.emptyCategory}
            </p>
          ) : (
            <div className="py-24 text-center">
              <p className="text-sm font-light tracking-widest text-muted-foreground">
                {dictionary.products.emptySearch}
              </p>
              {activeChips.length > 0 ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 text-xs font-light tracking-[0.2em] text-primary underline-offset-4 hover:underline"
                >
                  {dictionary.products.resetFilters}
                </button>
              ) : null}
            </div>
          )
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categories={storeCategories.map((item) => ({
                    slug: item.slug,
                    name: item.name,
                  }))}
                  priority={index < 4}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-sm font-light text-muted-foreground">
                  {dictionary.products.pageOf(page, totalPages, total)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isPending}
                    onClick={() => syncUrl({ page: page - 1 })}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-xs font-light tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                      className="rtl:rotate-180"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                    {dictionary.products.previous}
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || isPending}
                    onClick={() => syncUrl({ page: page + 1 })}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-xs font-light tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {dictionary.products.next}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                      className="rtl:rotate-180"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-6">
      <p className="w-24 shrink-0 pt-1.5 text-[10px] font-light tracking-[0.28em] text-muted-foreground">
        {label.toUpperCase()}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`min-h-10 border px-3.5 py-2 text-xs font-medium tracking-wide transition-colors disabled:opacity-60 sm:text-[11px] sm:font-light ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/80 text-muted-foreground hover:border-primary/40 hover:text-primary'
      }`}
    >
      {label}
    </button>
  )
}
