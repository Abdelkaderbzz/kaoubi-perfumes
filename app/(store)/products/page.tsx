import { getCategories } from '@/app/actions/categories'
import { getStoreProductsPaginated } from '@/app/actions/products'
import { JsonLd } from '@/components/json-ld'
import { getRequestDictionary } from '@/lib/i18n/server'
import { normalizePage, STORE_PAGE_SIZE } from '@/lib/pagination'
import {
  breadcrumbJsonLd,
  catalogPath,
  collectionJsonLd,
  languageAlternates,
} from '@/lib/seo'
import { canonicalCategorySlug, mergeStoreCategories } from '@/lib/store-categories'
import type { Metadata } from 'next'
import { ProductsClient } from './products-client'

export const revalidate = 60

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    category?: string
    page?: string
    wear?: string
    intensity?: string
  }>
}): Promise<Metadata> {
  const params = await searchParams
  const [{ dictionary, locale }, categories] = await Promise.all([
    getRequestDictionary(),
    getCategories(),
  ])
  const storeCategories = mergeStoreCategories(categories, locale)
  const categorySlug =
    params.category && params.category !== 'all' ? canonicalCategorySlug(params.category) : null
  const category = categorySlug
    ? storeCategories.find((entry) => entry.slug === categorySlug)
    : null
  const page = normalizePage(params.page)
  const hasThinFilters = Boolean(params.search || params.wear || params.intensity)

  const title = category
    ? dictionary.meta.categoryTitle(category.name)
    : dictionary.meta.productsTitle
  const description = category
    ? dictionary.meta.categoryDescription(category.name, category.tagline)
    : dictionary.meta.productsDescription
  const canonical = catalogPath(categorySlug, page)
  const ogImage = category?.image

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: languageAlternates(canonical),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage, alt: category?.name ?? title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: hasThinFilters
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
  const category =
    params.category && params.category !== 'all'
      ? canonicalCategorySlug(params.category)
      : (params.category ?? 'all')
  const search = params.search?.trim() ?? ''
  const page = normalizePage(params.page)
  const wear = params.wear?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? []
  const intensity = params.intensity?.trim() ?? ''

  const [{ dictionary, locale }, productPage, categories] = await Promise.all([
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
  const categorySlug = category !== 'all' ? category : null
  const activeCategory = categorySlug
    ? storeCategories.find((entry) => entry.slug === categorySlug)
    : null
  const collectionTitle = activeCategory
    ? dictionary.meta.categoryTitle(activeCategory.name)
    : dictionary.meta.productsTitle
  const collectionDescription = activeCategory
    ? dictionary.meta.categoryDescription(activeCategory.name, activeCategory.tagline)
    : dictionary.meta.productsDescription
  const collectionCanonical = catalogPath(categorySlug, page)

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-8">
      <JsonLd
        data={[
          collectionJsonLd({
            name: collectionTitle,
            description: collectionDescription,
            path: collectionCanonical,
            items: productPage.items,
            total: productPage.total,
          }),
          breadcrumbJsonLd([
            { name: dictionary.product.home, path: '/' },
            { name: dictionary.product.boutique, path: '/products' },
            ...(activeCategory
              ? [{ name: activeCategory.name, path: catalogPath(activeCategory.slug) }]
              : []),
          ]),
        ]}
      />
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
