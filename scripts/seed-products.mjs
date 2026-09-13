// Run with: node scripts/seed-products.mjs
// Upserts the KAOUBI PERFUMES perfume catalog and wires relatedProductIds.
// Only products with a dedicated ready bottle photo are seeded.
// --force also removes leftover non-catalog products (except open-order SKUs).
import { Pool } from 'pg'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { existingProductImages, imageExists } from './existing-images.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

// Categories describe product format; audience (homme/femme/mixte) lives in
// the separate `sex` field on each product instead.
const CATEGORIES = [
  { name: 'Parfum', slug: 'parfum' },
  { name: 'Eau de Parfum', slug: 'eau-de-parfum' },
  { name: 'Eau de Ligne', slug: 'eau-de-ligne' },
  { name: 'Body Mist', slug: 'body-mist' },
  { name: 'Body Shimmer', slug: 'body-shimmer' },
  { name: 'Mkhamaria', slug: 'mkhamaria' },
  { name: 'Enfant', slug: 'enfant' },
  { name: 'Soins', slug: 'soins' },
  { name: 'Bakhoor', slug: 'bakhoor' },
]

const STALE_CATEGORY_SLUGS = ['femme', 'homme', 'mixte']

const IMG = {
  allureSport: '/products/allure-sport.webp',
  amyrisHomme: '/products/amyris-homme.webp',
  aquaDiGio: '/products/aqua-di-gio-elixir.webp',
  aureusEros: '/products/aureus-eros.webp',
  bleuExclusif: '/products/bleu-chanel-exclusif.webp',
  bleuChanel: '/products/bleu-chanel.webp',
  azureLine: '/products/azure-line.webp',
  alienMugler: '/products/alien-mugler.webp',
  alexandriaIi: '/products/alexandria-ii.webp',
  ambreDesAbysses: '/products/ambre-des-abysses.webp',
  arabesqueTonka: '/products/arabesque-tonka.webp',
  auraRosea: '/products/aura-rosea.webp',
  bleuLazuli: '/products/bleu-lazuli.webp',
  blackOpium: '/products/black-opium.webp',
  blackOpiumGlitter: '/products/black-opium-glitter.webp',
  belugaSupreme: '/products/beluga-supreme.webp',
  belleFortuna: '/products/belle-fortuna.webp',
  bambooGucci: '/products/bamboo-gucci.webp',
  baccarat: '/products/baccarat-rouge-540.webp',
  boisImperial: '/products/bois-imperial.webp',
  boisLumiere: '/products/bois-lumiere.webp',
  gelNettoyant: '/products/gel-nettoyant-v2.webp',
  signature: '/products/signature.webp',
  bakhoorMaryam: '/products/bakhoor-maryam.webp',
  fleurDeChine: '/products/fleur-de-chine.webp',
  roseNacree: '/products/rose-nacree.webp',
  bodyShimmer: '/products/body-shimmer.webp',
  vanillezVous: '/products/vanillez-vous.webp',
  imaginationLv: '/products/imagination-lv.jpg',
  leMaleElixir: '/products/le-male-elixir.jpg',
  lavendarineEdp: '/products/lavendarine-edp.jpg',
  stealerTimes: '/products/stealer-times.jpg',
  dgSummerVibes: '/products/dg-summer-vibes.jpg',
  lavendarineBodyMist: '/products/lavendarine-body-mist.jpg',
  mkhamariaLavendarine: '/products/mkhamaria-lavendarine.jpg',
  mekhassriaFaceToner: '/products/mekhassria-face-toner-cream.jpg',
  mekhassriaFaceTonerJar: '/products/mekhassria-face-toner-cream-jar.jpg',
  mekhassriaFaceTonerLifestyle: '/products/mekhassria-face-toner-cream-lifestyle.jpg',
  oudyEauDeLigne: '/products/oudy-eau-de-ligne.jpg',
  poloEst67: '/products/polo-est-67.jpg',
  sweetyEauDeLigne: '/products/sweety-eau-de-ligne.jpg',
  kaoudPrestige: '/products/kaoud-prestige.jpg',
  pradaParadigme: '/products/prada-paradigme.jpg',
}

const NOTE = {
  bergamote: { name: 'Bergamote', imageUrl: '/notes/bergamote.webp' },
  safran: { name: 'Safran', imageUrl: '/notes/safran.webp' },
  jasmin: { name: 'Jasmin', imageUrl: '/notes/jasmin.webp' },
  ambre: { name: 'Ambre', imageUrl: '/notes/ambre.webp' },
  cedre: { name: 'Cèdre', imageUrl: '/notes/cedre.webp' },
  vanille: { name: 'Vanille', imageUrl: '/notes/vanille.webp' },
}

function n(name) {
  return { name, imageUrl: '' }
}

const AVAILABLE_IMAGES = existingProductImages()

/** @typedef {{
 *   key: string
 *   name: string
 *   brand: string
 *   description: string
 *   price: string
 *   compareAtPrice?: string | null
 *   category: 'parfum' | 'eau-de-parfum' | 'eau-de-ligne' | 'body-mist' | 'body-shimmer' | 'mkhamaria' | 'enfant' | 'soins' | 'bakhoor'
 *   image: string
 *   sizes: { size: string, price: string }[]
 *   featured: boolean
 *   newArrival?: boolean
 *   related: string[]
 *   fragranceNotes?: string[]
 *   wearMoments?: string[]
 *   intensity?: string
 *   sex?: 'homme' | 'femme' | 'mixte'
 *   composition?: { tete: { name: string, imageUrl: string }[], coeur: { name: string, imageUrl: string }[], fond: { name: string, imageUrl: string }[] }
 *   promoTagEnabled?: boolean
 *   promoTagLabel?: string
 * }} SeedProduct
 */

/** Dummy storefront promo: sale price + struck-through compare-at. */
function promoFields(compareAtPrice, label = 'Promotion') {
  return {
    compareAtPrice,
    promoTagEnabled: true,
    promoTagLabel: label,
  }
}

function tnd(value) {
  return Number(value).toFixed(3)
}

/** Dummy prices for 10ml / 30ml / 50ml / 100ml, scaled from the 50ml price. */
function sizeVariants(price50) {
  const base = parseFloat(price50)
  return [
    { size: '10ml', price: tnd(Math.round(base * 0.35)) },
    { size: '30ml', price: tnd(Math.round(base * 0.7)) },
    { size: '50ml', price: tnd(Math.round(base)) },
    { size: '100ml', price: tnd(Math.round(base * 1.6)) },
  ]
}

const FEMME_KEYS = [
  'alien-mugler',
  'aura-rosea',
  'black-opium',
  'black-opium-glitter',
  'belle-fortuna',
  'bamboo-gucci',
  'signature',
  'rose-nacree',
  'vanillez-vous',
]

const HOMME_KEYS = [
  'allure-sport',
  'amyris-homme',
  'aqua-di-gio-elixir',
  'aureus-eros',
  'bleu-exclusif',
  'bleu-chanel',
  'azure-line',
]

const MIXTE_KEYS = [
  'alexandria-ii',
  'ambre-des-abysses',
  'arabesque-tonka',
  'bleu-lazuli',
  'beluga-supreme',
  'baccarat-rouge-540',
  'bois-imperial',
  'bois-lumiere',
  'fleur-de-chine',
]

function relatedOf(keys, key) {
  return keys.filter((item) => item !== key).slice(0, 4)
}

/** @type {SeedProduct[]} */
const PRODUCTS = [
  // —— Femme ——
  {
    key: 'alien-mugler',
    name: 'Alien Mugler',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Mugler Alien. Jasmin, ambre et bois. Capiteuse, mysterieuse, sillage iconique.',
    price: '50.000',
    category: 'eau-de-parfum',
    image: IMG.alienMugler,
    sex: 'femme',
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'alien-mugler'),
  },
  {
    key: 'aura-rosea',
    name: 'AURA ROSEA / Gucci Guilty',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Gucci Guilty. Floral-fruite, rose et patchouli. Moderne et envoûtante.',
    price: '100.000',
    category: 'eau-de-parfum',
    image: IMG.auraRosea,
    sex: 'femme',
    sizes: sizeVariants('100.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'aura-rosea'),
  },
  {
    key: 'black-opium',
    name: 'Black Opium – YSL',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de YSL Black Opium. Cafe, vanille et poire blanche. Gourmande, addictive, pour la nuit.',
    price: '50.000',
    category: 'eau-de-parfum',
    image: IMG.blackOpium,
    sex: 'femme',
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'black-opium'),
  },
  {
    key: 'black-opium-glitter',
    name: 'Black Opium Glitter YSL',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de YSL Black Opium Glitter. Edition scintillante, cafe et vanille, sillage festif.',
    price: '70.000',
    category: 'eau-de-parfum',
    image: IMG.blackOpiumGlitter,
    sex: 'femme',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'black-opium-glitter'),
  },
  {
    key: 'belle-fortuna',
    name: 'BELLE FORTUNA / Chanel Chance',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Chanel Chance. Pamplemousse, jasmin et musc blanc. Fraiche et poudree.',
    price: '70.000',
    category: 'eau-de-parfum',
    image: IMG.belleFortuna,
    sex: 'femme',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'belle-fortuna'),
  },
  {
    key: 'bamboo-gucci',
    name: 'Bamboo Gucci',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Gucci Bamboo. Floral-boise, bergamote et santal. Elegant et contemporain.',
    price: '65.000',
    category: 'eau-de-parfum',
    image: IMG.bambooGucci,
    sex: 'femme',
    sizes: sizeVariants('65.000'),
    featured: true,
    related: relatedOf(FEMME_KEYS, 'bamboo-gucci'),
  },
  {
    key: 'signature',
    name: 'Signature',
    brand: 'KAOUBI PERFUMES',
    description:
      'Eau de parfum signature KAOUBI. Flacon rond, jus rose et label or. Floral elegant, de longue tenue.',
    price: '55.000',
    category: 'eau-de-parfum',
    image: IMG.signature,
    sex: 'femme',
    sizes: [
      { size: '10ml', price: '20.000' },
      { size: '30ml', price: '38.000' },
      { size: '50ml', price: '55.000' },
      { size: '100ml', price: '85.000' },
    ],
    featured: true,
    related: relatedOf(FEMME_KEYS, 'signature'),
  },
  {
    key: 'rose-nacree',
    name: 'Rose Nacrée',
    brand: 'KAOUBI PERFUMES',
    description:
      'Eau de parfum nacree. Jus rose irise, label or et calligraphie. Floral-oriental, sillage lumineux.',
    price: '60.000',
    category: 'eau-de-parfum',
    image: IMG.roseNacree,
    sex: 'femme',
    sizes: [
      { size: '10ml', price: '22.000' },
      { size: '30ml', price: '42.000' },
      { size: '50ml', price: '60.000' },
      { size: '100ml', price: '90.000' },
    ],
    featured: true,
    related: relatedOf(FEMME_KEYS, 'rose-nacree'),
  },
  {
    key: 'vanillez-vous',
    name: 'Body Mist Vanillez Vous',
    brand: 'KAOUBI PERFUMES',
    description:
      'Brume pour le corps Vanillez Vous. Vanille gourmande et chaleureuse. Legere, sucree, pour le quotidien.',
    price: '25.000',
    category: 'eau-de-parfum',
    image: IMG.vanillezVous,
    sex: 'femme',
    sizes: [
      { size: '10ml', price: '12.000' },
      { size: '30ml', price: '18.000' },
      { size: '50ml', price: '25.000' },
      { size: '100ml', price: '38.000' },
    ],
    featured: true,
    related: relatedOf(FEMME_KEYS, 'vanillez-vous'),
  },
  // —— Mixte (promotions) ——
  {
    key: 'alexandria-ii',
    name: 'ALEXANDRIA II - XERJOFF',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Xerjoff Alexandria II. Oriental luxueux, rose, bois precieux et vanille. Tenue exceptionnelle.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'eau-de-parfum',
    image: IMG.alexandriaIi,
    sex: 'mixte',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'alexandria-ii'),
  },
  {
    key: 'ambre-des-abysses',
    name: 'AMBRE DES HABYSSES - HOUBIGANT',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Houbigant Ambre des Abysses. Ambre profond, boise et envelopant. Mixte, sillage noble.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'eau-de-parfum',
    image: IMG.ambreDesAbysses,
    sex: 'mixte',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'ambre-des-abysses'),
  },
  {
    key: 'arabesque-tonka',
    name: 'ARABESQUE TONKA / Arabians Tonka Montale',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Montale Arabians Tonka. Oriental gourmand, tonka et epices, sillage fort.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'eau-de-parfum',
    image: IMG.arabesqueTonka,
    sex: 'mixte',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'arabesque-tonka'),
  },
  {
    key: 'bleu-lazuli',
    name: 'Bleu Lazuli – Armani Privé',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Armani Privé Bleu Lazuli. Boise-aromatique de prestige, sillage raffine.',
    price: '50.000',
    ...promoFields('70.000'),
    category: 'eau-de-parfum',
    image: IMG.bleuLazuli,
    sex: 'mixte',
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'bleu-lazuli'),
  },
  {
    key: 'beluga-supreme',
    name: 'BELUGA SUPREME / CUIR BELUGA',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Guerlain Cuir Beluga. Cuir doux, vanille et ambre. Chaleureux et luxueux.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'parfum',
    image: IMG.belugaSupreme,
    sex: 'mixte',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'beluga-supreme'),
  },
  {
    key: 'baccarat-rouge-540',
    name: 'Baccarat Rouge 540 – MFK',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Maison Francis Kurkdjian Baccarat Rouge 540. Safran, ambre et bois mineral.',
    price: '60.000',
    ...promoFields('80.000'),
    category: 'parfum',
    image: IMG.baccarat,
    sex: 'mixte',
    sizes: sizeVariants('60.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'baccarat-rouge-540'),
  },
  {
    key: 'bois-imperial',
    name: 'Bois Impérial Essential Parfums',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Essential Parfums Bois Imperial. Boise-aromatique, poivre et vetiver.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'parfum',
    image: IMG.boisImperial,
    sex: 'mixte',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'bois-imperial'),
  },
  {
    key: 'bois-lumiere',
    name: 'BOIS LUMIERE / Cedrat Boise Mancera',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Mancera Cedrat Boise. Agrumes, bois et musc. Lumineux, frais et tenace.',
    price: '70.000',
    ...promoFields('90.000'),
    category: 'parfum',
    image: IMG.boisLumiere,
    sex: 'mixte',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'bois-lumiere'),
  },
  {
    key: 'fleur-de-chine',
    name: 'Fleur de Chine',
    brand: 'KAOUBI PERFUMES',
    description:
      "Parfum d'ambiance Fleur de Chine. Brume d'interieur florale, notes de fleurs de cerisier. Idéal pour la maison.",
    price: '28.000',
    category: 'eau-de-parfum',
    image: IMG.fleurDeChine,
    sex: 'mixte',
    sizes: [
      { size: '200ml', price: '28.000' },
      { size: '400ml', price: '42.000' },
    ],
    featured: true,
    related: relatedOf(MIXTE_KEYS, 'fleur-de-chine'),
  },
  // —— Homme ——
  {
    key: 'allure-sport',
    name: 'Allure Sport',
    brand: 'KAOUBI PERFUMES',
    description:
      "Fragrance inspiree de Chanel Allure Homme Sport. Frais, dynamique, notes d'agrumes et de bois.",
    price: '50.000',
    category: 'parfum',
    image: IMG.allureSport,
    sex: 'homme',
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'allure-sport'),
  },
  {
    key: 'amyris-homme',
    name: 'Amyris Homme – MFK',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Maison Francis Kurkdjian Amyris Homme. Boise-ambre, elegant et sophistique.',
    price: '50.000',
    category: 'parfum',
    image: IMG.amyrisHomme,
    sex: 'homme',
    sizes: sizeVariants('50.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'amyris-homme'),
  },
  {
    key: 'aqua-di-gio-elixir',
    name: 'Aqua Di Gio Elixir',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Giorgio Armani Acqua di Gio Elixir. Marine intense, profonde et moderne.',
    price: '70.000',
    category: 'parfum',
    image: IMG.aquaDiGio,
    sex: 'homme',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'aqua-di-gio-elixir'),
  },
  {
    key: 'aureus-eros',
    name: 'AUREUS / Eros Parfum Versace',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Versace Eros Parfum. Menthe, vanille et bois, frais-sucre et audacieux.',
    price: '70.000',
    category: 'parfum',
    image: IMG.aureusEros,
    sex: 'homme',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'aureus-eros'),
  },
  {
    key: 'bleu-exclusif',
    name: "Bleu de Chanel L'Exclusif",
    brand: 'KAOUBI PERFUMES',
    description:
      "Fragrance inspiree de Bleu de Chanel L'Exclusif. Boise intense, profondeur et elegance nocturne.",
    price: '70.000',
    category: 'parfum',
    image: IMG.bleuExclusif,
    sex: 'homme',
    sizes: sizeVariants('70.000'),
    featured: true,
    related: relatedOf(HOMME_KEYS, 'bleu-exclusif'),
  },
  {
    key: 'bleu-chanel',
    name: 'Bleu Chanel',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Bleu de Chanel. Agrumes, gingembre et bois de gaiac. Frais-boise, polyvalent.',
    price: '60.000',
    category: 'parfum',
    image: IMG.bleuChanel,
    sex: 'homme',
    sizes: sizeVariants('60.000'),
    featured: false,
    related: relatedOf(HOMME_KEYS, 'bleu-chanel'),
  },
  {
    key: 'azure-line',
    name: 'AZURE LINE / Chrome Azzaro',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Azzaro Chrome. Aquatique, frais et propre. Ideal au quotidien.',
    price: '70.000',
    category: 'eau-de-parfum',
    image: IMG.azureLine,
    sex: 'homme',
    sizes: sizeVariants('70.000'),
    featured: false,
    related: relatedOf(HOMME_KEYS, 'azure-line'),
  },
  // —— Soins & bakhoor MRAZIG ——
  {
    key: 'gel-nettoyant-mrazig',
    name: 'Gel nettoyant sans huile',
    brand: 'MRAZIG',
    description:
      'Gel nettoyante tous types de peaux. Nettoie, hydrate et apaise. Formule oil-free au kaolin, extrait d\'aloe vera et vitamine E. 150 ml.',
    price: '25.000',
    category: 'soins',
    image: IMG.gelNettoyant,
    sizes: [{ size: '150 ml', price: '25.000' }],
    featured: true,
    related: ['body-shimmer'],
  },
  {
    key: 'body-shimmer',
    name: 'Body Shimmer',
    brand: 'KAOUBI PERFUMES',
    description:
      'Brume corporelle pailletee. Huile scintillante doree, label holographique. Eclat sur la peau, sillage delicieux.',
    price: '35.000',
    category: 'body-shimmer',
    image: IMG.bodyShimmer,
    sizes: [
      { size: '100ml', price: '35.000' },
      { size: '150ml', price: '48.000' },
    ],
    featured: true,
    related: ['gel-nettoyant-mrazig', 'vanillez-vous'],
  },
  {
    key: 'bakhoor-maryam',
    name: 'بخور مريم',
    brand: 'KAOUBI PERFUMES',
    description:
      'Bakhoor Maryam (بخور مريم) — Selection Rennée. Encens artisanal بخور المزاريق. Notes chaudes et orientales pour parfumer la maison.',
    price: '32.000',
    category: 'bakhoor',
    image: IMG.bakhoorMaryam,
    sizes: [
      { size: '50g', price: '32.000' },
      { size: '100g', price: '55.000' },
    ],
    featured: true,
    related: [],
  },
  // —— Nouveautes ——
  {
    key: 'imagination-lv',
    name: 'Imagination L.V',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Louis Vuitton Imagination. Agrumes petillants, notes boisees et musquees. Sillage frais et raffine.',
    price: '65.000',
    category: 'eau-de-parfum',
    image: IMG.imaginationLv,
    sex: 'homme',
    sizes: sizeVariants('65.000'),
    featured: false,
    related: ['le-male-elixir', 'stealer-times', 'bleu-chanel'],
  },
  {
    key: 'le-male-elixir',
    name: 'Le Mâle Elixir – JPG',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Jean Paul Gaultier Le Male Elixir. Lavande, vanille et fenugrec. Intense, chaude et envoûtante.',
    price: '68.000',
    category: 'eau-de-parfum',
    image: IMG.leMaleElixir,
    sex: 'homme',
    sizes: sizeVariants('68.000'),
    featured: false,
    related: ['imagination-lv', 'stealer-times', 'azure-line'],
  },
  {
    key: 'stealer-times',
    name: 'Stealer Times',
    brand: 'KAOUBI PERFUMES',
    description:
      'Ambre doree et notes boisees chaudes. Sillage capiteux et longue tenue, pour affirmer sa presence.',
    price: '55.000',
    category: 'eau-de-parfum',
    image: IMG.stealerTimes,
    sex: 'homme',
    sizes: sizeVariants('55.000'),
    featured: false,
    related: ['imagination-lv', 'le-male-elixir', 'amyris-homme'],
  },
  {
    key: 'dg-summer-vibes',
    name: 'D&G Summer Vibes',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Dolce & Gabbana Light Blue. Agrumes solaires et fleurs blanches. Legere, fraiche, esprit vacances.',
    price: '58.000',
    category: 'eau-de-parfum',
    image: IMG.dgSummerVibes,
    sex: 'femme',
    sizes: sizeVariants('58.000'),
    featured: false,
    related: ['aura-rosea', 'bamboo-gucci', 'belle-fortuna'],
  },
  {
    key: 'lavendarine-edp',
    name: 'Lavendarine',
    brand: 'KAOUBI PERFUMES',
    description:
      'Eau de parfum Lavendarine. Lavande fine et notes gourmandes douces. Apaisante, elegante et facile a porter au quotidien.',
    price: '50.000',
    category: 'eau-de-parfum',
    image: IMG.lavendarineEdp,
    sex: 'mixte',
    sizes: sizeVariants('50.000'),
    featured: false,
    related: ['lavendarine-body-mist', 'mkhamaria-lavendarine'],
  },
  {
    key: 'lavendarine-body-mist',
    name: 'Body Mist Lavendarine',
    brand: 'KAOUBI PERFUMES',
    description:
      'Brume corporelle Lavendarine, pailletee et parfumee a la lavande. Rafraichit et parfume la peau tout au long de la journee.',
    price: '35.000',
    category: 'body-mist',
    image: IMG.lavendarineBodyMist,
    sizes: [{ size: '50 ml', price: '35.000' }],
    featured: false,
    related: ['lavendarine-edp', 'mkhamaria-lavendarine'],
  },
  {
    key: 'mkhamaria-lavendarine',
    name: 'Mkhamaria Lavendarine',
    brand: 'KAOUBI PERFUMES',
    description:
      'Gommage corporel Mkhamaria a la lavande, texture pailletee et nourrissante. Exfolie en douceur et parfume la peau. 50 g.',
    price: '38.000',
    category: 'mkhamaria',
    image: IMG.mkhamariaLavendarine,
    sizes: [{ size: '50 gr', price: '38.000' }],
    featured: false,
    related: ['lavendarine-edp', 'lavendarine-body-mist'],
  },
  {
    key: 'mkhamaria',
    name: 'Mkhamaria',
    brand: 'KAOUBI PERFUMES',
    description:
      'Face toner cream. Texture doree et fondante qui tonifie, hydrate et illumine le teint. 50 g.',
    price: '42.000',
    category: 'mkhamaria',
    image: IMG.mekhassriaFaceToner,
    images: [
      IMG.mekhassriaFaceToner,
      IMG.mekhassriaFaceTonerJar,
      IMG.mekhassriaFaceTonerLifestyle,
    ],
    sizes: [{ size: '50 gr', price: '42.000' }],
    featured: false,
    related: ['mkhamaria-lavendarine', 'lavendarine-body-mist'],
  },
  {
    key: 'oudy-eau-de-ligne',
    name: 'Oudy – Eau de Ligne',
    brand: 'KAOUBI PERFUMES',
    description:
      'Brume de linge Oudy. Notes boisees et ambrees d\'oud, parfume durablement le linge et la maison. 250 ml.',
    price: '30.000',
    category: 'eau-de-ligne',
    image: IMG.oudyEauDeLigne,
    sizes: [{ size: '250 ml', price: '30.000' }],
    featured: false,
    related: ['sweety-eau-de-ligne', 'mkhamaria'],
  },
  {
    key: 'sweety-eau-de-ligne',
    name: 'Sweety – Eau de Ligne',
    brand: 'KAOUBI PERFUMES',
    description:
      'Brume de linge Sweety. Fleurs douces et notes gourmandes, parfume durablement le linge et la maison. 250 ml.',
    price: '30.000',
    category: 'eau-de-ligne',
    image: IMG.sweetyEauDeLigne,
    sizes: [{ size: '250 ml', price: '30.000' }],
    featured: false,
    related: ['oudy-eau-de-ligne', 'mkhamaria'],
  },
  {
    key: 'polo-est-67',
    name: 'Polo Est. 67',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Polo Ralph Lauren Est. 67. Agrumes frais et notes boisees musquees. Sportif et intemporel.',
    price: '60.000',
    category: 'parfum',
    image: IMG.poloEst67,
    sex: 'homme',
    sizes: sizeVariants('60.000'),
    featured: false,
    related: ['prada-paradigme', 'imagination-lv', 'le-male-elixir'],
  },
  {
    key: 'prada-paradigme',
    name: 'Prada Paradigme',
    brand: 'KAOUBI PERFUMES',
    description:
      'Fragrance inspiree de Prada Paradigme. Notes vertes et aromatiques, ambre et bois. Frais, elegant et moderne.',
    price: '75.000',
    category: 'parfum',
    image: IMG.pradaParadigme,
    sex: 'homme',
    sizes: sizeVariants('75.000'),
    featured: false,
    related: ['polo-est-67', 'imagination-lv', 'azure-line'],
  },
  {
    key: 'kaoud-prestige',
    name: 'Kaoud Prestige',
    brand: 'KAOUD PERFUMES',
    description:
      'Collection Prestige Kaoud Perfumes. Ambre dore, notes boisees et musquees. Sillage riche, elegant, mixte.',
    price: '80.000',
    category: 'parfum',
    image: IMG.kaoudPrestige,
    sex: 'mixte',
    sizes: sizeVariants('80.000'),
    featured: false,
    related: ['baccarat-rouge-540', 'alexandria-ii', 'ambre-des-abysses'],
  },
]

const FEATURED_KEYS = new Set([
  'lavendarine-edp',
  'lavendarine-body-mist',
  'mkhamaria-lavendarine',
  'mkhamaria',
])

const NEW_ARRIVAL_KEYS = new Set([
  'imagination-lv',
  'le-male-elixir',
  'stealer-times',
  'dg-summer-vibes',
  'lavendarine-edp',
  'lavendarine-body-mist',
  'mkhamaria-lavendarine',
  'mkhamaria',
])

/** Olfactive extras keyed by product.key. */
const OLFACTIVE = {
  'alien-mugler': {
    fragranceNotes: ['floral', 'oriental', 'woody'],
    wearMoments: ['nuit', 'automne', 'hiver'],
    intensity: 'tres-forte',
    composition: {
      tete: [n('Cassis')],
      coeur: [NOTE.jasmin],
      fond: [NOTE.ambre, NOTE.cedre],
    },
  },
  'aura-rosea': {
    fragranceNotes: ['floral', 'fruity', 'powdery'],
    wearMoments: ['jour', 'printemps', 'ete'],
    intensity: 'moyenne',
    composition: {
      tete: [NOTE.bergamote, n('Pêche')],
      coeur: [NOTE.jasmin],
      fond: [n('Patchouli'), NOTE.vanille],
    },
  },
  'black-opium': {
    fragranceNotes: ['gourmand', 'vanilla', 'sweet'],
    wearMoments: ['nuit', 'automne', 'hiver'],
    intensity: 'forte',
    composition: {
      tete: [n('Poire'), n('Café')],
      coeur: [NOTE.jasmin],
      fond: [NOTE.vanille, NOTE.cedre],
    },
  },
  'black-opium-glitter': {
    fragranceNotes: ['gourmand', 'vanilla', 'sweet'],
    wearMoments: ['nuit'],
    intensity: 'forte',
    composition: {
      tete: [n('Poire'), n('Café')],
      coeur: [NOTE.jasmin],
      fond: [NOTE.vanille, NOTE.ambre],
    },
  },
  'belle-fortuna': {
    fragranceNotes: ['citrus', 'floral', 'powdery'],
    wearMoments: ['jour', 'printemps'],
    intensity: 'moderee',
    composition: {
      tete: [n('Pamplemousse'), NOTE.bergamote],
      coeur: [NOTE.jasmin],
      fond: [n('Musc blanc'), NOTE.vanille],
    },
  },
  'bamboo-gucci': {
    fragranceNotes: ['floral', 'woody', 'citrus'],
    wearMoments: ['jour', 'printemps', 'ete'],
    intensity: 'moyenne',
    composition: {
      tete: [NOTE.bergamote],
      coeur: [NOTE.jasmin],
      fond: [NOTE.cedre, NOTE.vanille],
    },
  },
  'alexandria-ii': {
    fragranceNotes: ['oriental', 'woody', 'vanilla'],
    wearMoments: ['nuit', 'hiver'],
    intensity: 'tres-forte',
    composition: {
      tete: [n('Rose'), n('Cannelle')],
      coeur: [NOTE.jasmin, NOTE.ambre],
      fond: [NOTE.vanille, NOTE.cedre],
    },
  },
  'ambre-des-abysses': {
    fragranceNotes: ['oriental', 'woody', 'vanilla'],
    wearMoments: ['nuit', 'automne', 'hiver'],
    intensity: 'forte',
    composition: {
      tete: [NOTE.bergamote],
      coeur: [NOTE.ambre, NOTE.jasmin],
      fond: [NOTE.vanille, NOTE.cedre],
    },
  },
  'arabesque-tonka': {
    fragranceNotes: ['oriental', 'gourmand', 'vanilla'],
    wearMoments: ['nuit', 'hiver'],
    intensity: 'tres-forte',
    composition: {
      tete: [NOTE.safran, n('Épices')],
      coeur: [n('Tonka'), NOTE.ambre],
      fond: [NOTE.vanille, NOTE.cedre],
    },
  },
  'bleu-lazuli': {
    fragranceNotes: ['woody', 'aromatic', 'citrus'],
    wearMoments: ['jour', 'nuit'],
    intensity: 'forte',
    composition: {
      tete: [NOTE.bergamote],
      coeur: [NOTE.jasmin, n('Iris')],
      fond: [NOTE.cedre, NOTE.ambre],
    },
  },
  'beluga-supreme': {
    fragranceNotes: ['powdery', 'vanilla', 'musky'],
    wearMoments: ['nuit', 'hiver'],
    intensity: 'forte',
    composition: {
      tete: [NOTE.bergamote],
      coeur: [n('Héliotrope'), NOTE.jasmin],
      fond: [NOTE.vanille, NOTE.ambre],
    },
  },
  'baccarat-rouge-540': {
    fragranceNotes: ['oriental', 'woody', 'sweet'],
    wearMoments: ['jour', 'nuit'],
    intensity: 'tres-forte',
    composition: {
      tete: [NOTE.safran, NOTE.bergamote],
      coeur: [NOTE.jasmin, NOTE.ambre],
      fond: [NOTE.cedre, NOTE.vanille],
    },
  },
  'bois-imperial': {
    fragranceNotes: ['woody', 'fresh-spicy', 'aromatic'],
    wearMoments: ['jour', 'ete', 'printemps'],
    intensity: 'forte',
    composition: {
      tete: [NOTE.bergamote, n('Poivre')],
      coeur: [n('Vétiver'), n('Géranium')],
      fond: [NOTE.cedre, NOTE.ambre],
    },
  },
  'bois-lumiere': {
    fragranceNotes: ['citrus', 'woody', 'musky'],
    wearMoments: ['jour', 'ete'],
    intensity: 'moyenne',
    composition: {
      tete: [NOTE.bergamote, n('Cédrat')],
      coeur: [NOTE.jasmin],
      fond: [NOTE.cedre, NOTE.vanille],
    },
  },
  'allure-sport': {
    fragranceNotes: ['citrus', 'woody', 'fresh-spicy'],
    wearMoments: ['jour', 'ete'],
    intensity: 'moyenne',
    composition: {
      tete: [NOTE.bergamote, n('Orange')],
      coeur: [n('Néroli'), NOTE.jasmin],
      fond: [NOTE.cedre, NOTE.vanille],
    },
  },
  'amyris-homme': {
    fragranceNotes: ['woody', 'citrus', 'aromatic'],
    wearMoments: ['jour', 'nuit'],
    intensity: 'moyenne',
    composition: {
      tete: [NOTE.bergamote],
      coeur: [NOTE.jasmin, n('Amyris')],
      fond: [NOTE.cedre, NOTE.ambre],
    },
  },
  'aqua-di-gio-elixir': {
    fragranceNotes: ['aquatic', 'aromatic', 'woody'],
    wearMoments: ['jour', 'ete'],
    intensity: 'forte',
    composition: {
      tete: [NOTE.bergamote, n('Notes marines')],
      coeur: [n('Romarin'), NOTE.jasmin],
      fond: [NOTE.cedre, NOTE.ambre],
    },
  },
  'aureus-eros': {
    fragranceNotes: ['fresh-spicy', 'vanilla', 'woody'],
    wearMoments: ['jour', 'nuit'],
    intensity: 'forte',
    composition: {
      tete: [n('Menthe'), NOTE.bergamote],
      coeur: [NOTE.vanille, NOTE.jasmin],
      fond: [NOTE.cedre, NOTE.ambre],
    },
  },
  'bleu-exclusif': {
    fragranceNotes: ['woody', 'aromatic', 'citrus'],
    wearMoments: ['nuit', 'automne'],
    intensity: 'tres-forte',
    composition: {
      tete: [NOTE.bergamote, n('Citron')],
      coeur: [NOTE.jasmin, n('Gingembre')],
      fond: [NOTE.cedre, NOTE.ambre],
    },
  },
  'bleu-chanel': {
    fragranceNotes: ['citrus', 'woody', 'fresh-spicy'],
    wearMoments: ['jour', 'nuit'],
    intensity: 'forte',
    composition: {
      tete: [NOTE.bergamote, NOTE.safran],
      coeur: [NOTE.jasmin, NOTE.ambre],
      fond: [NOTE.cedre, NOTE.vanille, NOTE.ambre],
    },
  },
  'azure-line': {
    fragranceNotes: ['aquatic', 'citrus', 'fresh-spicy'],
    wearMoments: ['jour', 'ete'],
    intensity: 'moderee',
    composition: {
      tete: [NOTE.bergamote, n('Citron')],
      coeur: [n('Notes aquatiques')],
      fond: [NOTE.cedre, n('Musc')],
    },
  },
  signature: {
    fragranceNotes: ['floral', 'powdery', 'musky'],
    wearMoments: ['jour', 'printemps'],
    intensity: 'moyenne',
    composition: {
      tete: [NOTE.bergamote, n('Pêche')],
      coeur: [NOTE.jasmin, n('Rose')],
      fond: [n('Musc blanc'), NOTE.vanille],
    },
  },
  'rose-nacree': {
    fragranceNotes: ['floral', 'oriental', 'sweet'],
    wearMoments: ['jour', 'nuit'],
    intensity: 'forte',
    composition: {
      tete: [NOTE.bergamote, n('Litchi')],
      coeur: [n('Rose'), NOTE.jasmin],
      fond: [NOTE.ambre, NOTE.vanille],
    },
  },
  'vanillez-vous': {
    fragranceNotes: ['gourmand', 'vanilla', 'sweet'],
    wearMoments: ['jour', 'ete'],
    intensity: 'moderee',
    composition: {
      tete: [n('Vanille')],
      coeur: [NOTE.vanille, n('Tonka')],
      fond: [NOTE.ambre, n('Musc')],
    },
  },
  'fleur-de-chine': {
    fragranceNotes: ['floral', 'fruity', 'fresh-spicy'],
    wearMoments: ['jour', 'printemps', 'ete'],
    intensity: 'moderee',
    composition: {
      tete: [n('Fleur de cerisier')],
      coeur: [NOTE.jasmin, n('Pivoine')],
      fond: [n('Musc blanc')],
    },
  },
  'body-shimmer': {
    fragranceNotes: ['gourmand', 'vanilla', 'oriental'],
    wearMoments: ['jour', 'nuit'],
    intensity: 'moyenne',
    composition: {
      tete: [NOTE.bergamote],
      coeur: [NOTE.vanille, n('Ambre')],
      fond: [NOTE.ambre, NOTE.cedre],
    },
  },
}

async function ensureCategories() {
  for (const category of CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (name, slug, "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()`,
      [category.name, category.slug],
    )
  }
}

/** Femme/Homme/Mixte used to be categories; now that meaning lives in the
 *  `sex` column, drop the old category rows once no product still points
 *  at them (products are remapped to the new categories earlier in seed()). */
async function removeStaleCategories() {
  await pool.query(
    `DELETE FROM categories
     WHERE slug = ANY($1::text[])
       AND NOT EXISTS (SELECT 1 FROM products WHERE products.category = categories.slug)`,
    [STALE_CATEGORY_SLUGS],
  )
}

async function upsertProduct(product) {
  const images = JSON.stringify(
    product.images && product.images.length > 0 ? product.images : [product.image],
  )
  const sizes = JSON.stringify(product.sizes)
  const fragranceNotes = JSON.stringify(product.fragranceNotes ?? [])
  const wearMoments = JSON.stringify(product.wearMoments ?? [])
  const intensity = product.intensity ?? null
  const sex = product.sex ?? null
  const composition = JSON.stringify(
    product.composition ?? { tete: [], coeur: [], fond: [] },
  )
  const promoTagEnabled = Boolean(product.promoTagEnabled)
  const promoTagLabel = product.promoTagLabel?.trim() || 'Promotion'
  const promoTagBgColor = product.promoTagBgColor || '#c81e1e'
  const promoTagTextColor = product.promoTagTextColor || '#ffffff'
  const existing = await pool.query(
    `SELECT id FROM products WHERE name = $1 AND brand = $2 LIMIT 1`,
    [product.name, product.brand],
  )

  if (existing.rows[0]) {
    const id = existing.rows[0].id
    await pool.query(
      `UPDATE products SET
        description = $1,
        price = $2,
        "compareAtPrice" = $3,
        category = $4,
        "imageUrl" = $5,
        images = $6,
        sizes = $7,
        "fragranceNotes" = $8,
        "wearMoments" = $9,
        intensity = $10,
        sex = $11,
        composition = $12,
        "promoTagEnabled" = $13,
        "promoTagLabel" = $14,
        "promoTagBgColor" = $15,
        "promoTagTextColor" = $16,
        "inStock" = true,
        featured = $17,
        "newArrival" = $18,
        published = true,
        "updatedAt" = NOW()
       WHERE id = $19`,
      [
        product.description,
        product.price,
        product.compareAtPrice ?? null,
        product.category,
        product.image,
        images,
        sizes,
        fragranceNotes,
        wearMoments,
        intensity,
        sex,
        composition,
        promoTagEnabled,
        promoTagLabel,
        promoTagBgColor,
        promoTagTextColor,
        product.featured,
        Boolean(product.newArrival),
        id,
      ],
    )
    return id
  }

  const inserted = await pool.query(
    `INSERT INTO products (
      name, brand, description, price, "compareAtPrice", category,
      "imageUrl", images, sizes, "relatedProductIds",
      "fragranceNotes", "wearMoments", intensity, sex, composition,
      "promoTagEnabled", "promoTagLabel", "promoTagBgColor", "promoTagTextColor",
      "inStock", featured, "newArrival", published,
      "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, '[]',
      $10, $11, $12, $13, $14,
      $15, $16, $17, $18,
      true, $19, $20, true, NOW(), NOW()
    )
    RETURNING id`,
    [
      product.name,
      product.brand,
      product.description,
      product.price,
      product.compareAtPrice ?? null,
      product.category,
      product.image,
      images,
      sizes,
      fragranceNotes,
      wearMoments,
      intensity,
      sex,
      composition,
      promoTagEnabled,
      promoTagLabel,
      promoTagBgColor,
      promoTagTextColor,
      product.featured,
      Boolean(product.newArrival),
    ],
  )
  return inserted.rows[0].id
}

async function relinkMissingProductImages() {
  if (AVAILABLE_IMAGES.length === 0) {
    throw new Error('No ready product images found.')
  }

  const { rows } = await pool.query(`SELECT id, name, "imageUrl" FROM products ORDER BY id`)
  let updated = 0

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    if (imageExists(row.imageUrl) && AVAILABLE_IMAGES.includes(row.imageUrl)) continue

    const image = AVAILABLE_IMAGES[i % AVAILABLE_IMAGES.length]
    await pool.query(
      `UPDATE products SET "imageUrl" = $1, images = $2, "updatedAt" = NOW() WHERE id = $3`,
      [image, JSON.stringify([image]), row.id],
    )
    updated += 1
    console.log(`  Relinked "${row.name}" → ${image}`)
  }

  if (updated > 0) {
    console.log(`Relinked ${updated} product(s) to ready bottle photos.`)
  }
}

async function seed() {
  if (AVAILABLE_IMAGES.length === 0) {
    throw new Error('No ready product images found.')
  }

  await ensureCategories()

  const idsByKey = new Map()
  for (const product of PRODUCTS) {
    if (!imageExists(product.image)) {
      console.warn(`  Skipping "${product.name}" — missing ${product.image}`)
      continue
    }
    const id = await upsertProduct({
      ...product,
      ...(OLFACTIVE[product.key] ?? {}),
      featured: FEATURED_KEYS.has(product.key),
      newArrival: NEW_ARRIVAL_KEYS.has(product.key),
      image: product.image,
    })
    idsByKey.set(product.key, id)
    console.log(`  [${product.category}] ${product.name} → ${product.image}`)
  }

  for (const product of PRODUCTS) {
    const id = idsByKey.get(product.key)
    if (!id) continue
    const relatedIds = product.related
      .map((key) => idsByKey.get(key))
      .filter((relatedId) => Number.isInteger(relatedId) && relatedId !== id)
    await pool.query(
      `UPDATE products SET "relatedProductIds" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [JSON.stringify(relatedIds), id],
    )
  }

  if (process.argv.includes('--force')) {
    const catalogIds = [...idsByKey.values()]
    const leftover = await pool.query(
      `SELECT id, name, brand FROM products WHERE NOT (id = ANY($1::int[]))`,
      [catalogIds],
    )
    if (leftover.rows.length > 0) {
      const leftoverIds = leftover.rows.map((row) => row.id)
      const inOrders = await pool.query(
        `SELECT DISTINCT "productId" FROM order_items WHERE "productId" = ANY($1::int[])`,
        [leftoverIds],
      )
      const locked = new Set(inOrders.rows.map((row) => row.productId))
      const removable = leftoverIds.filter((id) => !locked.has(id))
      if (removable.length > 0) {
        await pool.query(`DELETE FROM products WHERE id = ANY($1::int[])`, [removable])
        console.log(`Removed ${removable.length} leftover product(s) not in the catalog.`)
      }
      for (const row of leftover.rows.filter((item) => locked.has(item.id))) {
        console.log(`Kept "${row.name}" (${row.brand}) — referenced by an order.`)
      }
    }
  }

  await relinkMissingProductImages()
  await removeStaleCategories()

  console.log(`Seeded ${PRODUCTS.length} perfumes with ready photos.`)
  const byCategory = await pool.query(
    `SELECT category, COUNT(*)::int AS count FROM products WHERE published = true GROUP BY category ORDER BY category`,
  )
  for (const row of byCategory.rows) {
    console.log(`  - ${row.category}: ${row.count}`)
  }
}

try {
  await seed()
} catch (err) {
  console.error('Seed failed:', err.message)
  process.exit(1)
} finally {
  await pool.end()
}
