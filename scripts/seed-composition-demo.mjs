// One-off: attach a demo perfume composition to an existing product.
// Run: node scripts/seed-composition-demo.mjs
import { Pool } from 'pg'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env')
  process.exit(1)
}

const composition = {
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
}

const pool = new Pool({ connectionString: DATABASE_URL })

try {
  // Prefer Bleu Chanel if present, otherwise first published product
  const { rows } = await pool.query(
    `SELECT id, name FROM products
     WHERE published = true
     ORDER BY
       CASE WHEN name ILIKE '%Bleu Chanel%' AND name NOT ILIKE '%Exclusif%' THEN 0 ELSE 1 END,
       id
     LIMIT 1`,
  )

  if (rows.length === 0) {
    console.error('No published product found')
    process.exit(1)
  }

  const product = rows[0]
  await pool.query(
    `UPDATE products
     SET composition = $1::text,
         "fragranceNotes" = $2::text,
         "wearMoments" = $3::text,
         intensity = $4,
         "updatedAt" = NOW()
     WHERE id = $5`,
    [
      JSON.stringify(composition),
      JSON.stringify(['citrus', 'woody', 'fresh-spicy']),
      JSON.stringify(['jour', 'nuit']),
      'forte',
      product.id,
    ],
  )

  console.log(`✓ Composition added to #${product.id} — ${product.name}`)
  console.log(`  Open: http://localhost:3000/products/${product.id}`)
} finally {
  await pool.end()
}
