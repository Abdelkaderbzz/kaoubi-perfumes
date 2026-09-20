// Run with: node scripts/seed-femme-catalog.mjs
// Upserts a large batch of "femme" eau-de-parfum products (inspired-by fragrances)
// without touching the curated catalog in seed-products.mjs.
//
// All 82 products share one placeholder bottle photo (no dedicated photos yet) —
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
  ['Black Opium', 'YSL', 'Forte', 'Sucré, Vanille, Gourmand, Floral', 'Automne / Hiver', 'Nuit'],
  ['Alien', 'Mugler', 'Très forte', 'Floral, Oriental, Musqué', 'Automne / Hiver', 'Nuit'],
  ['Coco Mademoiselle', 'Chanel', 'Forte', 'Agrumes, Floral, Boisé, Oriental', 'Printemps / Automne', 'Jour / Nuit'],
  ['Chance', 'Chanel', 'Moyenne', 'Floral, Agrumes, Épicé', 'Printemps / Été', 'Jour'],
  ['Crystal Noir', 'Versace', 'Forte', 'Oriental, Épicé, Floral, Musqué', 'Automne / Hiver', 'Nuit'],
  ['The One', 'Dolce & Gabbana', 'Forte', 'Floral, Oriental, Fruité, Vanille', 'Automne / Hiver', 'Nuit'],
  ['Dior Addict', 'Dior', 'Très forte', 'Vanille, Floral, Oriental', 'Automne / Hiver', 'Nuit'],
  ['D&G Rouge', 'Dolce & Gabbana', 'Forte', 'Fruité, Floral, Musqué', 'Automne / Printemps', 'Jour / Nuit'],
  ['Evidence', 'Yves Rocher', 'Moyenne', 'Floral, Vert, Boisé', 'Printemps / Été', 'Jour'],
  ['Escada Taj', 'Escada', 'Moyenne', 'Fruité, Sucré, Gourmand', 'Printemps / Été', 'Jour'],
  ['Emotion', 'Rasasi', 'Forte', 'Floral, Oriental, Musqué', 'Automne / Hiver', 'Jour / Nuit'],
  ['Gucci Flora', 'Gucci', 'Moyenne', 'Floral, Sucré', 'Printemps / Été', 'Jour'],
  ['Gucci Bamboo', 'Gucci', 'Moyenne', 'Floral, Boisé, Agrumes', 'Printemps / Été', 'Jour'],
  ['Gucci Bloom', 'Gucci', 'Forte', 'Floral, Vert, Poudré', 'Printemps / Automne', 'Jour'],
  ['Good Girl', 'Carolina Herrera', 'Forte', 'Floral, Vanille, Gourmand, Oriental', 'Automne / Hiver', 'Nuit'],
  ['Girl of Now', 'Elie Saab', 'Forte', 'Gourmand, Sucré, Floral, Amande', 'Automne / Hiver', 'Jour / Nuit'],
  ['Givenchy Play', 'Givenchy', 'Moyenne', 'Floral, Fruité, Musqué', 'Printemps / Été', 'Jour'],
  ['Givenchy Play Intense', 'Givenchy', 'Forte', 'Oriental, Floral, Boisé', 'Automne / Hiver', 'Nuit'],
  ['Her', 'Burberry', 'Moyenne', 'Fruité, Floral, Musqué', 'Printemps / Été', 'Jour'],
  ['Goddess', 'Burberry', 'Forte', 'Vanille, Aromatique, Boisé', 'Automne / Hiver', 'Jour / Nuit'],
  ['Hypnotic Poison', 'Dior', 'Très forte', 'Vanille, Oriental, Gourmand, Poudré', 'Automne / Hiver', 'Nuit'],
  ['Incidence', 'Yves Rocher', 'Moyenne', 'Floral, Fruité, Poudré', 'Printemps / Automne', 'Jour'],
  ['Jolie Rêve', null, 'Moyenne', 'Floral, Fruité, Sucré', 'Printemps / Été', 'Jour'],
  ["J'adore", 'Dior', 'Forte', 'Floral, Fruité, Agrumes', 'Printemps / Été', 'Jour / Nuit'],
  ['La Vie Est Belle', 'Lancôme', 'Forte', 'Sucré, Vanille, Gourmand, Floral', 'Automne / Hiver', 'Jour / Nuit'],
  ["L'Interdit", 'Givenchy', 'Forte', 'Floral, Oriental, Boisé', 'Automne / Hiver', 'Nuit'],
  ["L'Extase", 'Nina Ricci', 'Forte', 'Floral, Oriental, Musqué, Vanille', 'Automne / Hiver', 'Nuit'],
  ['Mon Guerlain', 'Guerlain', 'Forte', 'Vanille, Floral, Oriental, Aromatique', 'Automne / Hiver', 'Jour / Nuit'],
  ["L'Instant de Guerlain", 'Guerlain', 'Forte', 'Floral, Oriental, Agrumes, Vanille', 'Automne / Hiver', 'Nuit'],
  ['Manifesto', 'YSL', 'Forte', 'Vanille, Floral, Fruité, Boisé', 'Automne / Hiver', 'Nuit'],
  ['Manifesto Elixir', 'YSL', 'Très forte', 'Vanille, Oriental, Floral, Boisé', 'Hiver', 'Nuit'],
  ['Mon Paris', 'YSL', 'Forte', 'Fruité, Floral, Sucré, Musqué', 'Printemps / Automne', 'Jour / Nuit'],
  ['Miss Dior', 'Dior', 'Forte', 'Floral, Fruité, Agrumes, Boisé', 'Printemps / Automne', 'Jour / Nuit'],
  ['Miss Dior Chérie', 'Dior', 'Forte', 'Fruité, Floral, Sucré, Gourmand', 'Printemps / Automne', 'Jour / Nuit'],
  ['Narciso For Her', 'Narciso Rodriguez', 'Forte', 'Musqué, Floral, Poudré', 'Automne / Printemps', 'Jour / Nuit'],
  ['Narciso For Her Rose', 'Narciso Rodriguez', 'Moyenne', 'Floral, Musqué, Poudré', 'Printemps / Automne', 'Jour'],
  ['Olympea', 'Paco Rabanne', 'Forte', 'Vanille, Salé, Floral, Oriental', 'Été / Automne', 'Jour / Nuit'],
  ['Oud Bouquet', 'Lancôme', 'Très forte', 'Oriental, Boisé, Vanille, Gourmand', 'Hiver', 'Nuit'],
  ['So Elixir Purple', 'Yves Rocher', 'Forte', 'Floral, Fruité, Oriental, Musqué', 'Automne / Hiver', 'Nuit'],
  ['Sì', 'Giorgio Armani', 'Forte', 'Fruité, Floral, Boisé, Musqué', 'Automne / Hiver', 'Jour / Nuit', 'si'],
  ['Sì Passione', 'Giorgio Armani', 'Forte', 'Fruité, Floral, Sucré, Boisé', 'Printemps / Automne', 'Jour / Nuit', 'si-passione'],
  ['My Way', 'Giorgio Armani', 'Forte', 'Floral, Agrumes, Vanille, Musqué', 'Printemps / Été', 'Jour'],
  ['My Way Ylang', 'Giorgio Armani', 'Forte', 'Floral, Agrumes, Vanille', 'Printemps / Été', 'Jour'],
  ['Trésor Midnight Rose', 'Lancôme', 'Forte', 'Fruité, Floral, Sucré, Poudré', 'Automne / Hiver', 'Nuit'],
  ['Trésor La Nuit', 'Lancôme', 'Forte', 'Floral, Fruité, Vanille, Gourmand', 'Automne / Hiver', 'Nuit'],
  ['Orchid', 'Zara', 'Moyenne', 'Floral, Sucré, Poudré', 'Printemps / Automne', 'Jour'],
  ['Wonder Rose', 'Zara', 'Moyenne', 'Fruité, Floral, Musqué', 'Printemps / Été', 'Jour'],
  ['Modhela', null, 'Moyenne', 'Floral, Sucré', 'Printemps / Été', 'Jour'],
  ['غبار الذهب', null, 'Forte', 'Oriental, Musqué, Poudré, Sucré', 'Automne / Hiver', 'Nuit', 'ghobar-el-dahab'],
  ['Musk Tahara', null, 'Moyenne', 'Musqué, Poudré, Floral', 'Printemps / Été', 'Jour'],
  ['Libre', 'YSL', 'Forte', 'Floral, Aromatique, Vanille, Agrumes', 'Automne / Printemps', 'Jour / Nuit'],
  ['Libre Intense', 'YSL', 'Très forte', 'Vanille, Floral, Aromatique, Gourmand', 'Automne / Hiver', 'Nuit'],
  ['Libre Berry Crush', 'YSL', 'Forte', 'Fruité, Floral, Sucré', 'Printemps / Automne', 'Jour / Nuit'],
  ['Libre Vanille', 'YSL', 'Très forte', 'Vanille, Floral, Oriental, Gourmand', 'Hiver', 'Nuit'],
  ['Yara Elixir', 'Lattafa', 'Forte', 'Sucré, Vanille, Fruité, Gourmand', 'Automne / Hiver', 'Jour / Nuit'],
  ['Yara Candy', 'Lattafa', 'Forte', 'Sucré, Fruité, Gourmand, Vanille', 'Printemps / Automne', 'Jour'],
  ['Scandal', 'Jean Paul Gaultier', 'Très forte', 'Sucré, Gourmand, Floral, Miel', 'Automne / Hiver', 'Nuit'],
  ['Scandal Absolu', 'Jean Paul Gaultier', 'Très forte', 'Sucré, Gourmand, Vanille, Floral', 'Hiver', 'Nuit'],
  ['Scandal à Paris', 'Jean Paul Gaultier', 'Forte', 'Floral, Fruité, Sucré, Gourmand', 'Printemps / Été', 'Jour / Nuit'],
  ['Mayar', 'Lattafa', 'Moyenne', 'Fruité, Floral, Sucré, Musqué', 'Printemps / Été', 'Jour'],
  ['Harim', null, 'Forte', 'Oriental, Floral, Musqué', 'Automne / Hiver', 'Jour / Nuit'],
  ['أميرة العرب', 'Lattafa', 'Forte', 'Oriental, Fruité, Floral, Musqué', 'Automne / Hiver', 'Nuit', 'amirat-el-arab'],
  ['Eclaire', 'Lattafa', 'Très forte', 'Gourmand, Sucré, Vanille, Caramel', 'Automne / Hiver', 'Nuit'],
  ['Diamond', 'Christian Lay', 'Forte', 'Floral, Fruité, Sucré', 'Printemps / Automne', 'Jour / Nuit'],
  ['Marshmallow', 'Kayali', 'Forte', 'Sucré, Gourmand, Vanille, Poudré', 'Automne / Hiver', 'Nuit'],
  ['Eden Juicy Apple', 'Kayali', 'Forte', 'Fruité, Sucré, Floral', 'Printemps / Été', 'Jour'],
  ['Eden Sparkling Lychee', 'Kayali', 'Moyenne', 'Fruité, Floral, Sucré', 'Printemps / Été', 'Jour'],
  ['Eden Plush Pear', 'Kayali', 'Moyenne', 'Fruité, Floral, Sucré, Musqué', 'Printemps / Été', 'Jour'],
  ['Sweet Banana', 'Kayali', 'Forte', 'Fruité, Sucré, Gourmand, Vanille', 'Été / Automne', 'Jour'],
  ['Gharam', null, 'Forte', 'Oriental, Floral, Musqué, Sucré', 'Automne / Hiver', 'Nuit'],
  ['Delina', 'Parfums de Marly', 'Forte', 'Floral, Fruité, Musqué, Poudré', 'Printemps / Été', 'Jour / Nuit'],
  ['Pure Musc For Her', 'Narciso Rodriguez', 'Moyenne', 'Musqué, Floral, Poudré', 'Printemps / Automne', 'Jour'],
  ['Musk Santal', 'Kayali', 'Forte', 'Boisé, Musqué, Poudré, Oriental', 'Automne / Hiver', 'Nuit'],
  ['Yum Pistachio Gelato', 'Kayali', 'Forte', 'Gourmand, Sucré, Fruité, Vanille', 'Printemps / Automne', 'Jour / Nuit'],
  ['La Vie Est Belle Vanille', 'Lancôme', 'Très forte', 'Vanille, Gourmand, Sucré, Oriental', 'Hiver', 'Nuit'],
  ['Kirke', 'Tiziana Terenzi', 'Très forte', 'Fruité, Musqué, Vanille, Poudré', 'Automne / Hiver', 'Nuit'],
  ['Kirke Overdose', 'Tiziana Terenzi', 'Très forte', 'Fruité, Sucré, Musqué, Oriental', 'Hiver', 'Nuit'],
  ['Ana Abiyedh', 'Lattafa', 'Forte', 'Fruité, Musqué, Poudré, Sucré', 'Printemps / Automne', 'Jour / Nuit'],
  ['Ana Abiyedh Poudrée', 'Lattafa', 'Forte', 'Poudré, Musqué, Floral, Vanille', 'Automne / Hiver', 'Jour / Nuit'],
  ['Baccarat Rouge 540', 'Maison Francis Kurkdjian', 'Très forte', 'Floral, Boisé, Oriental, Sucré', 'Automne / Hiver', 'Jour / Nuit', 'baccarat-rouge-540-mfk-femme'],
  ['Musk Vanilla', 'Kayali', 'Forte', 'Vanille, Musqué, Poudré, Sucré', 'Automne / Hiver', 'Jour / Nuit'],
  ['Maldives', 'Kayali', 'Moyenne', 'Aquatique, Fruité, Floral, Musqué', 'Été / Printemps', 'Jour'],
]

/** @type {SeedProduct[]} */
const PRODUCTS = RAW.map(([name, brand, intensityRaw, profilCsv, saisonRaw, momentRaw, customKey]) => {
  const key = customKey ?? slugify(brand ? `${name} ${brand}` : name)
  const intensity = INTENSITY_MAP[stripAccents(intensityRaw.trim().toLowerCase())] ?? 'forte'
  const fragranceNotes = mapUnique(splitList(profilCsv, ','), NOTE_MAP)
  const seasons = mapUnique(splitList(saisonRaw, '/'), SEASON_MAP)
  const moments = mapUnique(splitList(momentRaw, '/'), MOMENT_MAP)
  const description = brand
    ? `Fragrance inspiree de ${brand} ${name}. ${profilCsv}. Pour elle.`
    : `Fragrance ${profilCsv.split(',')[0].trim().toLowerCase()}. ${profilCsv}. Pour elle.`

  return {
    key,
    name: brand ? `${name} – ${brand}` : name,
    brand: 'KAOUBI PERFUMES',
    description,
    price: BASE_PRICE,
    category: 'eau-de-parfum',
    image: PLACEHOLDER_IMAGE,
    sex: 'femme',
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
    `SELECT id FROM products WHERE name = $1 AND brand = $2 LIMIT 1`,
    [product.name, product.brand],
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
    console.log(`  [femme] ${product.name} (#${id})`)
  }

  console.log(`Seeded ${count} femme products.`)
}

try {
  await seed()
} catch (err) {
  console.error('Seed failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
