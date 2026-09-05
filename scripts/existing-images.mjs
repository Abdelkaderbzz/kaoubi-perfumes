import { existsSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

/** Legacy hero bottle shots kept for older seeded products. */
export const READY_PRODUCT_IMAGES = [
  '/hero/ysl-libre.webp',
  '/hero/dg-devotion.webp',
  '/hero/givenchy-gentleman.webp',
  '/hero/perfume-2.webp',
]

function fileFor(url) {
  return join(PUBLIC_DIR, url.replace(/^\//, ''))
}

export function imageExists(url) {
  return Boolean(url) && existsSync(fileFor(url))
}

/** Product bottle photos on disk: public/products + known hero bottle shots. */
export function existingProductImages() {
  const images = [...READY_PRODUCT_IMAGES]
  const productsDir = join(PUBLIC_DIR, 'products')
  if (existsSync(productsDir)) {
    for (const name of readdirSync(productsDir)) {
      if (!/\.(webp|png|jpe?g)$/i.test(name)) continue
      images.push(`/products/${name}`)
    }
  }
  return images.filter(imageExists)
}

export function resolveExistingImage(preferred, fallbacks, index = 0) {
  if (imageExists(preferred)) return preferred
  const pool = fallbacks.filter(imageExists)
  if (pool.length === 0) {
    throw new Error('No ready product images found in public/products or public/hero.')
  }
  return pool[index % pool.length]
}
