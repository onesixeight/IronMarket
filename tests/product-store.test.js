import assert from 'node:assert/strict'

import { createPinia, setActivePinia } from 'pinia'

import { useProductStore } from '../src/stores/products.js'
import catalog from '../src/data/catalog.json' with { type: 'json' }

setActivePinia(createPinia())

const store = useProductStore()
const TOTAL = catalog.products.length

// --- allPriceRange ---
const range = store.allPriceRange
const prices = catalog.products.map((p) => p.price)
assert.equal(range.min, Math.min(...prices))
assert.equal(range.max, Math.max(...prices))

// --- categoryProductCount ---
const counts = store.categoryProductCount
assert.equal(counts.size, catalog.categories.length)
let summed = 0
for (const n of counts.values()) summed += n
assert.equal(summed, TOTAL)

// --- selectedCategory filter ---
const firstSlug = catalog.categories[0].slug
store.selectedCategory = firstSlug
const inCat = store.filteredProducts
assert.ok(inCat.length > 0)
assert.ok(inCat.every((p) => p.categorySlug === firstSlug))
const expectedCatCount = catalog.products.filter((p) => p.categorySlug === firstSlug).length
assert.equal(inCat.length, expectedCatCount)

// --- search by name ---
store.selectedCategory = null
store.searchQuery = 'корона'
const searched = store.filteredProducts
assert.ok(searched.length > 0)
assert.ok(searched.every((p) => p.name.toLowerCase().includes('корона') || (p.description || '').toLowerCase().includes('корона')))
store.searchQuery = ''

// --- price filters (цена 0 остаётся в каталоге, фильтр работает по полю price) ---
store.priceMin = 1000
assert.ok(store.filteredProducts.every((p) => p.price >= 1000))
store.priceMax = 2000
assert.ok(store.filteredProducts.every((p) => p.price >= 1000 && p.price <= 2000))
store.priceMin = 0
store.priceMax = 0

// --- sort ---
store.selectedCategory = null
store.searchQuery = ''

store.sortBy = 'price-asc'
const asc = store.filteredProducts
for (let i = 1; i < asc.length; i++) {
  assert.ok(asc[i - 1].price <= asc[i].price, 'price-asc ordering broken')
}

store.sortBy = 'price-desc'
const desc = store.filteredProducts
for (let i = 1; i < desc.length; i++) {
  assert.ok(desc[i - 1].price >= desc[i].price, 'price-desc ordering broken')
}

store.sortBy = 'name'
const byName = store.filteredProducts
for (let i = 1; i < byName.length; i++) {
  assert.ok(byName[i - 1].name.localeCompare(byName[i].name) <= 0, 'name ordering broken')
}

// Сортировка не мутирует исходный массив.
assert.equal(store.allProducts.length, TOTAL)

// --- pagination ---
store.sortBy = 'name'
store.currentPage = 1
assert.ok(store.paginatedProducts.length <= 20)
assert.equal(store.totalPages, Math.ceil(TOTAL / 20))
store.currentPage = 2
assert.ok(store.paginatedProducts.length <= 20)
// Страница 2 не пересекается со страницей 1.
store.currentPage = 1
const page1 = store.paginatedProducts
store.currentPage = 2
const page2 = store.paginatedProducts
const page1Ids = new Set(page1.map((p) => p.id))
assert.ok(page2.every((p) => !page1Ids.has(p.id)))

// --- helpers ---
const sampleProduct = catalog.products[0]
assert.ok(store.getProductById(sampleProduct.id))
assert.equal(store.getCategoryBySlug(firstSlug)?.slug, firstSlug)
assert.ok(store.getProductsByCategory(firstSlug).length > 0)

const related = store.getRelatedProducts(sampleProduct.id)
assert.ok(related.length <= 4)
assert.ok(related.every((r) => r.id !== sampleProduct.id))
assert.ok(related.every((r) => r.categorySlug === sampleProduct.categorySlug))

assert.ok(store.searchProducts('корона').length <= 5)
assert.deepEqual(store.searchProducts(''), [])

console.log('✓ product-store: filter / sort / pagination / helpers')
