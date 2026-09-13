// Run with: node scripts/seed-mrazig-products.mjs
// Upserts the MRAZIG soins + bakhoor products without touching the perfume catalog.
import { Pool } from 'pg'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

const CATEGORIES = [
  { name: 'Soins', slug: 'soins' },
  { name: 'Bakhoor', slug: 'bakhoor' },
]

const PRODUCTS = [
  {
    name: 'Crème à mains nourrissante',
    brand: 'MRAZIG',
    description:
      'كريم مرطب ومغذي لليدين. Creme a mains au beurre de cacao, huile d\'amande douce, huile de pepins de raisin, HE orange et HE clou de girofle. Nourrit et protege les mains. 50 g.',
    price: '28.000',
    category: 'soins',
    image: '/products/creme-mains.webp',
    sizes: [{ size: '50 g', price: '28.000' }],
    featured: false,
  },
  {
    name: 'Gel nettoyant sans huile',
    brand: 'MRAZIG',
    description:
      'Gel nettoyante tous types de peaux. Nettoie, hydrate et apaise. Formule oil-free au kaolin, extrait d\'aloe vera et vitamine E. 150 ml.',
    price: '25.000',
    category: 'soins',
    image: '/products/gel-nettoyant-v2.webp',
    sizes: [{ size: '150 ml', price: '25.000' }],
    featured: false,
  },
  {
    name: 'بخور المرازيق التقليدي',
    brand: 'MRAZIG',
    description:
      'Bakhoor Mrazig traditionnel (بخور مريير). Encens artisanal aux notes chaudes et orientales, pour parfumer la maison.',
    price: '20.000',
    category: 'bakhoor',
    image: '/products/bakhoor-mrazig.webp',
    sizes: [{ size: 'Pot', price: '20.000' }],
    featured: false,
  },
]

async function upsertProduct(product) {
  const images = JSON.stringify([product.image])
  const sizes = JSON.stringify(product.sizes)
  const existing = await pool.query(
    `SELECT id FROM products WHERE name = $1 AND brand = $2 LIMIT 1`,
    [product.name, product.brand],
  )

  const values = [
    product.description,
    product.price,
    product.category,
    product.image,
    images,
    sizes,
    product.featured,
  ]

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id
    await pool.query(
      `UPDATE products SET
        description = $1, price = $2, category = $3,
        "imageUrl" = $4, images = $5, sizes = $6, featured = $7,
        published = true, "inStock" = true, "updatedAt" = NOW()
       WHERE id = $8`,
      [...values, id],
    )
    return id
  }

  const inserted = await pool.query(
    `INSERT INTO products (
      name, brand, description, price, category,
      "imageUrl", images, sizes, featured, published, "inStock",
      "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, true, true, NOW(), NOW()
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
      product.featured,
    ],
  )
  return inserted.rows[0].id
}

try {
  for (const category of CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (name, slug, "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()`,
      [category.name, category.slug],
    )
  }

  const ids = []
  for (const product of PRODUCTS) {
    const id = await upsertProduct(product)
    ids.push(id)
    console.log(`  [${product.category}] ${product.name} (#${id})`)
  }

  if (ids[0] && ids[1]) {
    await pool.query(
      `UPDATE products SET "relatedProductIds" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [JSON.stringify([ids[1]]), ids[0]],
    )
    await pool.query(
      `UPDATE products SET "relatedProductIds" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [JSON.stringify([ids[0]]), ids[1]],
    )
  }

  console.log(`Seeded ${PRODUCTS.length} MRAZIG products.`)
} catch (err) {
  console.error('Seed failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
