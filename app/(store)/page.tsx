import { getBoutiques } from '@/app/actions/boutiques'
import { getCategories } from '@/app/actions/categories'
import { getHeroImages } from '@/app/actions/hero'
import {
  getBestSellingProducts,
  getFeaturedProducts,
  getNewProducts,
  getPromotionProducts,
} from '@/app/actions/products'
import { BoutiquesSection } from '@/components/boutiques-section'
import { StoreRoutePrefetch } from '@/components/store-route-prefetch'
import { CategoriesSection } from '@/components/categories-section'
import { HeroSection } from '@/components/hero-section'
import { JsonLd } from '@/components/json-ld'
import { ProductShowcaseSection } from '@/components/product-showcase-section'
import {
  InstagramFollowButton,
  InstagramSectionHeader,
} from '@/components/instagram-section-static'
import { Reveal } from '@/components/reveal'
import { TestimonialsSection } from '@/components/testimonials-section'
import { getRequestDictionary } from '@/lib/i18n/server'
import { organizationJsonLd, perfumeStoreJsonLd, websiteJsonLd } from '@/lib/seo'
import { mergeStoreCategories } from '@/lib/store-categories'
import type { Dictionary } from '@/lib/i18n'
import { Suspense } from 'react'

export const revalidate = 120

function ShowcaseSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto mb-8 h-6 w-40 animate-pulse bg-muted/50" />
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="aspect-4/5 animate-pulse rounded-xl bg-muted/45" />
        ))}
      </div>
    </div>
  )
}

async function HomeProductShowcases({
  dictionary,
  categories,
}: {
  dictionary: Dictionary
  categories: { slug: string; name: string }[]
}) {
  const [featured, newProducts, promotionProducts, bestSellers] = await Promise.all([
    getFeaturedProducts(),
    getNewProducts(),
    getPromotionProducts(),
    getBestSellingProducts(),
  ])

  return (
    <>
      <StoreRoutePrefetch
        hrefs={featured.slice(0, 4).map((product) => `/products/${product.id}`)}
      />
      <ProductShowcaseSection
        eyebrow={dictionary.home.featuredEyebrow}
        title={dictionary.home.featuredTitle}
        products={featured}
        categories={categories}
        priorityImages
      />

      <ProductShowcaseSection
        eyebrow={dictionary.home.newEyebrow}
        title={dictionary.home.newTitle}
        products={newProducts}
        categories={categories}
        tone="muted"
      />

      <ProductShowcaseSection
        eyebrow={dictionary.home.promoEyebrow}
        title={dictionary.home.promoTitle}
        products={promotionProducts}
        categories={categories}
        tone="muted"
      />

      <ProductShowcaseSection
        eyebrow={dictionary.home.bestEyebrow}
        title={dictionary.home.bestTitle}
        products={bestSellers}
        categories={categories}
        tone="muted"
      />
    </>
  )
}

export default async function HomePage() {
  const [{ dictionary, locale }, categories, heroImages, boutiques] = await Promise.all([
    getRequestDictionary(),
    getCategories(),
    getHeroImages(),
    getBoutiques(),
  ])
  const storeCategories = mergeStoreCategories(categories, locale)

  return (
    <div>
      <JsonLd
        data={[
          websiteJsonLd(),
          organizationJsonLd(),
          perfumeStoreJsonLd(boutiques.filter((boutique) => boutique.published)),
        ]}
      />

      <HeroSection images={heroImages} />

      <CategoriesSection categories={storeCategories} />

      <Suspense fallback={<ShowcaseSkeleton />}>
        <HomeProductShowcases dictionary={dictionary} categories={categories} />
      </Suspense>

      <TestimonialsSection />

      <BoutiquesSection boutiques={boutiques} />

      <section className="border-t border-border bg-secondary/30 py-12 md:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <InstagramSectionHeader />
          <Reveal delay={80}>
            <InstagramFollowButton />
          </Reveal>
        </div>
      </section>
    </div>
  )
}
