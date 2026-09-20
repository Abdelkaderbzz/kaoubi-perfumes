// Run with: node scripts/apply-femme-photos.mjs
// Copies matched bottle photos from ~/Downloads/femme images into public/products,
// then updates the matching femme products' imageUrl/images in the DB.
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

const SOURCE_DIR = '/Users/abdelkaderbouzomita/Downloads/femme images'
const PUBLIC_PRODUCTS_DIR = join(process.cwd(), 'public', 'products')

/** productId -> { source: filename in SOURCE_DIR, slug: target filename (no ext) } */
const MATCHES = [
  { id: 52, source: 'MUGLER  Alien .jpeg', slug: 'alien-mugler-femme' },
  { id: 53, source: 'Chanel — Coco Mademoiselle.jpeg', slug: 'coco-mademoiselle' },
  { id: 54, source: 'Chanel — Chance.jpeg', slug: 'chance-chanel' },
  { id: 55, source: 'Versace — Crystal Noir.jpeg', slug: 'crystal-noir' },
  { id: 56, source: 'DOLCE & GABBANA The One.jpeg', slug: 'the-one-dg' },
  { id: 57, source: 'Dior — Addict.jpeg', slug: 'dior-addict' },
  { id: 59, source: 'Yves Rocher — Evidence.jpeg', slug: 'evidence-yves-rocher' },
  { id: 60, source: 'Escada — Taj Sunset.jpeg', slug: 'escada-taj' },
  { id: 62, source: 'Gucci — Flora.jpeg', slug: 'gucci-flora' },
  { id: 63, source: 'Gucci — Bamboo.jpeg', slug: 'gucci-bamboo-femme' },
  { id: 64, source: 'Gucci — Bloom.jpeg', slug: 'gucci-bloom' },
  { id: 65, source: 'Carolina Herrera — Good Girl.jpeg', slug: 'good-girl' },
  { id: 67, source: 'Givenchy — Play.jpeg', slug: 'givenchy-play' },
  { id: 68, source: 'Givenchy — Play.jpeg', slug: 'givenchy-play' },
  { id: 69, source: 'Burberry — Her.jpeg', slug: 'burberry-her' },
  { id: 70, source: 'Burberry — Goddess.jpeg', slug: 'burberry-goddess' },
  { id: 71, source: 'Dior — Hypnotic Poison.jpeg', slug: 'hypnotic-poison' },
  { id: 74, source: "Dior — J'adore.jpeg", slug: 'jadore' },
  { id: 75, source: 'Lancôme — La Vie Est Belle.jpeg', slug: 'la-vie-est-belle' },
  { id: 77, source: "Nina Ricci — L'Extase.jpeg", slug: 'lextase' },
  { id: 78, source: 'GUERLAIN Mon Guerlain.jpeg', slug: 'mon-guerlain' },
  { id: 79, source: "Guerlain — L'Instant de Guerlain.jpeg", slug: 'linstant-de-guerlain' },
  { id: 82, source: 'YVES SAINT LAURENT Mon Paris.jpeg', slug: 'mon-paris' },
  { id: 83, source: 'Dior — Miss Dior.jpeg', slug: 'miss-dior' },
  { id: 84, source: 'Dior — Miss Dior.jpeg', slug: 'miss-dior' },
  { id: 86, source: 'Narciso Rodriguez — Rose.jpeg', slug: 'narciso-for-her-rose' },
  { id: 87, source: 'Nina Ricci — Olympéa.jpeg', slug: 'olympea' },
  { id: 90, source: 'Giorgio Armani — Sì.jpeg', slug: 'si-armani' },
  { id: 92, source: 'Giorgio Armani — My Way.jpeg', slug: 'my-way-armani' },
  { id: 93, source: 'Giorgio Armani — My Way.jpeg', slug: 'my-way-armani' },
  { id: 94, source: 'Lancôme — Midnight Rose.jpeg', slug: 'tresor-midnight-rose' },
  { id: 95, source: 'Lancôme — La Nuit Trésor.jpeg', slug: 'tresor-la-nuit' },
  { id: 101, source: 'Yves Saint Laurent — Libre.jpeg', slug: 'libre-ysl' },
  { id: 102, source: 'Yves Saint Laurent — Libre Intense.jpeg', slug: 'libre-intense' },
  { id: 103, source: 'YVES SAINT LAURENT Libre Berry Crush.jpeg', slug: 'libre-berry-crush' },
  { id: 107, source: 'jean paul gaultier scandal.jpeg', slug: 'scandal-jpg' },
  { id: 108, source: 'jean paul gaultier scandal by night.jpeg', slug: 'scandal-absolu' },
  { id: 109, source: 'JEAN PAUL GAULTIER So Scandal.jpeg', slug: 'scandal-a-paris' },
  { id: 112, source: 'Asdaaf — Ameerat Al Arab.jpeg', slug: 'amirat-el-arab' },
  { id: 115, source: 'Kayali — Marshmallow.jpeg', slug: 'kayali-marshmallow' },
  { id: 116, source: 'Kayali — Eden Juicy.jpeg', slug: 'kayali-eden-juicy-apple' },
  { id: 125, source: 'Lancôme — La Vie Est Belle.jpeg', slug: 'la-vie-est-belle-vanille' },
  { id: 131, source: 'Kayali — Vanilla.jpeg', slug: 'kayali-musk-vanilla' },
  { id: 132, source: 'Kayali — Maldives.jpeg', slug: 'kayali-maldives' },
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
