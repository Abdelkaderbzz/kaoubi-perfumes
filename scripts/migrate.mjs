// Run with: node scripts/migrate.mjs [--reset]
// --reset drops every app table, recreates the current schema, then seeds baseline rows.
import { Pool } from 'pg'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set.')
  process.exit(1)
}

const reset = process.argv.includes('--reset')
const pool = new Pool({ connectionString: DATABASE_URL })

const DROP_TABLES = `
  DROP TABLE IF EXISTS
    "order_items",
    "orders",
    "products",
    "categories",
    "settings",
    "banners",
    "boutiques",
    "carousel_videos",
    "hero_images",
    "session",
    "account",
    "verification",
    "user"
  CASCADE
`

const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "role" text NOT NULL DEFAULT 'user',
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "expiresAt" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp,
    "refreshTokenExpiresAt" timestamp,
    "scope" text,
    "password" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "categories" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "bannerUrl" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "settings" (
    "id" integer PRIMARY KEY DEFAULT 1,
    "deliveryFee" numeric(10, 3) NOT NULL DEFAULT '7.000',
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "banners" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL DEFAULT '',
    "message" text NOT NULL,
    "variant" text NOT NULL DEFAULT 'offer',
    "backgroundColor" text NOT NULL DEFAULT '#c9a44a',
    "textColor" text NOT NULL DEFAULT '#0b0b0b',
    "fontSize" integer NOT NULL DEFAULT 13,
    "linkLabel" text NOT NULL DEFAULT '',
    "linkHref" text NOT NULL DEFAULT '',
    "dismissible" boolean NOT NULL DEFAULT true,
    "active" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "boutiques" (
    "id" serial PRIMARY KEY,
    "slug" text NOT NULL UNIQUE,
    "name" text NOT NULL,
    "city" text NOT NULL,
    "region" text NOT NULL DEFAULT '',
    "description" text NOT NULL DEFAULT '',
    "imageUrl" text,
    "imageAlt" text NOT NULL DEFAULT '',
    "address" text,
    "phone" text,
    "rating" numeric(2, 1),
    "reviewCount" integer,
    "ratingSource" text NOT NULL DEFAULT 'Google Maps',
    "directionsUrl" text NOT NULL DEFAULT '',
    "pickupEnabled" boolean NOT NULL DEFAULT true,
    "published" boolean NOT NULL DEFAULT true,
    "sortOrder" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "carousel_videos" (
    "id" serial PRIMARY KEY,
    "url" text NOT NULL UNIQUE,
    "sortOrder" integer NOT NULL DEFAULT 0,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "hero_images" (
    "slot" integer PRIMARY KEY,
    "imageUrl" text NOT NULL,
    "alt" text NOT NULL DEFAULT '',
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "products" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "brand" text NOT NULL,
    "description" text,
    "price" numeric(10, 3) NOT NULL,
    "compareAtPrice" numeric(10, 3),
    "category" text NOT NULL DEFAULT 'unisex',
    "imageUrl" text,
    "images" text NOT NULL DEFAULT '[]',
    "sizes" text NOT NULL DEFAULT '[]',
    "relatedProductIds" text NOT NULL DEFAULT '[]',
    "fragranceNotes" text NOT NULL DEFAULT '[]',
    "composition" text NOT NULL DEFAULT '{"tete":[],"coeur":[],"fond":[]}',
    "wearMoments" text NOT NULL DEFAULT '[]',
    "intensity" text,
    "inStock" boolean NOT NULL DEFAULT true,
    "featured" boolean NOT NULL DEFAULT false,
    "published" boolean NOT NULL DEFAULT true,
    "promoTagEnabled" boolean NOT NULL DEFAULT false,
    "promoTagLabel" text NOT NULL DEFAULT 'Promotion',
    "promoTagBgColor" text NOT NULL DEFAULT '#c81e1e',
    "promoTagTextColor" text NOT NULL DEFAULT '#ffffff',
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "orders" (
    "id" serial PRIMARY KEY,
    "customerName" text NOT NULL,
    "customerPhone" text NOT NULL,
    "customerAddress" text,
    "customerGovernorate" text,
    "orderType" text NOT NULL DEFAULT 'delivery',
    "pickupBoutiqueId" integer,
    "pickupBoutiqueName" text,
    "status" text NOT NULL DEFAULT 'pending',
    "totalAmount" numeric(10, 3) NOT NULL,
    "deliveryFee" numeric(10, 3) NOT NULL DEFAULT '7.000',
    "notes" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "order_items" (
    "id" serial PRIMARY KEY,
    "orderId" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "productId" integer NOT NULL,
    "productName" text NOT NULL,
    "productBrand" text NOT NULL,
    "size" text NOT NULL,
    "quantity" integer NOT NULL DEFAULT 1,
    "price" numeric(10, 3) NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "banners_single_active_idx" ON "banners" ("active") WHERE "active"`,
  `CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status")`,
  `CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" ("orderId")`,
]

const INCREMENTAL_ALTERS = [
  `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "bannerUrl" text`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "published" boolean NOT NULL DEFAULT true`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "compareAtPrice" numeric(10, 3)`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "relatedProductIds" text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fragranceNotes" text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "composition" text NOT NULL DEFAULT '{"tete":[],"coeur":[],"fond":[]}'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "wearMoments" text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "intensity" text`,
  `UPDATE "categories" SET "name" = 'Mixte' WHERE "slug" = 'unisexe' AND "name" = 'Unisexe'`,
  `UPDATE "categories" SET "name" = 'Parfum d''Hiver' WHERE "slug" = 'chta'`,
  `UPDATE "categories" SET "name" = 'Parfum d''Ete' WHERE "slug" = 'sif'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "promoTagEnabled" boolean NOT NULL DEFAULT false`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "promoTagLabel" text NOT NULL DEFAULT 'Promotion'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "promoTagBgColor" text NOT NULL DEFAULT '#c81e1e'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "promoTagTextColor" text NOT NULL DEFAULT '#ffffff'`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerGovernorate" text`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickupBoutiqueId" integer`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickupBoutiqueName" text`,
  `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "bannerEnabled" boolean NOT NULL DEFAULT false`,
  `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "bannerMessage" text NOT NULL DEFAULT ''`,
  `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "bannerVariant" text NOT NULL DEFAULT 'offer'`,
  `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "bannerLinkLabel" text NOT NULL DEFAULT ''`,
  `ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "bannerLinkHref" text NOT NULL DEFAULT ''`,
  `INSERT INTO "banners" ("name", "message", "variant", "linkLabel", "linkHref", "active")
   SELECT 'Banniere importee', "bannerMessage", "bannerVariant", "bannerLinkLabel", "bannerLinkHref", "bannerEnabled"
   FROM "settings"
   WHERE "id" = 1
     AND "bannerMessage" != ''
     AND NOT EXISTS (SELECT 1 FROM "banners")`,
  `UPDATE "products"
   SET "images" = json_build_array("imageUrl")::text
   WHERE "imageUrl" IS NOT NULL
     AND "imageUrl" != ''
     AND ("images" IS NULL OR "images" = '[]')`,
  `DELETE FROM "categories" WHERE "slug" IN ('parfums', 'maquillage', 'sacs', 'soins', 'unisex', 'tous')`,
  `UPDATE "boutiques"
   SET "slug" = 'douz-kebili',
       "name" = 'KAOUBI PERFUMES Douz',
       "city" = 'Douz',
       "region" = 'Douz Nord',
       "description" = 'Notre boutique a Douz, Kébili. Toute la collection femme et homme, avec conseil personnalise sur place.',
       "imageAlt" = 'Boutique KAOUBI PERFUMES a Douz',
       "address" = 'Rue de Habib Bourguiba, Douz Nord, Douz, Kébili, 4260',
       "phone" = '94 090 440',
       "rating" = NULL,
       "reviewCount" = NULL,
       "ratingSource" = 'Google Maps',
       "directionsUrl" = 'https://maps.app.goo.gl/PGd9YKWWMaWsfbk46',
       "updatedAt" = NOW()
   WHERE "slug" = 'sahloul-sousse'
     AND NOT EXISTS (SELECT 1 FROM "boutiques" WHERE "slug" = 'douz-kebili')`,
  `UPDATE "boutiques"
   SET "name" = 'KAOUBI PERFUMES Douz',
       "city" = 'Douz',
       "region" = 'Douz Nord',
       "description" = 'Notre boutique a Douz, Kébili. Toute la collection femme et homme, avec conseil personnalise sur place.',
       "imageAlt" = 'Boutique KAOUBI PERFUMES a Douz',
       "address" = 'Rue de Habib Bourguiba, Douz Nord, Douz, Kébili, 4260',
       "phone" = '94 090 440',
       "directionsUrl" = 'https://maps.app.goo.gl/PGd9YKWWMaWsfbk46',
       "updatedAt" = NOW()
   WHERE "slug" = 'douz-kebili'`,
  `UPDATE "boutiques" SET "published" = false, "pickupEnabled" = false, "updatedAt" = NOW()
   WHERE "slug" = 'moknine-monastir'`,
]

const BASELINE_DATA = [
  `INSERT INTO "settings" ("id", "deliveryFee") VALUES (1, '7.000')
   ON CONFLICT ("id") DO NOTHING`,
  `INSERT INTO "categories" ("name", "slug") VALUES
    ('Femme', 'femme'),
    ('Homme', 'homme'),
    ('Mixte', 'unisexe'),
    ('Parfum d''Hiver', 'chta'),
    ('Parfum d''Ete', 'sif')
   ON CONFLICT ("slug") DO NOTHING`,
  `INSERT INTO "boutiques"
    ("slug", "name", "city", "region", "description", "imageUrl", "imageAlt", "address", "phone", "rating", "reviewCount", "ratingSource", "directionsUrl", "sortOrder")
   VALUES
    ('douz-kebili', 'KAOUBI PERFUMES Douz', 'Douz', 'Douz Nord',
     'Notre boutique a Douz, Kébili. Toute la collection femme et homme, avec conseil personnalise sur place.',
     '/boutiques/storefront.webp', 'Boutique KAOUBI PERFUMES a Douz',
     'Rue de Habib Bourguiba, Douz Nord, Douz, Kébili, 4260', '94 090 440', NULL, NULL, 'Google Maps',
     'https://maps.app.goo.gl/PGd9YKWWMaWsfbk46', 0)
   ON CONFLICT ("slug") DO NOTHING`,
  `INSERT INTO "carousel_videos" ("url", "sortOrder") VALUES
    ('https://www.instagram.com/reel/DZ3XNGpsShF/', 0),
    ('https://www.instagram.com/reel/DYdIM1eMPri/', 1),
    ('https://www.instagram.com/reel/DaTQO_4RzjP/', 2),
    ('https://www.instagram.com/reel/DZvMI4OsOJd/', 3)
   ON CONFLICT ("url") DO NOTHING`,
  `INSERT INTO "hero_images" ("slot", "imageUrl", "alt") VALUES
    (0, '/hero/boutique-arches.webp', 'Rayonnages de la boutique KAOUBI PERFUMES'),
    (1, '/hero/boutique-cosmetic.webp', 'Espace cosmetique KAOUBI PERFUMES'),
    (2, '/hero/boutique-counter.webp', 'Comptoir de la boutique KAOUBI PERFUMES'),
    (3, '/hero/boutique-logo-wall.webp', 'Boutique KAOUBI PERFUMES a Douz')
   ON CONFLICT ("slot") DO NOTHING`,
  `INSERT INTO "banners" (
      "name", "message", "variant", "backgroundColor", "textColor", "fontSize",
      "linkLabel", "linkHref", "dismissible", "active"
    )
    SELECT
      'Livraison',
      'Livraison partout en Tunisie · Retrait en boutique a Douz',
      'offer',
      '#d4af37',
      '#0b0b0b',
      13,
      'Voir la boutique',
      '/products',
      true,
      true
    WHERE NOT EXISTS (SELECT 1 FROM "banners")`,
]

async function run(sql) {
  await pool.query(sql)
}

try {
  if (reset) {
    console.log('Resetting database (drop all tables)...')
    await run(DROP_TABLES)
  }

  for (const sql of CREATE_TABLES) {
    await run(sql)
  }

  if (!reset) {
    for (const sql of INCREMENTAL_ALTERS) {
      await run(sql)
    }
  }

  for (const sql of BASELINE_DATA) {
    await run(sql)
  }

  console.log(reset ? '✓ Schema reset and baseline data seeded' : '✓ Migration complete')
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
