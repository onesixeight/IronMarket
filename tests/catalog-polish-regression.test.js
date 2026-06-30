import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalogView = readFileSync(resolve(projectRoot, 'src/views/CatalogView.vue'), 'utf8')

assert.match(catalogView, /class="catalog-hero/)
assert.match(catalogView, /catalogStats/)
assert.doesNotMatch(catalogView, /catalog-hero-mark/)
assert.doesNotMatch(catalogView, />Iron</i)
assert.match(catalogView, /productStore\.allProducts\.length/)
assert.match(catalogView, /productStore\.filteredProducts\.length/)
assert.match(catalogView, /id="catalog-products"/)
assert.doesNotMatch(catalogView, /hash: '#catalog-products'/)
assert.doesNotMatch(catalogView, /scrollToCatalogProducts/)
assert.match(catalogView, /class="catalog-control-bar/)
assert.match(catalogView, /class="catalog-category-card/)
assert.match(catalogView, /:aria-label="`Открыть категорию/)
assert.match(catalogView, /:style="\{ '--category-index': i \}"/)
assert.match(catalogView, /catalog-category-card:focus-visible/)
assert.match(catalogView, /prefers-reduced-motion/)
assert.ok(
  catalogView.indexOf('id="catalog-products"') < catalogView.indexOf('class="catalog-hero'),
  'Catalog products should be the first main catalog section'
)
assert.ok(
  catalogView.indexOf('id="catalog-products"') < catalogView.indexOf('<CatalogProjectShortcuts'),
  'Catalog filters and products should appear before project shortcuts'
)
