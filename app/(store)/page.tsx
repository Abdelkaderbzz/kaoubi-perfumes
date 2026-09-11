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
import { organizationJsonLd, perfumeStoreJsonLd } from '@/lib/seo'
import { mergeStoreCategories } from '@/lib/store-categories'

export const revalidate = 120

export default async function HomePage() {
  const [
    { dictionary, locale },
    featured,
    newProducts,
    promotionProducts,
    bestSellers,
    categories,
    heroImages,
    boutiques,
  ] = await Promise.all([
    getRequestDictionary(),
    getFeaturedProducts(),
    getNewProducts(),
    getPromotionProducts(),
    getBestSellingProducts(),
    getCategories(),
    getHeroImages(),
    getBoutiques(),
  ])
  const storeCategories = mergeStoreCategories(categories, locale)

  return (
    <div>
      <JsonLd
        data={[organizationJsonLd(), perfumeStoreJsonLd(boutiques.filter((boutique) => boutique.published))]}
      />

      <HeroSection images={heroImages} />

      <CategoriesSection categories={storeCategories} />

      <ProductShowcaseSection
        eyebrow={dictionary.home.featuredEyebrow}
        title={dictionary.home.featuredTitle}
        products={featured}
        categories={categories}
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
