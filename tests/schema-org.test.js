import assert from 'node:assert/strict'

import { schemaProduct, schemaItemList } from '../src/composables/useSchemaOrg.js'

// --- schemaProduct: цена показывается, когда не скрыта ---
const priced = schemaProduct({ name: 'Балясина', image: '/x.webp', price: 1500, description: 'Опора' })
assert.equal(priced['@type'], 'Product')
assert.equal(priced.name, 'Балясина')
assert.equal(priced.brand.name, 'Эталон Ковка')
assert.equal(priced.offers.priceCurrency, 'KZT')
assert.equal(priced.offers.price, '1500') // строка
assert.equal(priced.offers.availability, 'https://schema.org/InStock')

// --- schemaProduct: при hidePrice блок offers отсутствует ---
const hidden = schemaProduct({ name: 'Корона', image: '/y.webp', price: 0, hidePrice: true })
assert.equal(hidden.offers, undefined)
assert.equal(hidden.description, 'Корона') // fallback на имя при пустом описании

// --- schemaProduct: null-продукт возвращает null ---
assert.equal(schemaProduct(null), null)

// --- schemaItemList: позиции с 1, PreOrder для hidePrice ---
const list = schemaItemList(
  [
    { id: 1, name: 'A', image: '/a.webp', price: 100 },
    { id: 2, name: 'B', image: '/b.webp', price: 0, hidePrice: true },
  ],
  'Каталог'
)
assert.equal(list['@type'], 'ItemList')
assert.equal(list.name, 'Каталог')
assert.equal(list.itemListElement.length, 2)
assert.equal(list.itemListElement[0].position, 1)
assert.equal(list.itemListElement[1].position, 2)
assert.equal(list.itemListElement[0].item.offers.availability, 'https://schema.org/InStock')
assert.equal(list.itemListElement[0].item.offers.price, '100')
assert.equal(list.itemListElement[1].item.offers.availability, 'https://schema.org/PreOrder')
assert.equal(list.itemListElement[1].item.offers.price, '0')

// --- schemaItemList: пустой/нет данных → null ---
assert.equal(schemaItemList([], 'X'), null)
assert.equal(schemaItemList(null, 'X'), null)

console.log('✓ schema-org: schemaProduct / schemaItemList')
