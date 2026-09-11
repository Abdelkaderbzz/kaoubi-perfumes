import { boolean, integer, numeric, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'

// Better Auth tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// App tables
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  bannerUrl: text('bannerUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

/** Single row (id = 1) holding shop-wide settings. */
export const settings = pgTable('settings', {
  id: integer('id').primaryKey().default(1),
  deliveryFee: numeric('deliveryFee', { precision: 10, scale: 3 }).notNull().default('7.000'),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

/** Saved announcement banners. At most one row has active = true; the rest are
 *  drafts the admin can switch to. */
export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  /** Internal label so the admin can tell saved banners apart. */
  name: text('name').notNull().default(''),
  message: text('message').notNull(),
  /** Preset that seeds the colours; colours stay independently editable. */
  variant: text('variant').notNull().default('offer'),
  backgroundColor: text('backgroundColor').notNull().default('#d4af37'),
  textColor: text('textColor').notNull().default('#0a0a0a'),
  fontSize: integer('fontSize').notNull().default(13),
  linkLabel: text('linkLabel').notNull().default(''),
  linkHref: text('linkHref').notNull().default(''),
  dismissible: boolean('dismissible').notNull().default(true),
  active: boolean('active').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

/** Physical shops, shown on the homepage and offered as pickup points. */
export const boutiques = pgTable('boutiques', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  region: text('region').notNull().default(''),
  description: text('description').notNull().default(''),
  imageUrl: text('imageUrl'),
  imageAlt: text('imageAlt').notNull().default(''),
  address: text('address'),
  phone: text('phone'),
  rating: numeric('rating', { precision: 2, scale: 1 }),
  reviewCount: integer('reviewCount'),
  ratingSource: text('ratingSource').notNull().default('Google Maps'),
  directionsUrl: text('directionsUrl').notNull().default(''),
  /** Offered as a pickup point at checkout. */
  pickupEnabled: boolean('pickupEnabled').notNull().default(true),
  /** Shown in the homepage boutiques section. */
  published: boolean('published').notNull().default(true),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const carouselVideos = pgTable('carousel_videos', {
  id: serial('id').primaryKey(),
  url: text('url').notNull().unique(),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

/** Fixed homepage hero campaign slots (0–3). */
export const heroImages = pgTable('hero_images', {
  slot: integer('slot').primaryKey(),
  imageUrl: text('imageUrl').notNull(),
  alt: text('alt').notNull().default(''),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 3 }).notNull(),
  /** Old / compare-at price for strikethrough + discount %. Null = no discount. */
  compareAtPrice: numeric('compareAtPrice', { precision: 10, scale: 3 }),
  category: text('category').notNull().default('unisex'),
  imageUrl: text('imageUrl'),
  images: text('images').notNull().default('[]'),
  /** JSON array of `{ size, price }` variants. Empty = single unique price. */
  sizes: text('sizes').notNull().default('[]'),
  /** JSON array of product ids curated by the admin. Empty = fall back to the
   *  same category on the storefront. */
  relatedProductIds: text('relatedProductIds').notNull().default('[]'),
  /** JSON array of fragrance note values (see lib/fragrance-notes.ts). */
  fragranceNotes: text('fragranceNotes').notNull().default('[]'),
  /** JSON pyramid: `{ tete, coeur, fond }` note arrays (see lib/perfume-composition.ts). */
  composition: text('composition').notNull().default('{"tete":[],"coeur":[],"fond":[]}'),
  /** JSON array of "quand le porter" tags (see lib/product-wear.ts). */
  wearMoments: text('wearMoments').notNull().default('[]'),
  /** Single intensity level slug (see lib/product-intensity.ts), or null. */
  intensity: text('intensity'),
  inStock: boolean('inStock').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  published: boolean('published').notNull().default(true),
  /** Optional storefront promo badge (e.g. "Promotion"). */
  promoTagEnabled: boolean('promoTagEnabled').notNull().default(false),
  promoTagLabel: text('promoTagLabel').notNull().default('Promotion'),
  promoTagBgColor: text('promoTagBgColor').notNull().default('#c81e1e'),
  promoTagTextColor: text('promoTagTextColor').notNull().default('#ffffff'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerName: text('customerName').notNull(),
  customerPhone: text('customerPhone').notNull(),
  customerAddress: text('customerAddress'),
  customerGovernorate: text('customerGovernorate'),
  orderType: text('orderType').notNull().default('delivery'),
  /** Chosen pickup shop for orderType = 'boutique'. The name is snapshotted so
   *  order history survives a boutique being renamed or removed. */
  pickupBoutiqueId: integer('pickupBoutiqueId'),
  pickupBoutiqueName: text('pickupBoutiqueName'),
  status: text('status').notNull().default('pending'),
  totalAmount: numeric('totalAmount', { precision: 10, scale: 3 }).notNull(),
  deliveryFee: numeric('deliveryFee', { precision: 10, scale: 3 }).notNull().default('7.000'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('orderId').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('productId').notNull(),
  productName: text('productName').notNull(),
  productBrand: text('productBrand').notNull(),
  size: text('size').notNull(),
  quantity: integer('quantity').notNull().default(1),
  price: numeric('price', { precision: 10, scale: 3 }).notNull(),
})
