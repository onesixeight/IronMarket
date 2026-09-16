import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { getProductImageSrcset } from '../src/composables/useResponsiveImage.js'

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
const catalog = JSON.parse(fs.readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'))
const expectedSources = [...new Set([
  ...[...catalog.products, ...catalog.categories].map(item => item.image).filter(Boolean),
  ...['railings', 'fences', 'balcony', 'grilles', 'gates'].map(name => `/images/examples/app-${name}.jpg`),
])]
assert.deepEqual(Object.keys(generated).sort(), expectedSources.sort(), 'The compact manifest retains every original image')
let smallOriginals = 0
for (const source of expectedSources) {
  const input = fs.readFileSync(publicFile(source))
  const { width } = await sharp(input).metadata()
  const hash = createHash('sha256').update(input).update('webp-82-v1').digest('hex').slice(0, 12)
  // This is the previous generator's exact srcset, reconstructed independently
  // from actual source bytes and dimensions rather than the compact manifest.
  const expected = [160, 320, 640, 960].filter(size => size < width)
    .map(size => `/images/optimized/${hash}-${size}w.webp ${size}w`)
  expected.push(`${source} ${width}w`)
  const srcset = getProductImageSrcset(source)
  assert.equal(srcset, expected.join(', '), `All responsive candidates remain byte-identical: ${source}`)
  assert.equal(getProductImageSrcset(source), srcset, 'Repeated lookups preserve the srcset')
  assert.deepEqual(generated[source], [width > 160 ? hash : '', width])
  const candidates = srcset.split(', ').map(candidate => candidate.split(' '))
  for (const [url, descriptor] of candidates) {
    const metadata = await sharp(publicFile(url)).metadata()
    assert.equal(metadata.width, Number.parseInt(descriptor), `Width descriptor must match the actual image: ${url}`)
  }
  if (width > 160) assert.ok(candidates.length > 1, 'Large images offer smaller candidates')
  else {
    smallOriginals++
    assert.equal(candidates.length, 1, 'Small originals are never enlarged')
  }
  assert.equal(candidates.at(-1)[0], source, 'Original image should remain available for large displays')
}
assert.ok(smallOriginals > 0, 'The full-catalogue check includes originals at or below 160px')
assert.equal(getProductImageSrcset('/images/missing-image.webp'), undefined, 'Unknown images retain the src fallback')
const favicon = publicFile('/images/optimized/favicon-48.png')
assert.equal((await sharp(favicon).metadata()).width, 48)
assert.ok(fs.statSync(favicon).size < 5_000, 'Favicon should stay lightweight')

console.log('ok responsive-images: real image candidates and dimensions verified')
