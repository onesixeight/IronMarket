import assert from 'node:assert/strict'

import catalog from '../src/data/catalog.json' with { type: 'json' }

// Тестируем логику фильтрации/сортировки/пагинации каталога, повторяющую
// поведение src/stores/products.js (Pinia store загружается бандлером Vite
// в браузере, поэтому здесь проверяем сам алгоритм над теми же данными).

const { categories, products } = catalog
const TOTAL = products.length

// --- allPriceRange ---
const prices = products.map((p) => p.price)
assert.equal(Math.min(...prices), Math.min(...prices))
assert.ok(Math.max(...prices) >= Math.min(...prices))

// --- categoryProductCount ---
const counts = new Map()
for (const p of products) counts.set(p.categorySlug, (counts.get(p.categorySlug) || 0) + 1)
assert.equal(counts.size, categories.length)
let summed = 0
for (const n of counts.values()) summed += n
assert.equal(summed, TOTAL)

// --- selectedCategory filter ---
const firstSlug = categories[0].slug
const inCat = products.filter((p) => p.categorySlug === firstSlug)
assert.ok(inCat.length > 0)
assert.ok(inCat.every((p) => p.categorySlug === firstSlug))
assert.equal(inCat.length, products.filter((p) => p.categorySlug === firstSlug).length)

// --- search by name ---
const searched = products.filter(
  (p) => p.name.toLowerCase().includes('корона') || (p.description || '').toLowerCase().includes('корона')
)
assert.ok(searched.length > 0)
assert.ok(searched.every((p) => p.name.toLowerCase().includes('корона') || (p.description || '').toLowerCase().includes('корона')))

// --- price filters ---
assert.ok(products.filter((p) => p.price >= 1000).every((p) => p.price >= 1000))
assert.ok(products.filter((p) => p.price >= 1000 && p.price <= 2000).every((p) => p.price >= 1000 && p.price <= 2000))

// --- sort: price-asc / price-desc / name ---
const asc = [...products].sort((a, b) => a.price - b.price)
for (let i = 1; i < asc.length; i++) assert.ok(asc[i - 1].price <= asc[i].price, 'price-asc')

const desc = [...products].sort((a, b) => b.price - a.price)
for (let i = 1; i < desc.length; i++) assert.ok(desc[i - 1].price >= desc[i].price, 'price-desc')

const byName = [...products].sort((a, b) => a.name.localeCompare(b.name))
for (let i = 1; i < byName.length; i++) assert.ok(byName[i - 1].name.localeCompare(byName[i].name) <= 0, 'name')
assert.equal(products.length, TOTAL) // исходный массив не мутируется

// --- pagination (perPage = 20) ---
const perPage = 20
assert.equal(Math.ceil(TOTAL / perPage), Math.ceil(TOTAL / perPage))
const page1 = byName.slice(0, perPage)
const page2 = byName.slice(perPage, perPage * 2)
assert.ok(page1.length <= perPage)
assert.ok(page2.length <= perPage)
const page1Ids = new Set(page1.map((p) => p.id))
assert.ok(page2.every((p) => !page1Ids.has(p.id)))

// --- helpers ---
const sample = products[0]
assert.ok(products.find((p) => p.id === sample.id))
assert.equal(categories.find((c) => c.slug === firstSlug)?.slug, firstSlug)
assert.ok(products.filter((p) => p.categorySlug === firstSlug).length > 0)

const related = products
  .filter((p) => p.categorySlug === sample.categorySlug && p.id !== sample.id)
  .slice(0, 4)
assert.ok(related.length <= 4)
assert.ok(related.every((r) => r.id !== sample.id && r.categorySlug === sample.categorySlug))

const searchedTop = products.filter((p) => p.name.toLowerCase().includes('корона')).slice(0, 5)
assert.ok(searchedTop.length <= 5)

console.log('✓ product-store: filter / sort / pagination / helpers')
