import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import catalog from '../src/data/catalog.json' with { type: 'json' }

const homeView = readFileSync(new URL('../src/views/HomeView.vue', import.meta.url), 'utf8')

assert.match(
  homeView,
  /class="surface-panel popular-products-panel rounded-\[2rem\] p-5 sm:p-6 lg:p-8"/,
  'Popular products section should use the shared wrapped surface style'
)
assert.match(homeView, /class="popular-products-layout"/)
assert.match(homeView, /class="popular-products-copy"/)
assert.match(homeView, /class="popular-products-grid"/)
assert.match(homeView, /class="popular-products-points"/)
assert.match(homeView, /class="popular-product-card group"/)
assert.match(homeView, /class="popular-product-title"/)
assert.match(homeView, /class="popular-product-action"/)
assert.match(homeView, /decoding="async" sizes="56px"/)
assert.match(homeView, /decoding="async" sizes="\(max-width: 480px\) 88px, 104px"/)
assert.match(homeView, /const POPULAR_PRODUCT_IDS = \[6150, 6160, 6173, 6199\]/)
assert.match(homeView, /const POPULAR_PRODUCTS_LIMIT = 4/)
assert.match(homeView, /productStore\.getProductById\(id\)/)
assert.match(homeView, /filter\(Boolean\)/)
assert.doesNotMatch(
  homeView,
  /popularProducts = computed\(\(\) => productStore\.allProducts\.filter\(p => p\.badge\)/,
  'Popular products should not depend on the optional badge field'
)
assert.doesNotMatch(homeView, /import ProductCard/, 'Home view should not import the full catalog card for compact popular products')
assert.doesNotMatch(homeView, /<ProductCard[\s\S]*popularProducts/, 'Home popular products should use compact cards')

const selectedIds = [6150, 6160, 6173, 6199]
const selectedProducts = selectedIds.map((id) => catalog.products.find((product) => product.id === id))
assert.equal(selectedProducts.filter(Boolean).length, 4)
assert.equal(new Set(selectedProducts.map((product) => product.categorySlug)).size, 4)
assert.ok(selectedProducts.every((product) => product.image), 'Selected popular products should have images')
assert.match(
  homeView,
  /\.popular-products-layout\s*\{[\s\S]*display: grid;[\s\S]*align-items: center;/,
  'Popular products section should vertically center its internal grid'
)
assert.match(
  homeView,
  /grid-template-columns: minmax\(18rem, 0\.48fr\) minmax\(0, 1fr\);/,
  'Popular products layout should reserve a filled product column on desktop'
)
assert.match(
  homeView,
  /\.popular-product-card\s*\{[\s\S]*grid-template-columns: 6\.5rem minmax\(0, 1fr\);/,
  'Popular product cards should be compact horizontal tiles'
)
assert.match(
  homeView,
  /-webkit-line-clamp: 2;/,
  'Popular product titles should be clamped instead of overflowing'
)
assert.match(
  homeView,
  /\.popular-products-grid\s*\{[\s\S]*align-self: center;[\s\S]*grid-template-columns: 1fr;/,
  'Popular products grid should center inside the product column and keep a mobile-safe base layout'
)
