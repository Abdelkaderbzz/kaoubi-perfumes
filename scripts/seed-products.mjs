// Run with: node scripts/seed-products.mjs
// Upserts the Water of Gold perfume catalog and wires relatedProductIds.
// Only products with a dedicated ready bottle photo are seeded.
// --force also removes leftover non-catalog products (except open-order SKUs).
import { Pool } from 'pg'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { existingProductImages, imageExists, resolveExistingImage } from './existing-images.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

const CATEGORIES = [
  { name: 'Femme', slug: 'femme' },
  { name: 'Homme', slug: 'homme' },
  { name: 'Mixte', slug: 'unisexe' },
]

const IMG = {
  libre: '/hero/ysl-libre.webp',
  devotion: '/hero/dg-devotion.webp',
  gentleman: '/hero/givenchy-gentleman.webp',
  vanilla42: '/hero/perfume-2.webp',
  allureSport: '/products/allure-sport.webp',
  amyrisHomme: '/products/amyris-homme.webp',
  aquaDiGio: '/products/aqua-di-gio-elixir.webp',
  aureusEros: '/products/aureus-eros.webp',
  bleuExclusif: '/products/bleu-chanel-exclusif.webp',
  bleuChanel: '/products/bleu-chanel.webp',
  azureLine: '/products/azure-line.webp',
  alienMugler: '/products/alien-mugler.webp',
  alexandriaIi: '/products/alexandria-ii.webp',
  ambreDesAbysses: '/products/ambre-des-abysses.webp',
  arabesqueTonka: '/products/arabesque-tonka.webp',
  auraRosea: '/products/aura-rosea.webp',
  bleuLazuli: '/products/bleu-lazuli.webp',
  blackOpium: '/products/black-opium.webp',
  blackOpiumGlitter: '/products/black-opium-glitter.webp',
  belugaSupreme: '/products/beluga-supreme.webp',
  belleFortuna: '/products/belle-fortuna.webp',
  bambooGucci: '/products/bamboo-gucci.webp',
  baccarat: '/products/baccarat-rouge-540.webp',
  boisImperial: '/products/bois-imperial.webp',
  boisLumiere: '/products/bois-lumiere.webp',
}

const AVAILABLE_IMAGES = existingProductImages()

/** @typedef {{
 *   key: string
 *   name: string
 *   brand: string
 *   description: string
 *   price: string
 *   compareAtPrice?: string | null
 *   category: 'femme' | 'homme' | 'unisexe'
 *   image: string
 *   sizes: { size: string, price: string }[]
 *   featured: boolean
 *   related: string[]
 *   promoTagEnabled?: boolean
 *   promoTagLabel?: string
 * }} SeedProduct
 */

/** Dummy storefront promo: sale price + struck-through compare-at. */
function promoFields(compareAtPrice, label = 'Promotion') {
  return {
    compareAtPrice,
    promoTagEnabled: true,
    promoTagLabel: label,
  }
}

/** Same price for 50ml and 100ml (store listing). */
function sizeVariants(price) {
  return [
    { size: '50ml', price },
    { size: '100ml', price },
  ]
}

const FEMME_KEYS = [
  'libre',
  'devotion',
  'vanilla-42',
  'alien-mugler',
  'aura-rosea',
  'black-opium',
  'black-opium-glitter',
  'belle-fortuna',
  'bamboo-gucci',
]

const HOMME_KEYS = [
  'gentleman',
  'allure-sport',
  'amyris-homme',
  'aqua-di-gio-elixir',
  'aureus-eros',
  'bleu-exclusif',
  'bleu-chanel',
  'azure-line',
]

const MIXTE_KEYS = [
  'alexandria-ii',
  'ambre-des-abysses',
  'arabesque-tonka',
  'bleu-lazuli',
  'beluga-supreme',
  'baccarat-rouge-540',
  'bois-imperial',
  'bois-lumiere',
]

function relatedOf(keys, key) {
  return keys.filter((item) => item !== key).slice(0, 4)
}

/** @type {SeedProduct[]} */
const PRODUCTS = [
  // —— Femme (legacy) ——
  {
    key: 'libre',
    name: 'Libre',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de YSL Libre. Bouquet floral-lavande, vanille et orange amere. Tenue longue, pour le jour comme le soir.',
    price: '79.000',
    compareAtPrice: '95.000',
    category: 'femme',
    image: IMG.libre,
    sizes: sizeVariants('79.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'libre'),
  },
  {
    key: 'devotion',
    name: 'Devotion',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Dolce & Gabbana Devotion. Citron, vanille et pamplemousse, gourmande et lumineuse.',
    price: '85.000',
    category: 'femme',
    image: IMG.devotion,
    sizes: sizeVariants('85.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'devotion'),
  },
  {
    key: 'vanilla-42',
    name: 'Vanilla 42',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Kayali Vanilla 28 / Candy Rock Sugar. Vanille, praline et sucre. Gourmande pure.',
    price: '82.000',
    category: 'femme',
    image: IMG.vanilla42,
    sizes: sizeVariants('82.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'vanilla-42'),
  },
  // —— Femme (catalog) ——
  {
    key: 'alien-mugler',
    name: 'Alien Mugler',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Mugler Alien. Jasmin, ambre et bois. Capiteuse, mysterieuse, sillage iconique.',
    price: '50.000',
    category: 'femme',
    image: IMG.alienMugler,
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'alien-mugler'),
  },
  {
    key: 'aura-rosea',
    name: 'AURA ROSEA / Gucci Guilty',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Gucci Guilty. Floral-fruite, rose et patchouli. Moderne et envoûtante.',
    price: '100.000',
    category: 'femme',
    image: IMG.auraRosea,
    sizes: sizeVariants('100.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'aura-rosea'),
  },
  {
    key: 'black-opium',
    name: 'Black Opium – YSL',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de YSL Black Opium. Cafe, vanille et poire blanche. Gourmande, addictive, pour la nuit.',
    price: '50.000',
    category: 'femme',
    image: IMG.blackOpium,
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'black-opium'),
  },
  {
    key: 'black-opium-glitter',
    name: 'Black Opium Glitter YSL',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de YSL Black Opium Glitter. Edition scintillante, cafe et vanille, sillage festif.',
    price: '70.000',
    category: 'femme',
    image: IMG.blackOpiumGlitter,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'black-opium-glitter'),
  },
  {
    key: 'belle-fortuna',
    name: 'BELLE FORTUNA / Chanel Chance',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Chanel Chance. Pamplemousse, jasmin et musc blanc. Fraiche et poudree.',
    price: '70.000',
    category: 'femme',
    image: IMG.belleFortuna,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'belle-fortuna'),
  },
  {
    key: 'bamboo-gucci',
    name: 'Bamboo Gucci',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Gucci Bamboo. Floral-boise, bergamote et santal. Elegant et contemporain.',
    price: '65.000',
    category: 'femme',
    image: IMG.bambooGucci,
    sizes: sizeVariants('65.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'bamboo-gucci'),
  },
  // —— Mixte (promotions) ——
  {
    key: 'alexandria-ii',
    name: 'ALEXANDRIA II - XERJOFF',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Xerjoff Alexandria II. Oriental luxueux, rose, bois precieux et vanille. Tenue exceptionnelle.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'unisexe',
    image: IMG.alexandriaIi,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'alexandria-ii'),
  },
  {
    key: 'ambre-des-abysses',
    name: 'AMBRE DES HABYSSES - HOUBIGANT',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Houbigant Ambre des Abysses. Ambre profond, boise et envelopant. Mixte, sillage noble.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'unisexe',
    image: IMG.ambreDesAbysses,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'ambre-des-abysses'),
  },
  {
    key: 'arabesque-tonka',
    name: 'ARABESQUE TONKA / Arabians Tonka Montale',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Montale Arabians Tonka. Oriental gourmand, tonka et epices, sillage fort.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'unisexe',
    image: IMG.arabesqueTonka,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'arabesque-tonka'),
  },
  {
    key: 'bleu-lazuli',
    name: 'Bleu Lazuli – Armani Privé',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Armani Privé Bleu Lazuli. Boise-aromatique de prestige, sillage raffine.',
    price: '50.000',
    ...promoFields('70.000'),
    category: 'unisexe',
    image: IMG.bleuLazuli,
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'bleu-lazuli'),
  },
  {
    key: 'beluga-supreme',
    name: 'BELUGA SUPREME / CUIR BELUGA',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Guerlain Cuir Beluga. Cuir doux, vanille et ambre. Chaleureux et luxueux.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'unisexe',
    image: IMG.belugaSupreme,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'beluga-supreme'),
  },
  {
    key: 'baccarat-rouge-540',
    name: 'Baccarat Rouge 540 – MFK',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Maison Francis Kurkdjian Baccarat Rouge 540. Safran, ambre et bois mineral.',
    price: '60.000',
    ...promoFields('80.000'),
    category: 'unisexe',
    image: IMG.baccarat,
    sizes: sizeVariants('60.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'baccarat-rouge-540'),
  },
  {
    key: 'bois-imperial',
    name: 'Bois Impérial Essential Parfums',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Essential Parfums Bois Imperial. Boise-aromatique, poivre et vetiver.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'unisexe',
    image: IMG.boisImperial,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'bois-imperial'),
  },
  {
    key: 'bois-lumiere',
    name: 'BOIS LUMIERE / Cedrat Boise Mancera',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Mancera Cedrat Boise. Agrumes, bois et musc. Lumineux, frais et tenace.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'unisexe',
    image: IMG.boisLumiere,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'bois-lumiere'),
  },
  // —— Homme ——
  {
    key: 'gentleman',
    name: 'Gentleman',
    brand: 'Water of Gold',
    description:
      "Fragrance inspiree de Givenchy Gentleman. Iris, bois et lavande. Elegant, poudre, pour l'homme de ville.",
    price: '79.000',
    category: 'homme',
    image: IMG.gentleman,
    sizes: sizeVariants('79.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'gentleman'),
  },
  {
    key: 'allure-sport',
    name: 'Allure Sport',
    brand: 'Water of Gold',
    description:
      "Fragrance inspiree de Chanel Allure Homme Sport. Frais, dynamique, notes d'agrumes et de bois.",
    price: '50.000',
    category: 'homme',
    image: IMG.allureSport,
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'allure-sport'),
  },
  {
    key: 'amyris-homme',
    name: 'Amyris Homme – MFK',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Maison Francis Kurkdjian Amyris Homme. Boise-ambre, elegant et sophistique.',
    price: '50.000',
    category: 'homme',
    image: IMG.amyrisHomme,
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'amyris-homme'),
  },
  {
    key: 'aqua-di-gio-elixir',
    name: 'Aqua Di Gio Elixir',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Giorgio Armani Acqua di Gio Elixir. Marine intense, profonde et moderne.',
    price: '70.000',
    category: 'homme',
    image: IMG.aquaDiGio,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'aqua-di-gio-elixir'),
  },
  {
    key: 'aureus-eros',
    name: 'AUREUS / Eros Parfum Versace',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Versace Eros Parfum. Menthe, vanille et bois, frais-sucre et audacieux.',
    price: '70.000',
    category: 'homme',
    image: IMG.aureusEros,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'aureus-eros'),
  },
  {
    key: 'bleu-exclusif',
    name: "Bleu de Chanel L'Exclusif",
    brand: 'Water of Gold',
    description:
      "Fragrance inspiree de Bleu de Chanel L'Exclusif. Boise intense, profondeur et elegance nocturne.",
    price: '70.000',
    category: 'homme',
    image: IMG.bleuExclusif,
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'bleu-exclusif'),
  },
  {
    key: 'bleu-chanel',
    name: 'Bleu Chanel',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Bleu de Chanel. Agrumes, gingembre et bois de gaiac. Frais-boise, polyvalent.',
    price: '60.000',
    category: 'homme',
    image: IMG.bleuChanel,
    sizes: sizeVariants('60.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'bleu-chanel'),
    fragranceNotes: ['citrus', 'woody', 'fresh-spicy'],
    wearMoments: ['jour', 'nuit'],
    intensity: 'forte',
    composition: {
      tete: [
        { name: 'Bergamote', imageUrl: '/notes/bergamote.webp' },
        { name: 'Safran', imageUrl: '/notes/safran.webp' },
      ],
      coeur: [
        { name: 'Jasmin', imageUrl: '/notes/jasmin.webp' },
        { name: 'Ambre', imageUrl: '/notes/ambre.webp' },
      ],
      fond: [
        { name: 'Cèdre', imageUrl: '/notes/cedre.webp' },
        { name: 'Vanille', imageUrl: '/notes/vanille.webp' },
        { name: 'Ambre', imageUrl: '/notes/ambre.webp' },
      ],
    },
  },
  {
    key: 'azure-line',
    name: 'AZURE LINE / Chrome Azzaro',
    brand: 'Water of Gold',
    description:
      'Fragrance inspiree de Azzaro Chrome. Aquatique, frais et propre. Ideal au quotidien.',
    price: '70.000',
    category: 'homme',
    image: IMG.azureLine,
    sizes: sizeVariants('70.000'),
    featured: false,
    related: relatedOf(HOMME_KEYS, 'azure-line'),
  },
]

async function ensureCategories() {
  for (const category of CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (name, slug, "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()`,
      [category.name, category.slug],
    )
  }
}

async function upsertProduct(product) {
  const images = JSON.stringify([product.image])
  const sizes = JSON.stringify(product.sizes)
  const fragranceNotes = JSON.stringify(product.fragranceNotes ?? [])
  const wearMoments = JSON.stringify(product.wearMoments ?? [])
  const intensity = product.intensity ?? null
  const composition = JSON.stringify(
    product.composition ?? { tete: [], coeur: [], fond: [] },
  )
  const promoTagEnabled = Boolean(product.promoTagEnabled)
  const promoTagLabel = product.promoTagLabel?.trim() || 'Promotion'
  const promoTagBgColor = product.promoTagBgColor || '#c81e1e'
  const promoTagTextColor = product.promoTagTextColor || '#ffffff'
  const existing = await pool.query(
    `SELECT id FROM products WHERE name = $1 AND brand = $2 LIMIT 1`,
    [product.name, product.brand],
  )

  if (existing.rows[0]) {
    const id = existing.rows[0].id
    await pool.query(
      `UPDATE products SET
        description = $1,
        price = $2,
        "compareAtPrice" = $3,
        category = $4,
        "imageUrl" = $5,
        images = $6,
        sizes = $7,
        "fragranceNotes" = $8,
        "wearMoments" = $9,
        intensity = $10,
        composition = $11,
        "promoTagEnabled" = $12,
        "promoTagLabel" = $13,
        "promoTagBgColor" = $14,
        "promoTagTextColor" = $15,
        "inStock" = true,
        featured = $16,
        published = true,
        "updatedAt" = NOW()
       WHERE id = $17`,
      [
        product.description,
        product.price,
        product.compareAtPrice ?? null,
        product.category,
        product.image,
        images,
        sizes,
        fragranceNotes,
        wearMoments,
        intensity,
        composition,
        promoTagEnabled,
        promoTagLabel,
        promoTagBgColor,
        promoTagTextColor,
        product.featured,
        id,
      ],
    )
    return id
  }

  const inserted = await pool.query(
    `INSERT INTO products (
      name, brand, description, price, "compareAtPrice", category,
      "imageUrl", images, sizes, "relatedProductIds",
      "fragranceNotes", "wearMoments", intensity, composition,
      "promoTagEnabled", "promoTagLabel", "promoTagBgColor", "promoTagTextColor",
      "inStock", featured, published,
      "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, '[]',
      $10, $11, $12, $13,
      $14, $15, $16, $17,
      true, $18, true, NOW(), NOW()
    )
    RETURNING id`,
    [
      product.name,
      product.brand,
      product.description,
      product.price,
      product.compareAtPrice ?? null,
      product.category,
      product.image,
      images,
      sizes,
      fragranceNotes,
      wearMoments,
      intensity,
      composition,
      promoTagEnabled,
      promoTagLabel,
      promoTagBgColor,
      promoTagTextColor,
      product.featured,
    ],
  )
  return inserted.rows[0].id
}

async function relinkMissingProductImages() {
  if (AVAILABLE_IMAGES.length === 0) {
    throw new Error('No ready product images found.')
  }

  const { rows } = await pool.query(`SELECT id, name, "imageUrl" FROM products ORDER BY id`)
  let updated = 0

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    if (imageExists(row.imageUrl) && AVAILABLE_IMAGES.includes(row.imageUrl)) continue

    const image = AVAILABLE_IMAGES[i % AVAILABLE_IMAGES.length]
    await pool.query(
      `UPDATE products SET "imageUrl" = $1, images = $2, "updatedAt" = NOW() WHERE id = $3`,
      [image, JSON.stringify([image]), row.id],
    )
    updated += 1
    console.log(`  Relinked "${row.name}" → ${image}`)
  }

  if (updated > 0) {
    console.log(`Relinked ${updated} product(s) to ready bottle photos.`)
  }
}

async function seed() {
  if (AVAILABLE_IMAGES.length === 0) {
    throw new Error('No ready product images found.')
  }

  await ensureCategories()

  const idsByKey = new Map()
  for (const [index, product] of PRODUCTS.entries()) {
    const id = await upsertProduct({
      ...product,
      image: resolveExistingImage(product.image, AVAILABLE_IMAGES, index),
    })
    idsByKey.set(product.key, id)
    console.log(`  [${product.category}] ${product.name} → ${product.image}`)
  }

  for (const product of PRODUCTS) {
    const id = idsByKey.get(product.key)
    const relatedIds = product.related
      .map((key) => idsByKey.get(key))
      .filter((relatedId) => Number.isInteger(relatedId) && relatedId !== id)
    await pool.query(
      `UPDATE products SET "relatedProductIds" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [JSON.stringify(relatedIds), id],
    )
  }

  if (process.argv.includes('--force')) {
    const catalogIds = [...idsByKey.values()]
    const leftover = await pool.query(
      `SELECT id, name, brand FROM products WHERE NOT (id = ANY($1::int[]))`,
      [catalogIds],
    )
    if (leftover.rows.length > 0) {
      const leftoverIds = leftover.rows.map((row) => row.id)
      const inOrders = await pool.query(
        `SELECT DISTINCT "productId" FROM order_items WHERE "productId" = ANY($1::int[])`,
        [leftoverIds],
      )
      const locked = new Set(inOrders.rows.map((row) => row.productId))
      const removable = leftoverIds.filter((id) => !locked.has(id))
      if (removable.length > 0) {
        await pool.query(`DELETE FROM products WHERE id = ANY($1::int[])`, [removable])
        console.log(`Removed ${removable.length} leftover product(s) not in the catalog.`)
      }
      for (const row of leftover.rows.filter((item) => locked.has(item.id))) {
        console.log(`Kept "${row.name}" (${row.brand}) — referenced by an order.`)
      }
    }
  }

  await relinkMissingProductImages()

  console.log(`Seeded ${PRODUCTS.length} perfumes with ready photos.`)
  const byCategory = await pool.query(
    `SELECT category, COUNT(*)::int AS count FROM products WHERE published = true GROUP BY category ORDER BY category`,
  )
  for (const row of byCategory.rows) {
    console.log(`  - ${row.category}: ${row.count}`)
  }
}

try {
  await seed()
} catch (err) {
  console.error('Seed failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
