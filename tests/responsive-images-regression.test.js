import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDir = fileURLToPath(new URL('../public', import.meta.url))

const responsiveSets = [
  {
    original: '/images/hero/hero-ornamental-pattern-v2.webp',
    variants: ['/images/hero/hero-ornamental-pattern-v2-768w.webp', '/images/hero/hero-ornamental-pattern-v2-1200w.webp'],
  },
  {
    original: '/images/hero/hero-ornamental-gate-v2.webp',
    variants: ['/images/hero/hero-ornamental-gate-v2-768w.webp', '/images/hero/hero-ornamental-gate-v2-1200w.webp'],
  },
  {
    original: '/images/hero/hero-wrought-iron-fence-v2.webp',
    variants: ['/images/hero/hero-wrought-iron-fence-v2-768w.webp', '/images/hero/hero-wrought-iron-fence-v2-1200w.webp'],
  },
  {
    original: '/images/examples/app-railings.jpg',
    variants: ['/images/examples/app-railings-512w.jpg', '/images/examples/app-railings-768w.jpg'],
  },
  {
    original: '/images/examples/app-fences.jpg',
    variants: ['/images/examples/app-fences-512w.jpg', '/images/examples/app-fences-768w.jpg'],
  },
  {
    original: '/images/examples/app-balcony.jpg',
    variants: ['/images/examples/app-balcony-512w.jpg', '/images/examples/app-balcony-768w.jpg'],
  },
  {
    original: '/images/examples/app-grilles.jpg',
    variants: ['/images/examples/app-grilles-512w.jpg', '/images/examples/app-grilles-768w.jpg'],
  },
  {
    original: '/images/examples/app-gates.jpg',
    variants: ['/images/examples/app-gates-512w.jpg', '/images/examples/app-gates-768w.jpg'],
  },
]

function publicFile(imagePath) {
  return path.join(publicDir, imagePath.replace(/^\//, ''))
}

for (const imageSet of responsiveSets) {
  const originalPath = publicFile(imageSet.original)
  assert.ok(fs.existsSync(originalPath), `Responsive image original should exist: ${imageSet.original}`)

  const originalSize = fs.statSync(originalPath).size
  for (const variant of imageSet.variants) {
    const variantPath = publicFile(variant)
    assert.ok(fs.existsSync(variantPath), `Responsive image variant should exist: ${variant}`)
    assert.ok(
      fs.statSync(variantPath).size < originalSize,
      `Responsive image variant should be lighter than original: ${variant}`
    )
  }
}

const generated = JSON.parse(fs.readFileSync(new URL('../src/data/image-variants.json', import.meta.url), 'utf8'))
for (const source of [
  '/images/examples/app-railings.jpg',
  '/images/products/bizzon/nakladnoi-uzor-bonzur-iz-truby-15x15mm.webp',
]) {
  const candidates = generated[source].split(', ').map(candidate => candidate.split(' '))
  assert.ok(candidates.length > 1, 'Large images should offer compact responsive candidates')
  for (const [url, descriptor] of candidates) {
    const metadata = await sharp(publicFile(url)).metadata()
    assert.equal(metadata.width, Number.parseInt(descriptor), `Width descriptor must match the actual image: ${url}`)
  }
  assert.ok(fs.statSync(publicFile(candidates[0][0])).size < fs.statSync(publicFile(source)).size)
  assert.equal(candidates.at(-1)[0], source, 'Original image should remain available for large displays')
}
const favicon = publicFile('/images/optimized/favicon-48.png')
assert.equal((await sharp(favicon).metadata()).width, 48)
assert.ok(fs.statSync(favicon).size < 5_000, 'Favicon should stay lightweight')

console.log('ok responsive-images: real image candidates and dimensions verified')
