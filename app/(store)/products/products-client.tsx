'use client'

import { CategoryPhotos } from '@/components/category-photos'
import { useDictionary } from '@/components/locale-provider'
import { ProductCard } from '@/components/product-card'
import { Reveal } from '@/components/reveal'
import { useRouteTransition } from '@/lib/use-route-transition'
import type { StoreCategory } from '@/lib/store-categories'
import { WEAR_MOMENT_OPTIONS } from '@/lib/product-wear'
import { getIntensityStep, INTENSITY_LEVELS } from '@/lib/product-intensity'
import { PRODUCT_SEX_OPTIONS } from '@/lib/product-sex'
import { FRAGRANCE_NOTE_OPTIONS } from '@/lib/fragrance-notes'
import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_SORTS,
  type ProductSort,
} from '@/lib/product-sort'
import { STORE_PAGE_SIZE, storePageItems } from '@/lib/pagination'
import { StoreListbox } from '@/components/store-listbox'
import { CaretLeft, CaretRight, MagnifyingGlass, Sliders, X } from '@phosphor-icons/react'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

const SEARCH_DEBOUNCE_MS = 350
const INTENSITY_DEBOUNCE_MS = 400

type Product = {
  id: number
  name: string
  brand: string
  price: string
  compareAtPrice?: string | null
  imageUrl: string | null
  category: string
  sex?: string | null
  fragranceNotes?: string | null
  inStock: boolean
  sizes?: string | null
  promoTagEnabled?: boolean | null
  promoTagLabel?: string | null
  promoTagBgColor?: string | null
  promoTagTextColor?: string | null
}

type ChipOption = { value: string; label: string }

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
  notes,
  intensity,
  sex,
  sort,
  storeCategories,
}: {
  products: Product[]
  total: number
  page: number
  totalPages: number
  search: string
  category: string
  wear: string[]
  notes: string[]
  intensity: string
  sex: string
  sort: ProductSort
  storeCategories: StoreCategory[]
}) {
  const pathname = usePathname()
  const dictionary = useDictionary()
  const wearLabels = dictionary.wear as Record<string, string>
  const noteLabels = dictionary.fragranceNotes as Record<string, string>
  const intensityLabels = dictionary.intensity as Record<string, string>
  const sexLabels = dictionary.sex as Record<string, string>
  const { isPending, push, replace } = useRouteTransition()
  const [search, setSearch] = useState(initialSearch)
  const committedSearchRef = useRef(initialSearch)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const wasInSync = search.trim() === committedSearchRef.current.trim()
    committedSearchRef.current = initialSearch
    if (wasInSync) setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [category, page, sort])

  useEffect(() => {
    if (!filtersOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setFiltersOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [filtersOpen])

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
  const noteOptions = FRAGRANCE_NOTE_OPTIONS.map((note) => ({
    ...note,
    label: noteLabels[note.value] ?? note.label,
  }))
  const sexOptions = PRODUCT_SEX_OPTIONS.map((item) => ({
    ...item,
    label: sexLabels[item.value] ?? item.label,
  }))

  function syncUrl(
    overrides: {
      search?: string
      category?: string
      wear?: string[]
      notes?: string[]
      intensity?: string
      sex?: string
      sort?: ProductSort
      page?: number
    },
    options?: { replace?: boolean },
  ) {
    const nextSearch = overrides.search ?? search
    const nextCategory = overrides.category ?? category
    const nextWear = overrides.wear ?? wear
    const nextNotes = overrides.notes ?? notes
    const nextIntensity = overrides.intensity ?? intensity
    const nextSex = overrides.sex ?? sex
    const nextSort = overrides.sort ?? sort
    const nextPage = overrides.page ?? 1

    const params = new URLSearchParams()
    if (nextSearch.trim()) params.set('search', nextSearch.trim())
    if (nextCategory !== 'all') params.set('category', nextCategory)
    if (nextWear.length > 0) params.set('wear', nextWear.join(','))
    if (nextNotes.length > 0) params.set('notes', nextNotes.join(','))
    if (nextIntensity) params.set('intensity', nextIntensity)
    if (nextSex) params.set('sex', nextSex)
    if (nextSort !== DEFAULT_PRODUCT_SORT) params.set('sort', nextSort)
    if (nextPage > 1) params.set('page', String(nextPage))

    const query = params.toString()
    const href = query ? `${pathname}?${query}` : pathname
    if (options?.replace) replace(href)
    else push(href)
  }

  useEffect(() => {
    if (search.trim() === initialSearch.trim()) return

    const timeoutId = window.setTimeout(() => {
      syncUrl({ search }, { replace: true })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [search])

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
  if (sex) {
    activeChips.push({
      key: 'sex',
      label: sexLabels[sex] ?? sex,
      onClear: () => syncUrl({ sex: '' }),
    })
  }
  if (intensity) {
    activeChips.push({
      key: 'intensity',
      label: intensityLabels[intensity] ?? intensity,
      onClear: () => syncUrl({ intensity: '' }),
    })
  }
  for (const tag of wear) {
    activeChips.push({
      key: `wear-${tag}`,
      label: wearLabels[tag] ?? tag,
      onClear: () => syncUrl({ wear: wear.filter((value) => value !== tag) }),
    })
  }
  for (const tag of notes) {
    activeChips.push({
      key: `note-${tag}`,
      label: noteLabels[tag] ?? tag,
      onClear: () => syncUrl({ notes: notes.filter((value) => value !== tag) }),
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

  function toggleNote(value: string) {
    if (isPending) return
    const next = notes.includes(value) ? notes.filter((tag) => tag !== value) : [...notes, value]
    syncUrl({ notes: next })
  }

  function selectIntensity(value: string) {
    if (value === intensity) return
    syncUrl({ intensity: value }, { replace: true })
  }

  function selectSex(value: string) {
    if (isPending) return
    syncUrl({ sex: sex === value ? '' : value })
  }

  function selectSort(value: ProductSort) {
    if (isPending || value === sort) return
    syncUrl({ sort: value })
  }

  function clearSecondaryFilters() {
    if (isPending) return
    syncUrl({ wear: [], notes: [], intensity: '', sex: '' })
  }

  function clearAllFilters() {
    if (isPending) return
    setSearch('')
    syncUrl({ search: '', wear: [], notes: [], intensity: '', sex: '' })
  }

  function submitSearch() {
    if (search.trim() === initialSearch.trim()) return
    syncUrl({ search }, { replace: true })
  }

  const activeFilterCount =
    wear.length + notes.length + (intensity ? 1 : 0) + (sex ? 1 : 0)
  const sortLabels: Record<ProductSort, string> = {
    newest: dictionary.products.sortNewest,
    'price-asc': dictionary.products.sortPriceAsc,
    'price-desc': dictionary.products.sortPriceDesc,
    'name-asc': dictionary.products.sortNameAsc,
    'name-desc': dictionary.products.sortNameDesc,
  }

  const filterPanelProps = {
    seasonLabel: dictionary.products.season,
    momentLabel: dictionary.products.moment,
    notesLabel: dictionary.products.olfactiveProfile,
    intensityLabel: dictionary.products.intensity,
    intensityAllLabel: dictionary.products.intensityAll,
    intensityAria: dictionary.products.intensityAria,
    sexLabel: dictionary.products.sex,
    clearLabel: dictionary.products.clearFilters,
    seasonOptions,
    momentOptions,
    noteOptions,
    intensityOptions,
    sexOptions,
    wear,
    notes,
    intensity,
    sex,
    disabled: isPending,
    activeFilterCount,
    onToggleWear: toggleWear,
    onToggleNote: toggleNote,
    onSelectIntensity: selectIntensity,
    onSelectSex: selectSex,
    onClear: clearSecondaryFilters,
  }

  return (
    <>
      <CategoryPhotos category={category} categories={storeCategories} />

      <Reveal className="mb-6 space-y-4 sm:mb-8 sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <form
            className="relative min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault()
              submitSearch()
            }}
          >
            <MagnifyingGlass
              className="pointer-events-none absolute inset-s-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder={dictionary.products.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              aria-label={dictionary.products.searchPlaceholder}
              className="w-full rounded-none border-0 border-b border-border bg-transparent py-3 ps-8 text-base font-light text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary sm:text-sm"
            />
          </form>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            disabled={isPending}
            aria-expanded={filtersOpen}
            aria-controls="store-filters-drawer"
            aria-label={dictionary.products.refineAria}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border-b px-1 text-[11px] font-medium tracking-[0.18em] transition-colors disabled:opacity-60 lg:hidden sm:mb-px sm:pb-3 sm:pt-2 ${
              activeFilterCount > 0
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
            ) : null}
          </button>
        </div>

        <nav
          aria-label={dictionary.products.categoriesAria}
          className="-mx-4 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden"
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
      </Reveal>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:w-60 lg:shrink-0">
          <div className="border border-border bg-card/40 px-4 py-5">
            <p className="mb-5 text-[11px] font-medium tracking-[0.22em] text-foreground">
              {dictionary.products.filtersTitle.toUpperCase()}
            </p>
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>

        {filtersOpen ? (
          <div className="fixed inset-0 z-60 lg:hidden" id="store-filters-drawer">
            <button
              type="button"
              className="absolute inset-0 bg-foreground/30"
              aria-label={dictionary.products.closeFilters}
              onClick={() => setFiltersOpen(false)}
            />
            <aside className="absolute inset-y-0 inset-s-0 flex w-[min(20.5rem,88vw)] flex-col border-e border-border bg-background shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                <p className="text-[11px] font-medium tracking-[0.22em] text-foreground">
                  {dictionary.products.filtersTitle.toUpperCase()}
                </p>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="inline-flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={dictionary.products.closeFilters}
                >
                  <X className="size-4" weight="bold" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-5">
                <FilterPanel {...filterPanelProps} />
              </div>
            </aside>
          </div>
        ) : null}

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-xs font-light tracking-wide text-muted-foreground">
              <span className="text-foreground">{total}</span>
              {total === 1 ? ` ${dictionary.products.perfume}` : ` ${dictionary.products.perfumes}`}
              {category !== 'all'
                ? ` · ${allCategories.find((item) => item.value === category)?.label ?? category}`
                : null}
            </p>

            <StoreListbox
              className="shrink-0"
              label={dictionary.products.sort.toUpperCase()}
              ariaLabel={dictionary.products.sortAria}
              value={sort}
              disabled={isPending}
              onChange={(value) => selectSort(value as ProductSort)}
              options={PRODUCT_SORTS.map((value) => ({
                value,
                label: sortLabels[value],
              }))}
            />
          </div>

          {activeChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClear}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 border border-primary/25 bg-primary/5 py-1 ps-2.5 pe-1.5 text-[11px] font-light text-primary transition-colors hover:border-primary/50 disabled:opacity-60"
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
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      categories={storeCategories.map((item) => ({
                        slug: item.slug,
                        name: item.name,
                      }))}
                      highlightedNotes={notes}
                      priority={index < 4}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <StorePagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={STORE_PAGE_SIZE}
                    isPending={isPending}
                    onPageChange={(nextPage) => syncUrl({ page: nextPage })}
                    labels={{
                      showingRange: dictionary.products.showingRange,
                      goToPage: dictionary.products.goToPage,
                      previous: dictionary.products.previous,
                      next: dictionary.products.next,
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function StorePagination({
  page,
  totalPages,
  total,
  pageSize,
  isPending,
  onPageChange,
  labels,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isPending: boolean
  onPageChange: (page: number) => void
  labels: {
    showingRange: (start: number, end: number, total: number) => string
    goToPage: (page: number) => string
    previous: string
    next: string
  }
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const items = storePageItems(page, totalPages)

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between"
    >
      <p className="text-sm font-medium text-foreground/80">
        {labels.showingRange(start, end, total)}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1 || isPending}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold tracking-wide text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CaretLeft size={14} weight="bold" className="rtl:rotate-180" />
          {labels.previous}
        </button>
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="min-w-8 px-1 text-center text-sm font-medium text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={isPending}
              aria-current={item === page ? 'page' : undefined}
              aria-label={labels.goToPage(item)}
              onClick={() => onPageChange(item)}
              className={`min-h-10 min-w-10 rounded-full text-sm font-semibold tabular-nums transition-colors ${
                item === page
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages || isPending}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold tracking-wide text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {labels.next}
          <CaretRight size={14} weight="bold" className="rtl:rotate-180" />
        </button>
      </div>
    </nav>
  )
}

function FilterPanel({
  seasonLabel,
  momentLabel,
  notesLabel,
  intensityLabel,
  intensityAllLabel,
  intensityAria,
  sexLabel,
  clearLabel,
  seasonOptions,
  momentOptions,
  noteOptions,
  intensityOptions,
  sexOptions,
  wear,
  notes,
  intensity,
  sex,
  disabled,
  activeFilterCount,
  onToggleWear,
  onToggleNote,
  onSelectIntensity,
  onSelectSex,
  onClear,
}: {
  seasonLabel: string
  momentLabel: string
  notesLabel: string
  intensityLabel: string
  intensityAllLabel: string
  intensityAria: string
  sexLabel: string
  clearLabel: string
  seasonOptions: ChipOption[]
  momentOptions: ChipOption[]
  noteOptions: ChipOption[]
  intensityOptions: ChipOption[]
  sexOptions: ChipOption[]
  wear: string[]
  notes: string[]
  intensity: string
  sex: string
  disabled?: boolean
  activeFilterCount: number
  onToggleWear: (value: string) => void
  onToggleNote: (value: string) => void
  onSelectIntensity: (value: string) => void
  onSelectSex: (value: string) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-5">
      <FilterGroup label={sexLabel}>
        {sexOptions.map((item) => (
          <FilterChip
            key={item.value}
            label={item.label}
            active={sex === item.value}
            disabled={disabled}
            onClick={() => onSelectSex(item.value)}
          />
        ))}
      </FilterGroup>

      <IntensitySlider
        label={intensityLabel}
        allLabel={intensityAllLabel}
        ariaLabel={intensityAria}
        options={intensityOptions}
        value={intensity}
        onSelect={onSelectIntensity}
      />

      <FilterGroup label={seasonLabel}>
        {seasonOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={wear.includes(option.value)}
            disabled={disabled}
            onClick={() => onToggleWear(option.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={momentLabel}>
        {momentOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={wear.includes(option.value)}
            disabled={disabled}
            onClick={() => onToggleWear(option.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={notesLabel}>
        {noteOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={notes.includes(option.value)}
            disabled={disabled}
            onClick={() => onToggleNote(option.value)}
          />
        ))}
      </FilterGroup>

      {activeFilterCount > 0 ? (
        <div className="border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="text-[11px] font-medium tracking-[0.16em] text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline disabled:opacity-60"
          >
            {clearLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function IntensitySlider({
  label,
  allLabel,
  ariaLabel,
  options,
  value,
  onSelect,
}: {
  label: string
  allLabel: string
  ariaLabel: string
  options: ChipOption[]
  value: string
  onSelect: (value: string) => void
}) {
  const max = options.length
  const committed = getIntensityStep(value)
  const [step, setStep] = useState(committed)
  const debounceRef = useRef<number | null>(null)
  const latestStepRef = useRef(committed)

  useEffect(() => {
    if (debounceRef.current) return
    latestStepRef.current = committed
    setStep(committed)
  }, [committed])

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [])

  const progress = max > 0 ? (step / max) * 100 : 0
  const currentLabel = step === 0 ? allLabel : (options[step - 1]?.label ?? allLabel)

  function valueFromStep(next: number) {
    return next === 0 ? '' : options[next - 1]?.value ?? ''
  }

  function preview(next: number) {
    const clamped = Math.min(max, Math.max(0, next))
    latestStepRef.current = clamped
    setStep(clamped)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null
      const selected = valueFromStep(clamped)
      if (selected !== value) onSelect(selected)
    }, INTENSITY_DEBOUNCE_MS)
  }

  function flush() {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    const selected = valueFromStep(latestStepRef.current)
    if (selected !== value) onSelect(selected)
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium tracking-[0.22em] text-foreground">
          {label.toUpperCase()}
        </p>
        <p
          className={`text-[11px] font-medium tracking-wide ${
            step === 0 ? 'text-foreground/70' : 'text-primary'
          }`}
        >
          {currentLabel}
        </p>
      </div>

      <div
        dir="ltr"
        className="relative h-10 select-none rounded-sm has-focus-visible:ring-2 has-focus-visible:ring-ring/70 has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background"
      >
        <div className="pointer-events-none absolute inset-x-1 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden bg-border">
          <div
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
        {options.map((option, index) => {
          const mark = index + 1
          return (
            <span
              key={option.value}
              aria-hidden
              className="pointer-events-none absolute top-[calc(50%+0.7rem)] h-1.5 w-px -translate-x-1/2 bg-border"
              style={{ left: `calc(0.25rem + (100% - 0.5rem) * ${mark / max})` }}
            />
          )
        })}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 z-10 h-5 w-3 -translate-x-1/2 -translate-y-1/2 border-2 border-primary bg-card shadow-sm"
          style={{ left: `calc(0.25rem + (100% - 0.5rem) * ${progress / 100})` }}
        />
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={step}
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={step}
          aria-valuetext={currentLabel}
          onChange={(event) => preview(Number(event.target.value))}
          onPointerUp={flush}
          onKeyUp={flush}
          className="intensity-range absolute inset-0 z-20 m-0 h-full w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>

      <div dir="ltr" className="flex justify-between gap-2 px-0.5">
        <span className="text-[10px] font-medium tracking-wide text-foreground/80">
          {options[0]?.label}
        </span>
        <span className="text-[10px] font-medium tracking-wide text-foreground/80">
          {options[max - 1]?.label}
        </span>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-medium tracking-[0.22em] text-foreground">
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
      className={`min-h-10 border px-3 py-2 text-xs font-medium tracking-wide transition-colors disabled:opacity-60 sm:text-[11px] ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-foreground hover:border-primary/70 hover:text-primary'
      }`}
    >
      {label}
    </button>
  )
}
