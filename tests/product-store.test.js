import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia } from 'pinia'
import { useProductStore } from '../src/stores/products.js'

function fixture() {
  const store = useProductStore(createPinia())
  store.categories = [
    { slug: 'crowns', name: 'Короны' },
    { slug: 'corners', name: 'Уголки' },
  ]
  store.allProducts = [
    { id: 1, name: 'Корона Б', description: 'Для ворот', categorySlug: 'crowns', price: 300 },
    { id: 2, name: 'Корона А', description: 'Для калитки', categorySlug: 'crowns', price: 100 },
    { id: 3, name: 'Уголок', description: 'Для ворот', categorySlug: 'corners', price: 200 },
  ]
  return store
}

test('catalog store combines category and case-insensitive name/description filters without mutating products', () => {
  const store = fixture()
  const original = JSON.stringify(store.allProducts)
  store.searchQuery = 'ВОРОТ'
  assert.deepEqual(
    store.filteredProducts.map((p) => p.id),
    [1, 3]
  )
  store.selectedCategory = 'crowns'
  assert.deepEqual(
    store.filteredProducts.map((p) => p.id),
    [1]
  )
  store.searchQuery = 'корона'
  assert.deepEqual(
    store.filteredProducts.map((p) => p.id),
    [2, 1]
  )
  assert.equal(JSON.stringify(store.allProducts), original)
})

test('catalog store sorts actual results and pages do not repeat products', () => {
  const store = fixture()
  store.sortBy = 'price-asc'
  assert.deepEqual(
    store.filteredProducts.map((p) => p.id),
    [2, 3, 1]
  )
  store.sortBy = 'price-desc'
  assert.deepEqual(
    store.filteredProducts.map((p) => p.id),
    [1, 3, 2]
  )
  store.allProducts = Array.from({ length: 41 }, (_, id) => ({
    id,
    name: `Деталь ${String(id).padStart(2, '0')}`,
    price: id,
  }))
  store.sortBy = 'name'
  assert.equal(store.totalPages, 3)
  assert.equal(store.paginatedProducts.length, 20)
  const firstPage = new Set(store.paginatedProducts.map((p) => p.id))
  store.currentPage = 2
  assert.equal(store.paginatedProducts.length, 20)
  assert.ok(store.paginatedProducts.every((p) => !firstPage.has(p.id)))
  store.currentPage = 3
  assert.deepEqual(
    store.paginatedProducts.map((p) => p.id),
    [40]
  )
  store.searchQuery = 'несуществующее'
  assert.equal(store.totalPages, 0)
  assert.deepEqual(store.paginatedProducts, [])
})

test('catalog lookups and counters follow changes to the real Pinia state', () => {
  const store = fixture()
  assert.equal(store.categoryProductCount.get('crowns'), 2)
  assert.equal(store.getCategoryBySlug('corners').name, 'Уголки')
  assert.deepEqual(
    store.getProductsByCategory('crowns').map((p) => p.id),
    [1, 2]
  )
  assert.equal(store.getProductById(3).name, 'Уголок')
  assert.deepEqual(
    store.getRelatedProducts(1).map((p) => p.id),
    [2]
  )
  assert.deepEqual(store.getRelatedProducts(99), [])
  assert.deepEqual(
    store.searchProducts('КОРОНА').map((p) => p.id),
    [1, 2]
  )
  assert.deepEqual(store.searchProducts(''), [])
  store.allProducts.push({ id: 4, name: 'Уголок второй', categorySlug: 'corners', price: 150 })
  assert.equal(store.categoryProductCount.get('corners'), 2)
  assert.equal(store.getProductById(4).price, 150)
})
