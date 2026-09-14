import assert from 'node:assert/strict'
import { ref } from 'vue'

import catalog from '../src/data/catalog.json' with { type: 'json' }

import {
  schemaFaqPage,
  schemaOrganization,
  schemaProduct,
  schemaItemList,
} from '../src/composables/useSchemaOrg.js'

// --- schemaOrganization: локальная компания с контактами и адресом ---
const organization = schemaOrganization()
assert.equal(organization['@type'], 'LocalBusiness')
assert.equal(organization.name, 'Эталон Ковка')
assert.equal(organization.url, 'https://etalon-kovka.kz/')
assert.equal(organization.telephone, '+77758537092')
assert.equal(organization.email, 'etalonkovka@mail.ru')
assert.equal(organization.address.streetAddress, 'просп. Богенбай Батыра, 6/4, 16 ряд, 14 место')
assert.equal(organization.address.addressLocality, 'Астана')
assert.equal(organization.openingHours, 'Mo-Su 09:00-18:00')
assert.equal(organization.priceRange, 'KZT')

// --- schemaProduct: цена показывается, когда не скрыта ---
const priced = schemaProduct({ id: 10, name: 'Балясина', image: '/x.webp', price: 1500, description: 'Опора' })
assert.equal(priced['@type'], 'Product')
assert.equal(priced.name, 'Балясина')
assert.equal(priced.brand.name, 'Эталон Ковка')
assert.equal(priced.url, 'https://etalon-kovka.kz/product/10')
assert.equal(priced.offers.priceCurrency, 'KZT')
assert.equal(priced.offers.url, 'https://etalon-kovka.kz/product/10')
assert.equal(priced.offers.price, '1500') // строка
assert.equal(priced.image, 'https://etalon-kovka.kz/x.webp')
assert.equal(priced.offers.availability, undefined, 'Do not claim stock without inventory data')

// --- Price-on-request pages keep useful metadata without incomplete Product markup ---
const hidden = schemaProduct({ id: 11, name: 'Корона', image: '/y.webp', price: 1500, hidePrice: true })
assert.equal(hidden['@type'], 'ItemPage')
assert.equal(hidden.offers, undefined)
assert.equal(hidden.brand, undefined)
assert.equal(hidden.review, undefined)
assert.equal(hidden.aggregateRating, undefined)
assert.equal(hidden.url, 'https://etalon-kovka.kz/product/11')
assert.equal(hidden.description, 'Корона') // fallback на имя при пустом описании
assert.equal(hidden.image, 'https://etalon-kovka.kz/y.webp')

for (const price of [undefined, null, '', '1500', NaN, Infinity, -1]) {
  const invalid = schemaProduct({ id: 11, name: 'Корона', price })
  assert.equal(invalid['@type'], 'ItemPage', `Invalid catalog price ${String(price)} must not create an Offer`)
  assert.equal(invalid.offers, undefined)
}
assert.equal(schemaProduct({ id: 12, name: 'Образец', price: 0 }).offers.price, '0', 'An explicitly visible zero price is distinct from a hidden price')

const reactiveProduct = ref({ id: 11, name: 'Корона', price: 1500, hidePrice: true })
assert.equal(schemaProduct(reactiveProduct)['@type'], 'ItemPage')
reactiveProduct.value.hidePrice = false
assert.equal(schemaProduct(reactiveProduct)['@type'], 'Product')
assert.equal(schemaProduct(reactiveProduct).offers.price, '1500')

// --- schemaProduct: null-продукт возвращает null ---
assert.equal(schemaProduct(null), null)

// --- Lists link to item pages without declaring product snippets for each row ---
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
assert.deepEqual(list.itemListElement[0], {
  '@type': 'ListItem', position: 1, name: 'A',
  image: 'https://etalon-kovka.kz/a.webp', url: 'https://etalon-kovka.kz/product/1',
})
assert.deepEqual(list.itemListElement[1], {
  '@type': 'ListItem', position: 2, name: 'B',
  image: 'https://etalon-kovka.kz/b.webp', url: 'https://etalon-kovka.kz/product/2',
})

for (const product of catalog.products.filter((item) => item.hidePrice)) {
  const schema = schemaProduct(product)
  assert.equal(schema['@type'], 'ItemPage', `Hidden-price product ${product.id} must not declare an incomplete Product`)
  assert.equal(schema.offers, undefined)
}
const categoryList = schemaItemList(catalog.products.filter((p) => p.categorySlug === 'kovanye-balyasiny'), 'Кованые балясины')
assert.ok(categoryList.itemListElement.length > 0)
assert.ok(categoryList.itemListElement.every((item) => item['@type'] === 'ListItem' && !item.item && !item.offers))

// --- schemaItemList: пустой/нет данных → null ---
assert.equal(schemaItemList([], 'X'), null)
assert.equal(schemaItemList(null, 'X'), null)

// --- schemaFaqPage: FAQPage с вопросами и ответами ---
const faq = schemaFaqPage([
  { question: 'Можно ли заказать доставку?', answer: 'Да, после уточнения города и объёма.' },
  { question: 'Можно ли отправить эскиз?', answer: 'Да, в мессенджере.' },
])
assert.equal(faq['@type'], 'FAQPage')
assert.equal(faq.mainEntity.length, 2)
assert.equal(faq.mainEntity[0]['@type'], 'Question')
assert.equal(faq.mainEntity[0].acceptedAnswer['@type'], 'Answer')
assert.equal(schemaFaqPage([]), null)

console.log('✓ schema-org: organization / product / item list / FAQ')
