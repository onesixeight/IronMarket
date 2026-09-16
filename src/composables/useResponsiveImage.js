import imageVariants from '../data/image-variants.json' with { type: 'json' }

const widths = [160, 320, 640, 960]
const srcsets = new Map()

export function getProductImageSrcset(imagePath) {
  const entry = imageVariants[imagePath]
  if (!entry) return undefined
  if (!srcsets.has(imagePath)) {
    const [hash, width] = entry
    const candidates = widths.filter(size => size < width)
      .map(size => `/images/optimized/${hash}-${size}w.webp ${size}w`)
    // Keep the original as the largest candidate, including images <=160px.
    candidates.push(`${imagePath} ${width}w`)
    srcsets.set(imagePath, candidates.join(', '))
  }
  return srcsets.get(imagePath)
}
