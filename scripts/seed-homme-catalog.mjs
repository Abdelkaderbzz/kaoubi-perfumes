// Run with: node scripts/seed-homme-catalog.mjs
// Upserts a large batch of "homme" eau-de-parfum products (inspired-by fragrances)
// without touching the curated catalog in seed-products.mjs.
//
// All products share one placeholder bottle photo until real photos are applied —
// see scripts/apply-homme-photos.mjs, which swaps in matched bottle shots from
// ~/Downloads/men parfumes for the products that have one.
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
  frais: 'aquatic',
  tabac: 'woody',
  cuir: 'woody',
  café: 'gourmand',
  cafe: 'gourmand',
  ambré: 'oriental',
  ambre: 'oriental',
}

const SEASON_MAP = {
  printemps: 'printemps',
  été: 'ete',
  ete: 'ete',
  automne: 'automne',
  hiver: 'hiver',
  'toute saison': null,
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
    if (!(key in dict)) continue
    const mapped = dict[key]
    if (mapped && !out.includes(mapped)) out.push(mapped)
  }
  return out
}

/**
 * Raw rows: [name, brand|null, intensityRaw, profilCSV, saisonRaw, momentRaw, key?]
 * key is only given when the name needs a custom (transliterated/ASCII/disambiguated) slug.
 */
const RAW = [
  ['Stronger With You', 'Emporio Armani', 'Forte', 'Sucré, Vanille, Gourmand, Aromatique', 'Automne / Hiver', 'Nuit'],
  ['Wanted', 'Azzaro', 'Forte', 'Agrumes, Boisé, Aromatique, Épicé', 'Automne / Printemps', 'Jour / Nuit'],
  ['Wanted by Night', 'Azzaro', 'Très forte', 'Épicé, Boisé, Oriental, Sucré', 'Automne / Hiver', 'Nuit'],
  ['The Most Wanted', 'Azzaro', 'Très forte', 'Sucré, Vanille, Gourmand, Boisé', 'Automne / Hiver', 'Nuit'],
  ['Allure Homme Sport', 'Chanel', 'Moyenne', 'Agrumes, Aromatique, Boisé, Frais', 'Printemps / Été', 'Jour'],
  ['Aviator', null, 'Moyenne', 'Aromatique, Boisé, Frais', 'Printemps / Été', 'Jour'],
  ["Amir Al Oud", null, 'Forte', 'Oriental, Boisé, Musqué, Épicé', 'Automne / Hiver', 'Nuit', 'amir-al-oud'],
  ['Bleu de Chanel', 'Chanel', 'Forte', 'Agrumes, Aromatique, Boisé, Épicé', 'Toute saison', 'Jour / Nuit'],
  ['Sauvage', 'Dior', 'Forte', 'Agrumes, Aromatique, Épicé, Boisé', 'Toute saison', 'Jour / Nuit'],
  ['Class', null, 'Moyenne', 'Floral, Fruité, Boisé, Musqué', 'Printemps / Automne', 'Jour'],
  ['Black Afgano', 'Nasomatto', 'Très forte', 'Boisé, Oriental, Aromatique, Musqué', 'Automne / Hiver', 'Nuit'],
  ['The One for Men', 'Dolce & Gabbana', 'Forte', 'Boisé, Épicé, Oriental, Tabac', 'Automne / Hiver', 'Nuit'],
  ['Fahrenheit', 'Dior', 'Forte', 'Boisé, Aromatique, Cuir, Épicé', 'Automne / Hiver', 'Jour / Nuit'],
  ["La Nuit de L'Homme", 'YSL', 'Forte', 'Aromatique, Épicé, Boisé, Poudré', 'Automne / Hiver', 'Nuit'],
  ['Polo Blue', 'Ralph Lauren', 'Moyenne', 'Frais, Aquatique, Aromatique, Fruité', 'Printemps / Été', 'Jour'],
  ['Polo Red', 'Ralph Lauren', 'Forte', 'Fruité, Épicé, Boisé, Sucré', 'Automne / Hiver', 'Jour / Nuit'],
  ['Boss Bottled', 'Hugo Boss', 'Moyenne', 'Fruité, Épicé, Boisé, Sucré', 'Automne / Printemps', 'Jour'],
  ['Boss Bottled Night', 'Hugo Boss', 'Moyenne', 'Aromatique, Boisé, Floral, Poudré', 'Automne / Printemps', 'Nuit'],
  ['Summer Hammer', 'Louis Vuitton', 'Moyenne', 'Agrumes, Frais, Fruité, Aromatique', 'Été', 'Jour'],
  ['Stellar Times', 'Louis Vuitton', 'Forte', 'Floral, Oriental, Poudré, Agrumes', 'Printemps / Automne', 'Jour / Nuit'],
  ['Qaed Al Fursan', 'Lattafa', 'Forte', 'Fruité, Boisé, Sucré, Oriental', 'Automne / Hiver', 'Nuit'],
  ['9AM', 'Afnan', 'Moyenne', 'Fruité, Agrumes, Aromatique, Boisé', 'Printemps / Été', 'Jour'],
  ['9PM', 'Afnan', 'Forte', 'Sucré, Fruité, Vanille, Gourmand', 'Automne / Hiver', 'Nuit'],
  ['Prada Paradigme', 'Prada', 'Forte', 'Boisé, Aromatique, Ambré, Vanille', 'Automne / Hiver', 'Nuit', 'prada-paradigme-homme'],
  ['Acqua di Giò', 'Giorgio Armani', 'Moyenne', 'Aquatique, Agrumes, Aromatique, Frais', 'Printemps / Été', 'Jour'],
  ['Acqua di Giò Profondo', 'Giorgio Armani', 'Forte', 'Aquatique, Aromatique, Agrumes, Boisé', 'Printemps / Été', 'Jour'],
  ['Uomo', 'Valentino', 'Forte', 'Boisé, Poudré, Épicé, Oriental', 'Automne / Hiver', 'Nuit'],
  ['D&G Vibes', 'Dolce & Gabbana', 'Moyenne', 'Fruité, Floral, Sucré, Frais', 'Printemps / Été', 'Jour'],
  ['D&G Pineapple', 'Dolce & Gabbana', 'Moyenne', 'Fruité, Sucré, Agrumes, Boisé', 'Printemps / Été', 'Jour'],
  ['Le Male Elixir', 'Jean Paul Gaultier', 'Très forte', 'Vanille, Gourmand, Sucré, Oriental', 'Automne / Hiver', 'Nuit', 'le-male-elixir-jpg-homme'],
  ['Stronger With You Intensely', 'Emporio Armani', 'Très forte', 'Sucré, Vanille, Gourmand, Épicé', 'Automne / Hiver', 'Nuit'],
  ['Vibrato', 'Sospiro', 'Forte', 'Agrumes, Fruité, Aromatique, Musqué', 'Printemps / Été', 'Jour'],
  ['Black Orchid', 'Tom Ford', 'Très forte', 'Oriental, Floral, Boisé, Épicé', 'Automne / Hiver', 'Nuit', 'black-orchid-tom-ford-homme'],
  ['Tobacco Vanille', 'Tom Ford', 'Très forte', 'Tabac, Vanille, Gourmand, Épicé', 'Automne / Hiver', 'Nuit'],
  ['God of Fire', 'Stéphane Humbert Lucas', 'Très forte', 'Fruité, Sucré, Épicé, Boisé', 'Été / Automne', 'Jour / Nuit'],
  ['Khamrah Qahwa', 'Lattafa', 'Très forte', 'Gourmand, Café, Vanille, Épicé', 'Automne / Hiver', 'Nuit'],
  ['Khamrah', 'Lattafa', 'Très forte', 'Gourmand, Sucré, Vanille, Épicé', 'Automne / Hiver', 'Nuit'],
  ['Khamrah Dukhan', 'Lattafa', 'Très forte', 'Boisé, Épicé, Tabac, Gourmand', 'Automne / Hiver', 'Nuit'],
  ['Vibrant Leather', 'Zara', 'Moyenne', 'Boisé, Fruité, Aromatique, Épicé', 'Automne / Printemps', 'Jour'],
  ['Imagination', 'Louis Vuitton', 'Forte', 'Agrumes, Aromatique, Frais, Épicé', 'Printemps / Été', 'Jour'],
  ['Megamare', 'Orto Parisi', 'Très forte', 'Aquatique, Aromatique, Frais, Musqué', 'Été / Printemps', 'Jour / Nuit'],
  ['Boss Orange', 'Hugo Boss', 'Moyenne', 'Fruité, Épicé, Boisé, Sucré', 'Automne / Printemps', 'Jour'],
  ['L.12.12 Bleu', 'Lacoste', 'Moyenne', 'Frais, Aromatique, Fruité, Boisé', 'Printemps / Été', 'Jour'],
  ['L.12.12 Gris', 'Lacoste', 'Moyenne', 'Aromatique, Boisé, Frais, Épicé', 'Printemps / Automne', 'Jour'],
  ['L.12.12 Noir', 'Lacoste', 'Moyenne', 'Fruité, Boisé, Aromatique, Sucré', 'Automne / Hiver', 'Jour / Nuit'],
  ['UDV Bleu', 'Ulric de Varens', 'Moyenne', 'Frais, Aquatique, Agrumes, Aromatique', 'Printemps / Été', 'Jour'],
  ["Black XS L'Exces", 'Paco Rabanne', 'Forte', 'Fruité, Sucré, Boisé, Épicé', 'Automne / Hiver', 'Nuit'],
  ['Aventus', 'Creed', 'Forte', 'Fruité, Agrumes, Boisé, Aromatique', 'Printemps / Été', 'Jour / Nuit'],
  ['Invictus', 'Paco Rabanne', 'Forte', 'Aquatique, Fruité, Agrumes, Boisé', 'Printemps / Été', 'Jour'],
  ['The King', 'Dolce & Gabbana', 'Forte', 'Agrumes, Boisé, Aromatique, Épicé', 'Printemps / Automne', 'Jour / Nuit'],
  ['Scandal Pour Homme', 'Jean Paul Gaultier', 'Très forte', 'Gourmand, Sucré, Caramel, Boisé', 'Automne / Hiver', 'Nuit'],
  ['Sultan Al Khalij', null, 'Forte', 'Oriental, Boisé, Épicé, Musqué', 'Automne / Hiver', 'Nuit'],
  ['Silver Mountain Water', 'Creed', 'Moyenne', 'Frais, Aquatique, Agrumes, Musqué', 'Printemps / Été', 'Jour'],
  ['Égoïste Platinum', 'Chanel', 'Forte', 'Aromatique, Boisé, Frais, Épicé', 'Printemps / Automne', 'Jour', 'egoiste-platinum'],
  ['Invictus Victory', 'Paco Rabanne', 'Très forte', 'Vanille, Gourmand, Sucré, Épicé', 'Automne / Hiver', 'Nuit'],
  ['Le Beau Paradise Garden', 'Jean Paul Gaultier', 'Forte', 'Aquatique, Fruité, Floral, Vanille', 'Printemps / Été', 'Jour / Nuit'],
]

/** @type {SeedProduct[]} */
const PRODUCTS = RAW.map(([name, brand, intensityRaw, profilCsv, saisonRaw, momentRaw, customKey]) => {
  const key = customKey ?? slugify(brand ? `${name} ${brand}` : name)
  const intensity = INTENSITY_MAP[stripAccents(intensityRaw.trim().toLowerCase())] ?? 'forte'
  const fragranceNotes = mapUnique(splitList(profilCsv, ','), NOTE_MAP)
  const seasons = mapUnique(splitList(saisonRaw, '/'), SEASON_MAP)
  const moments = mapUnique(splitList(momentRaw, '/'), MOMENT_MAP)
  const description = brand
    ? `Fragrance inspiree de ${brand} ${name}. ${profilCsv}. Pour lui.`
    : `Fragrance ${profilCsv.split(',')[0].trim().toLowerCase()}. ${profilCsv}. Pour lui.`

  return {
    key,
    name: brand ? `${name} – ${brand}` : name,
    brand: 'KAOUBI PERFUMES',
    description,
    price: BASE_PRICE,
    category: 'eau-de-parfum',
    image: PLACEHOLDER_IMAGE,
    sex: 'homme',
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
    console.log(`  [homme] ${product.name} (#${id})`)
  }

  console.log(`Seeded ${count} homme products.`)
}

try {
  await seed()
} catch (err) {
  console.error('Seed failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
