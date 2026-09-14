import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(projectRoot, 'public')
const outputDir = resolve(publicDir, 'images/optimized')
const manifestPath = resolve(projectRoot, 'src/data/image-variants.json')
const widths = [160, 320, 640, 960]
const quality = 82

async function exists(path) {
  try { await stat(path); return true } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

export async function generateResponsiveImages() {
  const catalog = JSON.parse(await readFile(resolve(projectRoot, 'src/data/catalog.json'), 'utf8'))
  const sources = [...new Set([...catalog.products, ...catalog.categories].map(item => item.image).filter(Boolean))]
  const examples = ['railings', 'fences', 'balcony', 'grilles', 'gates'].map(name => `/images/examples/app-${name}.jpg`)
  const manifest = {}
  await mkdir(outputDir, { recursive: true })

  for (const source of [...sources, ...examples]) {
    const input = await readFile(resolve(publicDir, `.${source}`))
    const { width } = await sharp(input).metadata()
    const hash = createHash('sha256').update(input).update(`webp-${quality}-v1`).digest('hex').slice(0, 12)
    const candidates = []
    for (const size of widths.filter(size => size < width)) {
      const name = `${hash}-${size}w.webp`
      const target = resolve(outputDir, name)
      if (!(await exists(target))) {
        await sharp(input).resize({ width: size, withoutEnlargement: true }).webp({ quality }).toFile(target)
      }
      candidates.push(`/images/optimized/${name} ${size}w`)
    }
    // Retain the original as the largest candidate; the lightbox uses it directly.
    candidates.push(`${source} ${width}w`)
    manifest[source] = candidates.join(', ')
  }

  const faviconPath = resolve(outputDir, 'favicon-48.png')
  const favicon = await sharp(resolve(publicDir, 'icons/favicon-brand-mark.png'))
    .resize(48, 48).png({ palette: true }).toBuffer()
  if (!(await exists(faviconPath)) || !(await readFile(faviconPath)).equals(favicon)) {
    await writeFile(faviconPath, favicon)
  }
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`
  if (!(await exists(manifestPath)) || await readFile(manifestPath, 'utf8') !== serialized) {
    await writeFile(manifestPath, serialized)
  }
  console.log(`Responsive images ready: ${Object.keys(manifest).length} sources; favicon ${favicon.length} bytes`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateResponsiveImages()
}
