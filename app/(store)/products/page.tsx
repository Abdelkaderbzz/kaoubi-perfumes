import { getCategories } from '@/app/actions/categories'
import { getStoreProductsPaginated } from '@/app/actions/products'
import { getRequestDictionary } from '@/lib/i18n/server'
import { mergeStoreCategories } from '@/lib/store-categories'
import { normalizePage, STORE_PAGE_SIZE } from '@/lib/pagination'
import type { Metadata } from 'next'
import { ProductsClient } from './products-client'

export const revalidate = 60

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    category?: string
  }>
}): Promise<Metadata> {
  const params = await searchParams
  const [{ dictionary, locale }, categories] = await Promise.all([
    getRequestDictionary(),
    getCategories(),
  ])
  const storeCategories = mergeStoreCategories(categories, locale)
  const categorySlug = params.category && params.category !== 'all' ? params.category : null
  const category = categorySlug
    ? storeCategories.find((entry) => entry.slug === categorySlug)
    : null

  const title = category
    ? `${category.name} — ${dictionary.meta.productsTitle}`
    : dictionary.meta.productsTitle
  const description = category?.tagline || dictionary.meta.productsDescription
  const canonical = categorySlug
    ? `/products?category=${encodeURIComponent(categorySlug)}`
    : '/products'

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'x-default': canonical,
        'fr-TN': canonical,
        fr: canonical,
        'ar-TN': canonical,
        ar: canonical,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: params.search
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    category?: string
    page?: string
    wear?: string
    intensity?: string
  }>
}) {
  const params = await searchParams
  const category = params.category ?? 'all'
  const search = params.search?.trim() ?? ''
  const page = normalizePage(params.page)
  const wear = params.wear?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? []
  const intensity = params.intensity?.trim() ?? ''

  const [{ locale }, productPage, categories] = await Promise.all([
    getRequestDictionary(),
    getStoreProductsPaginated({
      page,
      pageSize: STORE_PAGE_SIZE,
      search,
      category,
      wear,
      intensity,
    }),
    getCategories(),
  ])
  const storeCategories = mergeStoreCategories(categories, locale)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ProductsClient
        products={productPage.items}
        total={productPage.total}
        page={productPage.page}
        totalPages={productPage.totalPages}
        search={search}
        category={category}
        wear={wear}
        intensity={intensity}
        storeCategories={storeCategories}
      />
    </div>
  )
}
