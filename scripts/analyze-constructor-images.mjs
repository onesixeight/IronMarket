import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = fileURLToPath(new URL('../', import.meta.url))

/** Read-only crop analysis for the curated catalogue's white-background photos. */
export async function analyzeConstructorImage(imagePath, imageRegion) {
  const image = sharp(imagePath)
  const metadata = await image.metadata()
  if (imageRegion) {
    image.extract({ left: imageRegion.x, top: imageRegion.y, width: imageRegion.width, height: imageRegion.height })
  }
  const { data, info } = await image.toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true })

  let left = info.width
  let top = info.height
  let right = -1
  let bottom = -1

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels
      // Ignore the white background and very faint compression artefacts.
      const brightness = (data[offset] + data[offset + 1] + data[offset + 2]) / 3
      if (brightness >= 220) continue
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x)
      bottom = Math.max(bottom, y)
    }
  }

  if (right < left || bottom < top) throw new Error(`No product silhouette found: ${imagePath}`)

  // Keep a two-pixel margin so antialiased edges are not clipped.
  left = Math.max(0, left - 2)
  top = Math.max(0, top - 2)
  right = Math.min(info.width - 1, right + 2)
  bottom = Math.min(info.height - 1, bottom + 2)

  return {
    crop: {
      x: left + (imageRegion?.x || 0),
      y: top + (imageRegion?.y || 0),
      width: right - left + 1,
      height: bottom - top + 1,
    },
    imageWidth: metadata.width,
    imageHeight: metadata.height,
  }
}

/** Isolate the lower piece in the two reviewed, diagonally nested pair photos. */
export async function analyzeLowerPairImage(imagePath) {
  const { data, info } = await sharp(imagePath)
    .toColourspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const seen = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  const components = []
  const dark = (pixel) => data[pixel * channels] + data[pixel * channels + 1] + data[pixel * channels + 2] < 720
  for (let start = 0; start < seen.length; start++) {
    if (seen[start]) continue
    seen[start] = 1
    if (!dark(start)) continue
    let head = 0
    let tail = 1
    queue[0] = start
    const points = []
    let bottom = 0
    while (head < tail) {
      const pixel = queue[head++]
      const x = pixel % width
      const y = Math.floor(pixel / width)
      bottom = Math.max(bottom, y)
      points.push([x, y])
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const next = ny * width + nx
          if (seen[next]) continue
          seen[next] = 1
          if (dark(next)) queue[tail++] = next
        }
    }
    if (points.length > 1000) components.push({ points, bottom })
  }
  if (components.length !== 2) throw new Error(`Expected two separate pair silhouettes: ${imagePath}`)
  const selected = components.sort((a, b) => b.bottom - a.bottom)[0]
  const tops = new Array(width).fill(height)
  const bottoms = new Array(width).fill(-1)
  for (const [x, y] of selected.points)
    for (let dx = -2; dx <= 2; dx++) {
      const column = x + dx
      if (column < 0 || column >= width) continue
      tops[column] = Math.min(tops[column], Math.max(0, y - 2))
      bottoms[column] = Math.max(bottoms[column], Math.min(height - 1, y + 2))
    }
  const outline = []
  for (let x = 0; x < width; x++) if (bottoms[x] >= 0) outline.push([x, tops[x]])
  for (let x = width - 1; x >= 0; x--) if (bottoms[x] >= 0) outline.push([x, bottoms[x]])
  const clipPolygon = outline.filter((point, index) => {
    const before = outline[(index + outline.length - 1) % outline.length]
    const after = outline[(index + 1) % outline.length]
    return (point[0] - before[0]) * (after[1] - point[1]) !== (point[1] - before[1]) * (after[0] - point[0])
  })
  const xs = outline.map((point) => point[0])
  const ys = outline.map((point) => point[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return {
    crop: { x, y, width: Math.max(...xs) - x + 1, height: Math.max(...ys) - y + 1 },
    imageWidth: width,
    imageHeight: height,
    clipPolygon,
  }
}

async function main() {
  const catalog = JSON.parse(await fs.readFile(path.join(root, 'src/data/catalog.json'), 'utf8'))
  const metadata = JSON.parse(await fs.readFile(path.join(root, 'src/data/constructor-elements.json'), 'utf8'))
  const productsById = new Map(catalog.products.map((product) => [product.id, product]))
  const analyzed = []
  for (const element of metadata) {
    const product = productsById.get(element.productId)
    if (!product) throw new Error(`Unknown catalogue product ${element.productId}`)
    const imagePath = path.join(root, 'public', product.image.replace(/^\//, ''))
    const analysis = element.clipPolygon
      ? await analyzeLowerPairImage(imagePath)
      : await analyzeConstructorImage(imagePath, element.imageRegion)
    analyzed.push({ ...element, ...analysis })
  }
  // Deliberately print proposed metadata; this script never changes source images or files.
  process.stdout.write(`${JSON.stringify(analyzed, null, 2)}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
