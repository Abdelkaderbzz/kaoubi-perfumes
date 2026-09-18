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
    "description" text NOT NULL DEFAULT '',
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
    "sex" text,
    "inStock" boolean NOT NULL DEFAULT true,
    "stockQuantity" integer,
    "featured" boolean NOT NULL DEFAULT false,
    "newArrival" boolean NOT NULL DEFAULT false,
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
  `CREATE INDEX IF NOT EXISTS "products_created_at_idx" ON "products" ("createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "products_category_created_at_idx" ON "products" ("category", "createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "products_published_created_at_idx" ON "products" ("published", "createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "products_in_stock_idx" ON "products" ("inStock")`,
  `CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("userId")`,
]

const INCREMENTAL_ALTERS = [
  `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "bannerUrl" text`,
  `ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT ''`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "published" boolean NOT NULL DEFAULT true`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "compareAtPrice" numeric(10, 3)`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "relatedProductIds" text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fragranceNotes" text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "composition" text NOT NULL DEFAULT '{"tete":[],"coeur":[],"fond":[]}'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "wearMoments" text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "intensity" text`,
  `ALTER TABLE "products" DROP COLUMN IF EXISTS "type"`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sex" text`,
  // Categories now describe product format (Parfum, Eau de Ligne, Mkhamaria, ...)
  // instead of audience; audience moved to the new "sex" column above.
  `INSERT INTO "categories" ("name", "slug") VALUES
    ('Parfum', 'parfum'),
    ('Eau de Parfum', 'eau-de-parfum'),
    ('Parfum solide', 'parfum-solide'),
    ('Eau de Ligne', 'eau-de-ligne'),
    ('Parfum d''ambiance', 'parfum-d-ambiance'),
    ('Body Mist', 'body-mist'),
    ('Body Shimmer', 'body-shimmer'),
    ('Mkhamaria', 'mkhamaria')
   ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = NOW()`,
  `DELETE FROM "categories" WHERE "slug" IN ('femme', 'homme', 'mixte')`,
  `UPDATE "categories" SET "name" = 'Mixte' WHERE "slug" = 'unisexe' AND "name" = 'Unisexe'`,
  `DELETE FROM "categories" WHERE "slug" IN ('sif', 'chta')`,
  `INSERT INTO "categories" ("name", "slug") VALUES
    ('Mixte', 'mixte'),
    ('Enfant', 'enfant')
   ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = NOW()`,
  `UPDATE "products" SET "category" = 'mixte', "updatedAt" = NOW()
   WHERE "category" IN ('unisexe', 'unisex')`,
  `DELETE FROM "categories" WHERE "slug" IN ('unisexe', 'unisex')`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "newArrival" boolean NOT NULL DEFAULT false`,
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
  `CREATE INDEX IF NOT EXISTS "products_created_at_idx" ON "products" ("createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "products_category_created_at_idx" ON "products" ("category", "createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "products_published_created_at_idx" ON "products" ("published", "createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "products_in_stock_idx" ON "products" ("inStock")`,
  `CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("userId")`,
  `DELETE FROM "hero_images"
   WHERE "imageUrl" IN ('/hero/boutique-stand.webp', '/hero/boutique-logo-wall.webp')`,
  `INSERT INTO "hero_images" ("slot", "imageUrl", "alt") VALUES
    (3, '/hero/boutique-cosmetic.webp', 'Univers cosmetique de la boutique KAOUBI PERFUMES')
   ON CONFLICT ("slot") DO NOTHING`,
  `INSERT INTO "boutiques"
    ("slug", "name", "city", "region", "description", "imageUrl", "imageAlt", "address", "phone", "rating", "reviewCount", "ratingSource", "directionsUrl", "pickupEnabled", "published", "sortOrder")
   VALUES
    ('moknine-monastir', 'KAOUBI PERFUMES Moknine', 'Moknine', 'Monastir',
     '',
     NULL, '', NULL, NULL, NULL, NULL, 'Google Maps', '', false, false, 1)
   ON CONFLICT ("slug") DO NOTHING`,
  `UPDATE "boutiques" SET
       "name" = 'KAOUBI PERFUMES Moknine',
       "description" = '',
       "imageUrl" = NULL,
       "imageAlt" = '',
       "address" = NULL,
       "phone" = NULL,
       "directionsUrl" = '',
       "published" = false,
       "pickupEnabled" = false,
       "updatedAt" = NOW()
   WHERE "slug" = 'moknine-monastir'`,
  `UPDATE "banners"
      SET "message" = replace("message", ' et Moknine', ''),
          "updatedAt" = NOW()
    WHERE "message" ILIKE '%Moknine%'`,
  `DELETE FROM "boutiques" WHERE "slug" = 'ksar-helal-monastir'`,
  `INSERT INTO "categories" ("name", "slug") VALUES
    ('Parfum solide', 'parfum-solide'),
    ('Parfum d''ambiance', 'parfum-d-ambiance')
   ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = NOW()`,
  `INSERT INTO "categories" ("name", "slug") VALUES
    ('Parfum Originaux', 'parfum-originaux')
   ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = NOW()`,
  `UPDATE "products" SET "category" = 'parfum-d-ambiance', "updatedAt" = NOW()
   WHERE "category" = 'bakhoor'`,
  `DELETE FROM "categories" WHERE "slug" IN ('bakhoor', 'soins', 'body-shimmer')`,
  // Stock counter. NULL keeps a product uncounted, so the manual "inStock"
  // switch stays in charge until the shop types a number.
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stockQuantity" integer`,
  // "Eau de Ligne" is really a linen mist -> "Parfum de linge".
  `DELETE FROM "categories"
    WHERE "slug" = 'eau-de-ligne'
      AND EXISTS (SELECT 1 FROM "categories" WHERE "slug" = 'parfum-de-linge')`,
  `UPDATE "categories" SET "slug" = 'parfum-de-linge', "name" = 'Parfum de linge', "updatedAt" = NOW()
    WHERE "slug" = 'eau-de-ligne'`,
  `INSERT INTO "categories" ("name", "slug") VALUES ('Parfum de linge', 'parfum-de-linge')
   ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "updatedAt" = NOW()`,
  `UPDATE "products" SET "category" = 'parfum-de-linge', "updatedAt" = NOW()
    WHERE "category" = 'eau-de-ligne'`,
  `UPDATE "products"
      SET "name" = replace("name", 'Eau de Ligne', 'Parfum de linge'), "updatedAt" = NOW()
    WHERE "name" ILIKE '%Eau de Ligne%'`,
  // "Enfant" stops being a category and becomes an audience ("sex") value.
  // Products filed under it keep their audience and fall back to Eau de Parfum.
  `UPDATE "products" SET "sex" = 'enfant', "updatedAt" = NOW() WHERE "category" = 'enfant'`,
  `UPDATE "products" SET "category" = 'eau-de-parfum', "updatedAt" = NOW()
    WHERE "category" = 'enfant'`,
  `DELETE FROM "categories" WHERE "slug" = 'enfant'`,
  // The hero mosaic became a single photo: keep slot 0, drop the rest.
  `DELETE FROM "hero_images" WHERE "slot" > 0`,
]

const BASELINE_DATA = [
  `INSERT INTO "settings" ("id", "deliveryFee") VALUES (1, '7.000')
   ON CONFLICT ("id") DO NOTHING`,
  `INSERT INTO "categories" ("name", "slug") VALUES
    ('Parfum', 'parfum'),
    ('Eau de Parfum', 'eau-de-parfum'),
    ('Parfum solide', 'parfum-solide'),
    ('Parfum de linge', 'parfum-de-linge'),
    ('Parfum d''ambiance', 'parfum-d-ambiance'),
    ('Parfum Originaux', 'parfum-originaux'),
    ('Body Mist', 'body-mist'),
    ('Mkhamaria', 'mkhamaria')
   ON CONFLICT ("slug") DO NOTHING`,
  `INSERT INTO "boutiques"
    ("slug", "name", "city", "region", "description", "imageUrl", "imageAlt", "address", "phone", "rating", "reviewCount", "ratingSource", "directionsUrl", "pickupEnabled", "published", "sortOrder")
   VALUES
    ('douz-kebili', 'KAOUBI PERFUMES Douz', 'Douz', 'Douz Nord',
     'Notre boutique a Douz, Kébili. Toute la collection femme et homme, avec conseil personnalise sur place.',
     '/boutiques/storefront.webp', 'Boutique KAOUBI PERFUMES a Douz',
     'Rue de Habib Bourguiba, Douz Nord, Douz, Kébili, 4260', '94 090 440', NULL, NULL, 'Google Maps',
     'https://maps.app.goo.gl/PGd9YKWWMaWsfbk46', true, true, 0),
    ('moknine-monastir', 'KAOUBI PERFUMES Moknine', 'Moknine', 'Monastir',
     '',
     NULL, '', NULL, NULL, NULL, NULL, 'Google Maps', '', false, false, 1)
   ON CONFLICT ("slug") DO NOTHING`,
  `INSERT INTO "carousel_videos" ("url", "sortOrder") VALUES
    ('https://www.instagram.com/reel/DZ3XNGpsShF/', 0),
    ('https://www.instagram.com/reel/DYdIM1eMPri/', 1),
    ('https://www.instagram.com/reel/DaTQO_4RzjP/', 2),
    ('https://www.instagram.com/reel/DZvMI4OsOJd/', 3)
   ON CONFLICT ("url") DO NOTHING`,
  `INSERT INTO "hero_images" ("slot", "imageUrl", "alt") VALUES
    (0, '/hero/boutique-counter-v2.webp', 'Comptoir Chanel de la boutique KAOUBI PERFUMES a Douz')
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
