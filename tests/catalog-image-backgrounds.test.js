import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const catalog = JSON.parse(fs.readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'))
const publicDir = fileURLToPath(new URL('../public', import.meta.url))
const imagePaths = [...new Set([...catalog.categories, ...catalog.products].map((item) => item.image))]

function pngColorType(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex')
  assert.equal(signature, '89504e470d0a1a0a', 'PNG file should have a valid signature')
  assert.equal(buffer.subarray(12, 16).toString('ascii'), 'IHDR', 'PNG file should start with an IHDR chunk')
  return buffer[25]
}

for (const imagePath of imagePaths) {
  const filePath = path.join(publicDir, imagePath.replace(/^\//, ''))
  assert.ok(fs.existsSync(filePath), `Catalog image should exist: ${imagePath}`)

  if (path.extname(filePath).toLowerCase() !== '.png') continue

  const buffer = fs.readFileSync(filePath)
  const colorType = pngColorType(buffer)
  assert.notEqual(colorType, 4, `Catalog PNG should not use grayscale alpha: ${imagePath}`)
  assert.notEqual(colorType, 6, `Catalog PNG should be composited onto a solid background: ${imagePath}`)
}
