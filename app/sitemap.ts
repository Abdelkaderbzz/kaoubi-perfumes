import type { MetadataRoute } from 'next'
import { getPublishedProductEntries } from '@/app/actions/products'
import { getCategories } from '@/app/actions/categories'
import { catalogPath, toAbsoluteUrl } from '@/lib/seo'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  try {
    const [productEntries, categories] = await Promise.all([
      getPublishedProductEntries(),
      getCategories(),
    ])

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${siteUrl}${catalogPath(category.slug)}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const productRoutes: MetadataRoute.Sitemap = productEntries.map((product) => ({
      url: `${siteUrl}/products/${product.id}`,
      lastModified: product.updatedAt ?? lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: product.imageUrl ? [toAbsoluteUrl(product.imageUrl)] : undefined,
    }))

    return [...staticRoutes, ...categoryRoutes, ...productRoutes]
  } catch {
    // Build/sitemap should still succeed if the DB is briefly unavailable.
    return staticRoutes
  }
}
