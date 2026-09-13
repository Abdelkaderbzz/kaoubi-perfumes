import { getProductById, getPublishedProductEntries, getRelatedProducts } from '@/app/actions/products'
import { getCategories } from '@/app/actions/categories'
import { FragranceProfile } from '@/components/fragrance-profile'
import { JsonLd } from '@/components/json-ld'
import { PerfumeCompositionSection } from '@/components/perfume-composition'
import { ProductCard } from '@/components/product-card'
import { ProductGallery } from '@/components/product-gallery'
import { ProductPrice } from '@/components/product-price'
import { ProductPromoTag } from '@/components/product-promo-tag'
import { Reveal } from '@/components/reveal'
import { SectionEyebrow, SectionTitle } from '@/components/section-heading'
import { getRequestDictionary } from '@/lib/i18n/server'
import { parseProductImages } from '@/lib/product-images'
import { parseProductSizeVariants } from '@/lib/product-sizes'
import { breadcrumbJsonLd, catalogPath, languageAlternates, productJsonLd } from '@/lib/seo'
import { getCategoryLabel } from '@/lib/store-categories'
import { AddToCartButton } from './add-to-cart-button'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 120

export async function generateStaticParams() {
  try {
    const entries = await getPublishedProductEntries()
    return entries.map((product) => ({ id: String(product.id) }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const productId = Number(id)
  if (!Number.isFinite(productId)) notFound()

  const [{ dictionary, locale }, product, categories] = await Promise.all([
    getRequestDictionary(),
    getProductById(productId),
    getCategories(),
  ])

  if (!product) notFound()

  const categoryLabel = getCategoryLabel(product.category, categories, locale)
  const title = dictionary.meta.productTitle(product.brand, product.name)
  const description =
    product.description?.trim() ||
    dictionary.meta.productDescription(product.brand, product.name, categoryLabel)
  const images = parseProductImages(product)
  const canonical = `/products/${product.id}`

  return {
    title,
    description,
    keywords: [product.brand, product.name, categoryLabel, 'KAOUBI PERFUMES', 'Douz'],
    alternates: {
      canonical,
      languages: languageAlternates(canonical),
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      images:
        images.length > 0
          ? images.map((url) => ({ url, alt: `${product.brand} ${product.name}` }))
          : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images[0] ? [images[0]] : undefined,
    },
    other: {
      'product:brand': product.brand,
      'product:availability': product.inStock ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'product:retailer_item_id': String(product.id),
      'product:price:amount': product.price,
      'product:price:currency': 'TND',
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ dictionary, locale }, product, categories, relatedProducts] = await Promise.all([
    getRequestDictionary(),
    getProductById(Number(id)),
    getCategories(),
    getRelatedProducts(Number(id)),
  ])
  if (!product) notFound()

  const categoryLabel = getCategoryLabel(product.category, categories, locale)

  const variants = parseProductSizeVariants(product.sizes, product.price)
  const images = parseProductImages(product)

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-8">
      <JsonLd
        data={[
          productJsonLd(product),
          breadcrumbJsonLd([
            { name: dictionary.product.home, path: '/' },
            { name: dictionary.product.boutique, path: '/products' },
            {
              name: categoryLabel,
              path: catalogPath(product.category),
            },
            { name: product.name, path: `/products/${product.id}` },
          ]),
        ]}
      />

      <Reveal className="mb-5 sm:mb-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 overflow-hidden text-[10px] font-medium tracking-wider text-muted-foreground sm:text-[11px] sm:tracking-widest"
        >
          <Link href="/" prefetch className="shrink-0 hover:text-primary transition-colors">
            {dictionary.product.home}
          </Link>
          <span className="shrink-0">/</span>
          <Link href="/products" prefetch className="shrink-0 hover:text-primary transition-colors">
            {dictionary.product.boutique}
          </Link>
          <span className="shrink-0">/</span>
          <Link
            href={catalogPath(product.category)}
            prefetch
            className="shrink-0 hover:text-primary transition-colors"
          >
            {categoryLabel.toUpperCase()}
          </Link>
          <span className="shrink-0">/</span>
          <span className="truncate text-foreground">{product.name.toUpperCase()}</span>
        </nav>
      </Reveal>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <Reveal variant="left">
          <ProductGallery
            images={images}
            alt={`${product.brand} ${product.name}`}
          />
        </Reveal>

        <Reveal variant="right" className="flex flex-col gap-4 sm:gap-5">
          <div>
            <div className="mb-2">
              <ProductPromoTag
                enabled={product.promoTagEnabled}
                label={product.promoTagLabel}
                backgroundColor={product.promoTagBgColor}
                textColor={product.promoTagTextColor}
              />
            </div>
            <p className="text-[11px] font-medium tracking-[0.22em] text-primary sm:text-xs sm:tracking-[0.28em]">
              {product.brand.toUpperCase()}
            </p>
            <h1 className="mt-2 font-serif text-xl tracking-wide text-foreground leading-tight sm:text-2xl md:text-3xl">
              {product.name}
            </h1>
            <p className="mt-1.5 text-xs font-medium tracking-widest text-foreground/65">
              {categoryLabel.toUpperCase()}
            </p>
          </div>

          <div className="h-px w-16 bg-primary/40" />

          {product.description && (
            <p className="text-sm leading-relaxed text-foreground/80">
              {product.description}
            </p>
          )}

          <FragranceProfile
            wearMoments={product.wearMoments}
            intensity={product.intensity}
          />

          {!product.inStock ? (
            <>
              <ProductPrice
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                size="lg"
              />
              <div className="border border-border px-4 py-3 text-center text-sm font-medium tracking-widest text-foreground/70">
                {dictionary.product.outOfStock}
              </div>
            </>
          ) : (
            <AddToCartButton product={product} variants={variants} />
          )}

          <PerfumeCompositionSection composition={product.composition} />
        </Reveal>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-10 border-t border-border pt-7 sm:mt-12 sm:pt-8">
          <Reveal className="mb-5 text-center sm:mb-6">
            <SectionEyebrow>{dictionary.product.relatedEyebrow}</SectionEyebrow>
            <SectionTitle>{dictionary.product.relatedTitle}</SectionTitle>
          </Reveal>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {relatedProducts.map((related, index) => (
              <Reveal key={related.id} delay={(index % 4) * 80}>
                <ProductCard product={related} categories={categories} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
