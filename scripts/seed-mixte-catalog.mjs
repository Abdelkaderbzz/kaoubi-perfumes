// Run with: node scripts/seed-mixte-catalog.mjs
// Upserts a batch of "mixte" eau-de-parfum products (inspired-by fragrances)
// without touching the curated catalog in seed-products.mjs.
//
// All products share one placeholder bottle photo (no dedicated photos yet) —
// swap "imageUrl"/"images" per product later from the admin once real photos exist.
import { Pool } from 'pg'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { imageExists } from './existing-images.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

const PLACEHOLDER_IMAGE = '/products/signature.webp'

/** Fixed price tiers requested for this batch (TND), same for every product. */
const SIZE_TIERS = [
  { size: '10ml', price: '10.000' },
  { size: '30ml', price: '18.000' },
  { size: '50ml', price: '25.000' },
  { size: '100ml', price: '40.000' },
]
const BASE_PRICE = '25.000' // matches the 50ml tier, shown as the card price

const INTENSITY_MAP = {
  'très forte': 'tres-forte',
  'tres forte': 'tres-forte',
  forte: 'forte',
  moyenne: 'moyenne',
  moy: 'moyenne',
  légère: 'moyenne',
  legere: 'moyenne',
}

const NOTE_MAP = {
  sucré: 'sweet',
  sucre: 'sweet',
  vanille: 'vanilla',
  gourmand: 'gourmand',
  floral: 'floral',
  musqué: 'musky',
  musque: 'musky',
  boisé: 'woody',
  boise: 'woody',
  oriental: 'oriental',
  épicé: 'fresh-spicy',
  epice: 'fresh-spicy',
  agrumes: 'citrus',
  fruité: 'fruity',
  fruite: 'fruity',
  vert: 'aromatic',
  poudré: 'powdery',
  poudre: 'powdery',
  aromatique: 'aromatic',
  miel: 'gourmand',
  caramel: 'gourmand',
  amande: 'gourmand',
  salé: 'aquatic',
  sale: 'aquatic',
  aquatique: 'aquatic',
  frais: 'aquatic',
}

const SEASON_MAP = {
  printemps: 'printemps',
  été: 'ete',
  ete: 'ete',
  automne: 'automne',
  hiver: 'hiver',
}

const MOMENT_MAP = {
  jour: 'jour',
  nuit: 'nuit',
}

function stripAccents(value) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function slugify(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function splitList(raw, sep = '/') {
  return raw
    .split(sep)
    .map((part) => part.trim())
    .filter(Boolean)
}

function mapUnique(list, dict) {
  const out = []
  for (const raw of list) {
    const key = stripAccents(raw.trim().toLowerCase())
    const mapped = dict[key]
    if (mapped && !out.includes(mapped)) out.push(mapped)
  }
  return out
}

/**
 * Raw rows: [name, brand|null, intensityRaw, profilCSV, saisonRaw, momentRaw, key?]
 * key is only given when the name needs a custom (transliterated/ASCII) slug.
 */
const RAW = [
  ['Coco Vanille', 'Mancera', 'Forte', 'Vanille, Gourmand, Sucré, Fruité', 'Été / Automne', 'Jour / Nuit'],
  ['Khamrah Waha', 'Lattafa', 'Forte', 'Sucré, Gourmand, Vanille, Épicé', 'Automne / Hiver', 'Nuit'],
  ['Baccarat Rouge 540', 'Maison Francis Kurkdjian', 'Très forte', 'Floral, Boisé, Oriental, Sucré', 'Automne / Hiver', 'Jour / Nuit', 'baccarat-rouge-540-mfk-mixte'],
  ['Khamrah Qahwa', 'Lattafa', 'Très forte', 'Gourmand, Vanille, Épicé, Sucré', 'Automne / Hiver', 'Nuit'],
  ['Vanille Fatale', 'Tom Ford', 'Très forte', 'Vanille, Boisé, Épicé, Gourmand', 'Automne / Hiver', 'Nuit'],
  ['Ana Abiyedh Poudrée', 'Lattafa', 'Forte', 'Poudré, Musqué, Vanille, Floral', 'Automne / Hiver', 'Jour / Nuit', 'ana-abiyedh-poudree-mixte'],
  ['Oud Vanille', null, 'Forte', 'Oriental, Boisé, Vanille, Épicé', 'Automne / Hiver', 'Nuit'],
  ['Oud Bouquet', 'Lancôme', 'Très forte', 'Oriental, Boisé, Vanille, Gourmand', 'Automne / Hiver', 'Nuit', 'oud-bouquet-lancome-mixte'],
  ['Dove', null, 'Légère', 'Floral, Musqué, Poudré, Frais', 'Printemps / Été', 'Jour'],
  ['Vert Malachite', 'Armani Privé', 'Forte', 'Floral, Oriental, Sucré, Poudré', 'Printemps / Automne', 'Jour / Nuit'],
  ['Rouge Malachite', 'Armani Privé', 'Très forte', 'Floral, Oriental, Vanille, Poudré', 'Automne / Hiver', 'Nuit'],
  ['Hibiscus Mahajád', 'Maison Crivelli', 'Forte', 'Floral, Fruité, Sucré, Oriental', 'Printemps / Été', 'Jour / Nuit'],
]

/** @type {SeedProduct[]} */
const PRODUCTS = RAW.map(([name, brand, intensityRaw, profilCsv, saisonRaw, momentRaw, customKey]) => {
  const key = customKey ?? slugify(brand ? `${name} ${brand}` : name)
  const intensity = INTENSITY_MAP[stripAccents(intensityRaw.trim().toLowerCase())] ?? 'forte'
  const fragranceNotes = mapUnique(splitList(profilCsv, ','), NOTE_MAP)
  const seasons = mapUnique(splitList(saisonRaw, '/'), SEASON_MAP)
  const moments = mapUnique(splitList(momentRaw, '/'), MOMENT_MAP)
  const description = brand
    ? `Fragrance inspiree de ${brand} ${name}. ${profilCsv}. Mixte.`
    : `Fragrance ${profilCsv.split(',')[0].trim().toLowerCase()}. ${profilCsv}. Mixte.`

  return {
    key,
    name: brand ? `${name} – ${brand}` : name,
    brand: 'KAOUBI PERFUMES',
    description,
    price: BASE_PRICE,
    category: 'eau-de-parfum',
    image: PLACEHOLDER_IMAGE,
    sex: 'mixte',
    sizes: SIZE_TIERS,
    fragranceNotes,
    wearMoments: [...seasons, ...moments],
    intensity,
    featured: false,
    published: true,
  }
})

async function upsertProduct(product) {
  const images = JSON.stringify([product.image])
  const sizes = JSON.stringify(product.sizes)
  const fragranceNotes = JSON.stringify(product.fragranceNotes)
  const wearMoments = JSON.stringify(product.wearMoments)

  const existing = await pool.query(
    `SELECT id FROM products WHERE name = $1 AND brand = $2 AND sex = $3 LIMIT 1`,
    [product.name, product.brand, product.sex],
  )

  if (existing.rows[0]) {
    const id = existing.rows[0].id
    await pool.query(
      `UPDATE products SET
        description = $1, price = $2, category = $3,
        "imageUrl" = $4, images = $5, sizes = $6,
        "fragranceNotes" = $7, "wearMoments" = $8, intensity = $9, sex = $10,
        featured = $11, published = $12, "inStock" = true, "updatedAt" = NOW()
       WHERE id = $13`,
      [
        product.description,
        product.price,
        product.category,
        product.image,
        images,
        sizes,
        fragranceNotes,
        wearMoments,
        product.intensity,
        product.sex,
        product.featured,
        product.published,
        id,
      ],
    )
    return id
  }

  const inserted = await pool.query(
    `INSERT INTO products (
      name, brand, description, price, category,
      "imageUrl", images, sizes, "fragranceNotes", "wearMoments", intensity, sex,
      featured, published, "inStock", "relatedProductIds",
      "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13, $14, true, '[]',
      NOW(), NOW()
    )
    RETURNING id`,
    [
      product.name,
      product.brand,
      product.description,
      product.price,
      product.category,
      product.image,
      images,
      sizes,
      fragranceNotes,
      wearMoments,
      product.intensity,
      product.sex,
      product.featured,
      product.published,
    ],
  )
  return inserted.rows[0].id
}

async function seed() {
  if (!imageExists(PLACEHOLDER_IMAGE)) {
    throw new Error(`Placeholder image missing: ${PLACEHOLDER_IMAGE}`)
  }

  const keys = new Set()
  for (const product of PRODUCTS) {
    if (keys.has(product.key)) {
      throw new Error(`Duplicate key in RAW list: ${product.key}`)
    }
    keys.add(product.key)
  }

  let count = 0
  for (const product of PRODUCTS) {
    const id = await upsertProduct(product)
    count += 1
    console.log(`  [mixte] ${product.name} (#${id})`)
  }

  console.log(`Seeded ${count} mixte products.`)
}

try {
  await seed()
} catch (err) {
  console.error('Seed failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
