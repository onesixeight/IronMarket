import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

console.log('ok responsive-images: hero and example image candidates exist')
