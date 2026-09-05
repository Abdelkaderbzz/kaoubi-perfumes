// Dummy data for local/testing — products, orders, categories
// Run: node scripts/seed-dummy-data.mjs [--only=orders|products|categories|all] [--orders=25] [--products=20] [--clear]

import { Pool } from 'pg'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { existingProductImages } from './existing-images.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

const DEMO_BRAND = 'Demo'
const DEMO_CATEGORY_PREFIX = 'demo-'
const DEMO_CLIENT_PREFIX = 'Demo Client'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const GOVERNORATES = [
  'tunis',
  'ariana',
  'ben-arous',
  'sousse',
  'sfax',
  'nabeul',
  'monastir',
  'bizerte',
]

const CATEGORY_SLUGS = ['femme', 'homme']
const PLACEHOLDER_IMAGES = existingProductImages()

const EXTRA_CATEGORIES = [
  { name: 'Demo Parfums Premium', slug: 'demo-parfums-premium' },
  { name: 'Demo Accessoires', slug: 'demo-accessoires' },
  { name: 'Demo Coffrets', slug: 'demo-coffrets' },
]

function parseArgs(argv) {
  const options = {
    only: 'all',
    orders: 25,
    products: 20,
    clear: false,
    help: false,
  }

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }
    if (arg === '--clear') {
      options.clear = true
      continue
    }
    if (arg.startsWith('--only=')) {
      options.only = arg.slice('--only='.length)
      continue
    }
    if (arg.startsWith('--orders=')) {
      options.orders = Math.max(0, Number.parseInt(arg.slice('--orders='.length), 10) || 0)
      continue
    }
    if (arg.startsWith('--products=')) {
      options.products = Math.max(0, Number.parseInt(arg.slice('--products='.length), 10) || 0)
      continue
    }
  }

  return options
}

function printHelp() {
  console.log(`
Dummy data seeder — Water of Gold

Usage:
  node scripts/seed-dummy-data.mjs [options]

Options:
  --only=orders|products|categories|all   What to seed (default: all)
  --orders=25                             Number of demo orders (default: 25)
  --products=20                           Number of demo products (default: 20)
  --clear                                 Remove demo data before seeding
  --help, -h                              Show this help

npm shortcuts:
  pnpm seed:dummy          Full demo dataset
  pnpm seed:dummy:orders   Demo orders only
  pnpm seed:dummy:products Demo products only
  pnpm seed:dummy:clear    Remove all demo data
  pnpm seed:test           Migrate + admin + catalog + demo data

Demo data markers (safe to clear):
  - Products: brand = "Demo"
  - Categories: slug starts with "demo-"
  - Orders: customer name starts with "Demo Client"
`)
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPrice() {
  return (randomInt(19, 499) + randomInt(0, 999) / 1000).toFixed(3)
}

function daysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(randomInt(9, 20), randomInt(0, 59), 0, 0)
  return date
}

async function clearDemoData() {
  const orderIds = await pool.query(
    `SELECT id FROM orders WHERE "customerName" LIKE $1`,
    [`${DEMO_CLIENT_PREFIX}%`],
  )

  if (orderIds.rows.length > 0) {
    const ids = orderIds.rows.map((row) => row.id)
    await pool.query(`DELETE FROM order_items WHERE "orderId" = ANY($1::int[])`, [ids])
    await pool.query(`DELETE FROM orders WHERE id = ANY($1::int[])`, [ids])
    console.log(`  Removed ${ids.length} demo order(s)`)
  }

  const deletedProducts = await pool.query(`DELETE FROM products WHERE brand = $1 RETURNING id`, [DEMO_BRAND])
  if (deletedProducts.rowCount > 0) {
    console.log(`  Removed ${deletedProducts.rowCount} demo product(s)`)
  }

  const deletedCategories = await pool.query(
    `DELETE FROM categories WHERE slug LIKE $1 RETURNING slug`,
    [`${DEMO_CATEGORY_PREFIX}%`],
  )
  if (deletedCategories.rowCount > 0) {
    console.log(`  Removed ${deletedCategories.rowCount} demo categor(ies)`)
  }
}

async function seedDemoCategories() {
  let inserted = 0
  for (const category of EXTRA_CATEGORIES) {
    const result = await pool.query(
      `INSERT INTO categories (name, slug, "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [category.name, category.slug],
    )
    if (result.rowCount > 0) inserted += 1
  }
  console.log(`✓ Demo categories: ${inserted} new, ${EXTRA_CATEGORIES.length} total defined`)
}

async function seedDemoProducts(count) {
  if (count === 0) return

  if (PLACEHOLDER_IMAGES.length === 0) {
    console.error('No ready product images found in public/hero.')
    process.exit(1)
  }

  const demoCategories = [...CATEGORY_SLUGS, ...EXTRA_CATEGORIES.map((c) => c.slug)]

  for (let i = 1; i <= count; i += 1) {
    const category = demoCategories[i % demoCategories.length]
    const image = PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]
    const images = JSON.stringify([image])
    const featured = i % 5 === 0
    const published = i % 7 !== 0
    const inStock = i % 9 !== 0
    const padded = String(i).padStart(2, '0')

    await pool.query(
      `INSERT INTO products (
        name, brand, description, price, category,
        "imageUrl", images, sizes, "inStock", featured, published,
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
      [
        `Demo Produit ${padded}`,
        DEMO_BRAND,
        `Produit de test #${padded} pour pagination, filtres et statut visible/masque.`,
        randomPrice(),
        category,
        image,
        images,
        JSON.stringify(['50ml', '100ml'].map((size) => ({
          size,
          price: randomPrice(),
        }))),
        inStock,
        featured,
        published,
      ],
    )
  }

  const hidden = Math.floor(count / 7)
  const featured = Math.floor(count / 5)
  console.log(`✓ Demo products: ${count} inserted (~${featured} featured, ~${hidden} hidden)`)
}

async function seedDemoOrders(count) {
  if (count === 0) return

  const productsResult = await pool.query(
    `SELECT id, name, brand, price, sizes FROM products ORDER BY id ASC LIMIT 200`,
  )
  const products = productsResult.rows

  if (products.length === 0) {
    console.error('No products found. Run pnpm seed or pnpm seed:dummy:products first.')
    process.exit(1)
  }

  const deliveryFee = await pool.query(`SELECT "deliveryFee" FROM settings WHERE id = 1`)
  const fee = parseFloat(deliveryFee.rows[0]?.deliveryFee ?? '7')
  const boutiquesResult = await pool.query(
    `SELECT id, name, city FROM boutiques WHERE "pickupEnabled" = true ORDER BY "sortOrder" ASC, id ASC`,
  )
  const pickupBoutiques = boutiquesResult.rows

  for (let i = 1; i <= count; i += 1) {
    const orderType = i % 4 === 0 && pickupBoutiques.length > 0 ? 'boutique' : 'delivery'
    const status = STATUSES[i % STATUSES.length]
    const governorate = orderType === 'delivery' ? randomItem(GOVERNORATES) : null
    const pickup =
      orderType === 'boutique' ? pickupBoutiques[Math.floor(i / 4) % pickupBoutiques.length] : null
    const padded = String(i).padStart(3, '0')
    const createdAt = daysAgo(randomInt(0, 45))

    const itemCount = randomInt(1, 3)
    const lineItems = []
    let subtotal = 0

    for (let j = 0; j < itemCount; j += 1) {
      const product = products[(i + j) % products.length]
      const sizes = JSON.parse(product.sizes || '[]')
      const first = Array.isArray(sizes) ? sizes[0] : null
      const size =
        typeof first === 'string'
          ? first
          : first && typeof first === 'object' && first.size
            ? String(first.size)
            : 'Standard'
      const quantity = randomInt(1, 2)
      const unitPrice =
        first && typeof first === 'object' && first.price
          ? parseFloat(first.price)
          : parseFloat(product.price)
      subtotal += unitPrice * quantity

      lineItems.push({
        productId: product.id,
        productName: product.name,
        productBrand: product.brand,
        size,
        quantity,
        price: unitPrice.toFixed(3),
      })
    }

    const appliedFee = orderType === 'delivery' ? fee : 0
    const totalAmount = (subtotal + appliedFee).toFixed(3)

    const orderResult = await pool.query(
      `INSERT INTO orders (
        "customerName", "customerPhone", "customerAddress", "customerGovernorate",
        "orderType", "pickupBoutiqueId", "pickupBoutiqueName",
        status, "totalAmount", "deliveryFee", notes,
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
      RETURNING id`,
      [
        `${DEMO_CLIENT_PREFIX} ${padded}`,
        `+216 ${randomInt(20, 99)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
        orderType === 'delivery' ? `${randomInt(1, 120)} Rue de Test, cite demo` : null,
        governorate,
        orderType,
        pickup?.id ?? null,
        pickup ? `${pickup.name} (${pickup.city})` : null,
        status,
        totalAmount,
        appliedFee.toFixed(3),
        `[DUMMY] Commande de test #${padded}`,
        createdAt,
      ],
    )

    const orderId = orderResult.rows[0].id

    for (const item of lineItems) {
      await pool.query(
        `INSERT INTO order_items (
          "orderId", "productId", "productName", "productBrand", size, quantity, price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          item.productId,
          item.productName,
          item.productBrand,
          item.size,
          item.quantity,
          item.price,
        ],
      )
    }
  }

  console.log(`✓ Demo orders: ${count} inserted (mixed status, delivery & boutique)`)
}

async function printSummary() {
  const [products, orders, categories, boutiques, banners, hero] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM products`),
    pool.query(`SELECT COUNT(*)::int AS count FROM orders`),
    pool.query(`SELECT COUNT(*)::int AS count FROM categories`),
    pool.query(`SELECT COUNT(*)::int AS count FROM boutiques`),
    pool.query(`SELECT COUNT(*)::int AS count FROM banners`),
    pool.query(`SELECT COUNT(*)::int AS count FROM hero_images`),
  ])

  console.log('\nDatabase totals:')
  console.log(`  Products:   ${products.rows[0].count}`)
  console.log(`  Orders:     ${orders.rows[0].count}`)
  console.log(`  Categories: ${categories.rows[0].count}`)
  console.log(`  Boutiques:  ${boutiques.rows[0].count}`)
  console.log(`  Banners:    ${banners.rows[0].count}`)
  console.log(`  Hero slots: ${hero.rows[0].count}`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  if (options.clear && options.only === 'all') {
    console.log('Clearing demo data...')
    await clearDemoData()
    if (!process.argv.some((arg) => arg.startsWith('--only='))) {
      await printSummary()
      return
    }
  }

  if (options.clear) {
    console.log('Clearing demo data...')
    await clearDemoData()
  }

  const runAll = options.only === 'all'

  if (runAll || options.only === 'categories') {
    await seedDemoCategories()
  }

  if (runAll || options.only === 'products') {
    await seedDemoProducts(options.products)
  }

  if (runAll || options.only === 'orders') {
    await seedDemoOrders(options.orders)
  }

  if (!runAll && !['orders', 'products', 'categories'].includes(options.only)) {
    console.error(`Unknown --only value: ${options.only}`)
    printHelp()
    process.exit(1)
  }

  await printSummary()
  console.log('\nTest tips:')
  console.log('  - Admin orders: search "Demo Client" or filter by status')
  console.log('  - Admin products: search "Demo" — some are hidden (published=false)')
  console.log('  - Store: /products?category=demo-parfums-premium')
}

try {
  await main()
} catch (error) {
  console.error('Seed failed:', error.message)
  process.exit(1)
} finally {
  await pool.end()
}
