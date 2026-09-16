import assert from 'node:assert/strict'
import test from 'node:test'
import catalog from '../src/data/catalog.json' with { type: 'json' }
import elementMetadata from '../src/data/constructor-elements.json' with { type: 'json' }
import { constructorGroups, constructorProducts, getConstructorProduct } from '../src/constructor/catalog.js'
import { analyzeConstructorImage, analyzeLowerPairImage } from '../scripts/analyze-constructor-images.mjs'
import { fileURLToPath } from 'node:url'

test('constructor entries join unique existing catalogue products without changing their fields', () => {
  assert.equal(new Set(elementMetadata.map((element) => element.productId)).size, elementMetadata.length)
  assert.equal(constructorProducts.length, elementMetadata.length)
  assert.equal(constructorProducts.length, catalog.products.length)
  assert.deepEqual(
    constructorProducts.map((product) => product.id).sort((a, b) => a - b),
    catalog.products.map((product) => product.id).sort((a, b) => a - b)
  )

  const groups = new Set(constructorGroups.map((group) => group.id))
  for (const product of constructorProducts) {
    const original = catalog.products.find((candidate) => candidate.id === product.productId)
    assert.ok(original, `Unknown catalogue product ${product.productId}`)
    for (const [key, value] of Object.entries(original)) {
      assert.deepEqual(product[key], value, `Original ${key} changed for ${product.id}`)
    }
    assert.ok(groups.has(product.group), `Unknown group for ${product.id}`)
    assert.ok(product.shortName.trim())
    assert.equal(getConstructorProduct(product.id), product)
    assert.equal(getConstructorProduct(String(product.id)), product)
  }
  assert.equal(getConstructorProduct(-1), undefined)
  assert.equal(getConstructorProduct('invalid'), undefined)
})

test('ready dimensions come from catalogue values; uncertain dimensions require an explanation', () => {
  for (const product of constructorProducts) {
    assert.equal(typeof product.requiresDimensions, 'boolean')
    for (const dimension of [product.widthMm, product.heightMm]) {
      assert.ok(dimension === null || (Number.isFinite(dimension) && dimension > 0))
    }
    if (product.requiresDimensions) {
      assert.ok(product.dimensionNote?.trim(), `Missing dimension explanation for ${product.id}`)
      continue
    }
    const dimensions = product.size.match(/^(\d+)\s*[хx×]\s*(\d+)$/u)
    const sourceDimensions = product.id === 6291 ? [500, 500] : dimensions?.slice(1).map(Number)
    assert.ok(sourceDimensions, `Ambiguous catalogue size accepted for ${product.id}`)
    assert.ok(Number.isFinite(product.widthMm) && product.widthMm > 0)
    assert.ok(Number.isFinite(product.heightMm) && product.heightMm > 0)
    assert.deepEqual(
      [product.widthMm, product.heightMm].sort((a, b) => a - b),
      sourceDimensions.sort((a, b) => a - b),
      `Constructor dimensions must come from the catalogue for ${product.id}`
    )
    const photoRatio = product.crop.width / product.crop.height
    const specifiedRatio = product.widthMm / product.heightMm
    assert.ok(
      Math.abs(Math.log(photoRatio / specifiedRatio)) <= Math.log(1.25),
      `Image orientation or aspect ratio disagrees with catalogue dimensions for ${product.id}`
    )
  }
  assert.deepEqual(
    [getConstructorProduct(6199).widthMm, getConstructorProduct(6199).heightMm],
    [300, 800],
    'The vertically photographed Arka baluster must not inherit height as width'
  )
})

test('incomplete, conflicting and per-piece dimensions remain unconfirmed', () => {
  for (const id of [6287, 6290]) {
    const product = getConstructorProduct(id)
    assert.equal(product.requiresDimensions, true)
    assert.equal(product.widthMm, null)
    assert.equal(product.heightMm, null)
    assert.match(product.dimensionNote, /расходятся размеры/u)
  }
  for (const product of constructorProducts.filter((item) => ['posts', 'leaves'].includes(item.group))) {
    assert.equal(product.requiresDimensions, true)
    assert.equal(product.widthMm, null)
    assert.ok(product.heightMm > 0)
  }
  for (const id of [6167, 6238, 6281, 6282]) {
    const product = getConstructorProduct(id)
    assert.equal(product.saleUnit, 'pair')
    assert.equal(product.piecesPerSaleUnit, 2)
    assert.equal(product.requiresDimensions, true)
    assert.equal(product.widthMm, null)
    assert.equal(product.heightMm, null)
    assert.match(product.dimensionNote, /одной половины/u)
  }
  for (const id of [6270, 6307]) {
    const product = getConstructorProduct(id)
    assert.equal(product.widthMm, 980)
    assert.equal(product.heightMm, null)
    assert.equal(product.requiresDimensions, true)
    assert.ok(product.crop.height < product.imageHeight / 5, 'Only the specified baluster is shown')
  }
  for (const id of [6260, 6261, 6262, 6263, 6264, 6265]) {
    const product = getConstructorProduct(id)
    assert.ok(product.crop.width < product.imageWidth / 3, 'Only one post is shown')
  }
  assert.equal(getConstructorProduct(6299).widthMm, null)
  assert.equal(getConstructorProduct(6299).requiresDimensions, true)
  assert.deepEqual([getConstructorProduct(6291).widthMm, getConstructorProduct(6291).heightMm], [500, 500])
})

test('saved image crops match the original files and stay inside their pixel bounds', async () => {
  for (const product of constructorProducts) {
    const imagePath = fileURLToPath(new URL(`../public${product.image}`, import.meta.url))
    const analysis = product.clipPolygon
      ? await analyzeLowerPairImage(imagePath)
      : await analyzeConstructorImage(imagePath, product.imageRegion)
    assert.equal(product.imageWidth, analysis.imageWidth, `Image width changed for ${product.id}`)
    assert.equal(product.imageHeight, analysis.imageHeight, `Image height changed for ${product.id}`)
    assert.deepEqual(product.crop, analysis.crop, `Crop no longer matches source photo ${product.id}`)
    const { x, y, width, height } = product.crop
    for (const number of [x, y, width, height]) assert.ok(Number.isInteger(number))
    assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0)
    assert.ok(x + width <= product.imageWidth && y + height <= product.imageHeight)
    if (product.clipPolygon) {
      assert.deepEqual(product.clipPolygon, analysis.clipPolygon)
      assert.ok(product.clipPolygon.length >= 3)
      for (const [pointX, pointY] of product.clipPolygon) {
        assert.ok(Number.isInteger(pointX) && Number.isInteger(pointY))
        assert.ok(pointX >= x && pointY >= y)
        assert.ok(pointX < x + width && pointY < y + height)
      }
    }
  }
})
