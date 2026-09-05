// Compress local store images to WebP for faster LCP.
// Run: node scripts/optimize-images.mjs
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

const JOBS = [
  { dir: 'hero', maxWidth: 900, quality: 72 },
  { dir: 'products', maxWidth: 900, quality: 78 },
  { dir: 'categories', maxWidth: 900, quality: 72 },
  { dir: 'showcase', maxWidth: 900, quality: 72 },
  { file: 'logo.png', maxWidth: 800, quality: 90 },
]

async function optimizeFile(inputPath, maxWidth, quality) {
  const ext = path.extname(inputPath).toLowerCase()
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return null

  const outputPath = inputPath.replace(/\.(png|jpe?g)$/i, '.webp')
  const inputStat = await stat(inputPath)

  await sharp(inputPath)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(outputPath)

  const outputStat = await stat(outputPath)
  return {
    input: path.relative(root, inputPath),
    output: path.relative(root, outputPath),
    before: inputStat.size,
    after: outputStat.size,
  }
}

async function run() {
  const results = []

  for (const job of JOBS) {
    if (job.file) {
      const inputPath = path.join(root, job.file)
      const result = await optimizeFile(inputPath, job.maxWidth, job.quality)
      if (result) results.push(result)
      continue
    }

    const dirPath = path.join(root, job.dir)
    await mkdir(dirPath, { recursive: true })
    const files = await readdir(dirPath)
    for (const file of files) {
      if (file.startsWith('.')) continue
      if (file.endsWith('.webp')) continue
      const result = await optimizeFile(path.join(dirPath, file), job.maxWidth, job.quality)
      if (result) results.push(result)
    }
  }

  for (const result of results) {
    const saved = (((result.before - result.after) / result.before) * 100).toFixed(0)
    console.log(
      `${result.input} -> ${result.output} (${(result.before / 1024).toFixed(0)}KB → ${(result.after / 1024).toFixed(0)}KB, -${saved}%)`,
    )
  }
  console.log(`\n✓ Optimized ${results.length} images`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
