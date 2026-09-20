// Run with: node scripts/repair-placeholder-images.mjs
// A concurrent script (likely seed-products.mjs's relinkMissingProductImages,
// racing with the photo-matching scripts) reset ~150 products' imageUrl back to
// the /products/signature.webp placeholder even though their real photos already
// exist on disk under public/products. This restores the correct imageUrl:
// 1) from the trusted MATCHES lists in apply-femme-photos.mjs / apply-homme-photos.mjs
// 2) plus a couple of manual pairings applied inline earlier in the session
// 3) then a confident (score >= 0.45) fuzzy name/brand -> filename match for the rest
import { readdirSync } from 'fs'
import { Pool } from 'pg'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env')
  process.exit(1)
}

function stripAccents(v) {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '')
}
function slugify(v) {
  return stripAccents(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
function tokens(v) {
  return new Set(slugify(v).split('-').filter((t) => t.length > 1))
}

// apply-*-photos.mjs don't export MATCHES, so re-derive them by static import of the
// module source isn't viable without executing side effects. Instead hardcode the
// trusted id -> slug pairs here (mirrors both scripts' MATCHES arrays exactly).
const TRUSTED = {
  // from apply-femme-photos.mjs
  52: 'alien-mugler-femme', 53: 'coco-mademoiselle', 54: 'chance-chanel', 55: 'crystal-noir',
  56: 'the-one-dg', 57: 'dior-addict', 59: 'evidence-yves-rocher', 60: 'escada-taj',
  62: 'gucci-flora', 63: 'gucci-bamboo-femme', 64: 'gucci-bloom', 65: 'good-girl',
  67: 'givenchy-play', 68: 'givenchy-play', 69: 'burberry-her', 70: 'burberry-goddess',
  71: 'hypnotic-poison', 74: 'jadore', 75: 'la-vie-est-belle', 77: 'lextase',
  78: 'mon-guerlain', 79: 'linstant-de-guerlain', 82: 'mon-paris', 83: 'miss-dior',
  84: 'miss-dior', 86: 'narciso-for-her-rose', 87: 'olympea', 90: 'si-armani',
  92: 'my-way-armani', 93: 'my-way-armani', 94: 'tresor-midnight-rose', 95: 'tresor-la-nuit',
  101: 'libre-ysl', 102: 'libre-intense', 103: 'libre-berry-crush', 107: 'scandal-jpg',
  108: 'scandal-absolu', 109: 'scandal-a-paris', 112: 'amirat-el-arab', 115: 'kayali-marshmallow',
  116: 'kayali-eden-juicy-apple', 125: 'la-vie-est-belle-vanille', 131: 'kayali-musk-vanilla',
  132: 'kayali-maldives',
  // from apply-homme-photos.mjs
  133: 'stronger-with-you', 134: 'wanted-azzaro', 136: 'the-most-wanted-azzaro',
  137: 'allure-homme-sport', 140: 'bleu-de-chanel-homme', 141: 'sauvage-dior',
  144: 'the-one-for-men', 145: 'fahrenheit-dior', 146: 'la-nuit-de-lhomme',
  147: 'polo-blue', 149: 'boss-bottled', 150: 'boss-bottled-night', 161: 'dg-pineapple',
  162: 'le-male-elixir-jpg-homme', 163: 'stronger-with-you-intensely',
  165: 'black-orchid-tom-ford-homme', 174: 'boss-orange', 175: 'l1212-bleu-lacoste',
  179: 'black-xs-lexces', 181: 'invictus-paco-rabanne', 182: 'the-king-dg',
  183: 'scandal-pour-homme', 188: 'le-beau-paradise-garden',
  // manual, applied inline earlier in the session
  6: 'black-opium-ysl-femme', 130: 'baccarat-rouge-540', 197: 'baccarat-rouge-540',
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL })
  try {
    const files = readdirSync('public/products').filter(
      (f) => /\.(jpe?g|png|webp)$/i.test(f) && f !== 'signature.webp',
    )
    const byBase = new Map()
    for (const f of files) {
      const base = f.replace(/\.(jpe?g|png|webp)$/i, '')
      const ext = f.slice(base.length)
      if (!byBase.has(base)) byBase.set(base, [])
      byBase.get(base).push(ext)
    }
    function pickExt(base) {
      const exts = byBase.get(base) ?? []
      return exts.includes('.webp') ? '.webp' : exts[0]
    }

    const { rows } = await pool.query(
      `SELECT id, name, brand FROM products WHERE "imageUrl" = '/products/signature.webp' AND id != 26 ORDER BY id`,
    )

    const applied = []
    const skipped = []

    for (const r of rows) {
      let base = TRUSTED[r.id]
      let scoreNote = 'trusted'

      if (!base || !byBase.has(base)) {
        const nt = tokens(`${r.name} ${r.brand}`)
        let best = null
        let bestScore = 0
        for (const candidate of byBase.keys()) {
          const bt = tokens(candidate)
          let inter = 0
          for (const t of nt) if (bt.has(t)) inter++
          const union = new Set([...nt, ...bt]).size
          const score = union === 0 ? 0 : inter / union
          if (score > bestScore) {
            bestScore = score
            best = candidate
          }
        }
        if (best && bestScore >= 0.45) {
          base = best
          scoreNote = `fuzzy ${bestScore.toFixed(2)}`
        } else {
          skipped.push({ id: r.id, name: r.name, brand: r.brand, best, bestScore })
          continue
        }
      }

      const ext = pickExt(base)
      const url = `/products/${base}${ext}`
      await pool.query(
        `UPDATE products SET "imageUrl" = $1, images = $2, "updatedAt" = NOW() WHERE id = $3`,
        [url, JSON.stringify([url]), r.id],
      )
      applied.push({ id: r.id, name: r.name, brand: r.brand, url, scoreNote })
    }

    console.log(`Applied ${applied.length} repairs:`)
    for (const a of applied) console.log(`  #${a.id} ${a.name} (${a.brand}) -> ${a.url} [${a.scoreNote}]`)

    console.log(`\nSkipped ${skipped.length} (no confident match, left on placeholder):`)
    for (const s of skipped) console.log(`  #${s.id} ${s.name} (${s.brand}) best guess: ${s.best ?? 'none'} (${s.bestScore.toFixed(2)})`)
  } finally {
    await pool.end()
  }
}

await main()
