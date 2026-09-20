// Run with: node scripts/apply-homme-photos.mjs
// Copies matched bottle photos from ~/Downloads/men parfumes into public/products,
// then updates the matching homme products' imageUrl/images in the DB.
// Products with no confident match keep their current (placeholder) photo.
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { Pool } from 'pg'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env')
  process.exit(1)
}

const SOURCE_DIR = '/Users/abdelkaderbouzomita/Downloads/men parfumes'
const PUBLIC_PRODUCTS_DIR = join(process.cwd(), 'public', 'products')

/** productId -> { source: filename in SOURCE_DIR, slug: target filename (no ext) } */
const MATCHES = [
  { id: 133, source: 'Stronger With You.jpeg', slug: 'stronger-with-you' },
  { id: 134, source: 'Azzaro Wanted.jpeg', slug: 'wanted-azzaro' },
  { id: 136, source: 'Azzaro The Most Wanted.jpeg', slug: 'the-most-wanted-azzaro' },
  { id: 137, source: 'Allure Homme.jpeg', slug: 'allure-homme-sport' },
  { id: 140, source: 'Bleu de Chanel.jpeg', slug: 'bleu-de-chanel-homme' },
  { id: 141, source: 'Sauvage.jpeg', slug: 'sauvage-dior' },
  { id: 144, source: 'The One.jpeg', slug: 'the-one-for-men' },
  { id: 145, source: 'Fahrenheit.jpeg', slug: 'fahrenheit-dior' },
  { id: 146, source: 'La Nuit de L\'Homme.jpeg', slug: 'la-nuit-de-lhomme' },
  { id: 147, source: 'Polo Blue.jpeg', slug: 'polo-blue' },
  { id: 149, source: 'Boss Bottled.jpeg', slug: 'boss-bottled' },
  { id: 150, source: 'Boss Bottled Night.jpeg', slug: 'boss-bottled-night' },
  { id: 161, source: 'Pineapple.jpeg', slug: 'dg-pineapple' },
  { id: 162, source: 'Le Male Elixir.jpeg', slug: 'le-male-elixir-jpg-homme' },
  { id: 163, source: 'Stronger With You Intensely.jpeg', slug: 'stronger-with-you-intensely' },
  { id: 165, source: 'Tom Ford Black Orchid.jpeg', slug: 'black-orchid-tom-ford-homme' },
  { id: 174, source: '53 Boss Orange.jpeg', slug: 'boss-orange' },
  { id: 175, source: 'Lacoste Bleu.jpeg', slug: 'l1212-bleu-lacoste' },
  { id: 179, source: 'Black XS.jpeg', slug: 'black-xs-lexces' },
  { id: 181, source: 'Invictus.jpeg', slug: 'invictus-paco-rabanne' },
  { id: 182, source: 'King.jpeg', slug: 'the-king-dg' },
  { id: 183, source: 'Scandal.jpeg', slug: 'scandal-pour-homme' },
  { id: 188, source: 'Paradise Garden.jpeg', slug: 'le-beau-paradise-garden' },
]

function checkSources() {
  const missing = MATCHES.filter((m) => !existsSync(join(SOURCE_DIR, m.source)))
  if (missing.length > 0) {
    throw new Error(`Missing source files: ${missing.map((m) => m.source).join(', ')}`)
  }
}

function copyPhotos() {
  if (!existsSync(PUBLIC_PRODUCTS_DIR)) mkdirSync(PUBLIC_PRODUCTS_DIR, { recursive: true })
  for (const match of MATCHES) {
    const dest = join(PUBLIC_PRODUCTS_DIR, `${match.slug}.jpeg`)
    copyFileSync(join(SOURCE_DIR, match.source), dest)
  }
}

async function updateDb() {
  const pool = new Pool({ connectionString: DATABASE_URL })
  try {
    for (const match of MATCHES) {
      const url = `/products/${match.slug}.jpeg`
      const { rows } = await pool.query(
        `UPDATE products SET "imageUrl" = $1, images = $2, "updatedAt" = NOW()
         WHERE id = $3
         RETURNING name`,
        [url, JSON.stringify([url]), match.id],
      )
      if (rows[0]) {
        console.log(`  #${match.id} ${rows[0].name} → ${url}`)
      } else {
        console.warn(`  #${match.id} not found in DB`)
      }
    }
  } finally {
    await pool.end()
  }
}

checkSources()
copyPhotos()
await updateDb()
console.log(`Applied ${MATCHES.length} photo matches (${new Set(MATCHES.map((m) => m.slug)).size} unique files).`)
