import assert from 'node:assert/strict'

import { getProductUrl, buildProductInquiryMessage } from '../src/composables/useProductInquiry.js'
import { SITE_ORIGIN } from '../src/config/site.js'

const product = { id: 6150, name: 'Кованая корона', material: 'Сталь 15х15' }
const ORIGIN = SITE_ORIGIN.replace(/\/$/, '')

// getProductUrl строит ссылку на товар с encodeURIComponent id.
assert.equal(getProductUrl(product), `${ORIGIN}/product/6150`)
// Числовой id кодируется безопасно.
assert.equal(getProductUrl({ id: 'a&b' }), `${ORIGIN}/product/${encodeURIComponent('a&b')}`)
// Без id — откат на каталог.
assert.equal(getProductUrl({}), `${ORIGIN}/catalog`)
assert.equal(getProductUrl(null), `${ORIGIN}/catalog`)
// Явный origin переопределяет.
assert.equal(getProductUrl(product, { origin: 'https://example.com/' }), 'https://example.com/product/6150')

// Сообщение содержит имя, материал, ссылку и фиксированные строки.
const msg = buildProductInquiryMessage(product)
assert.match(msg, /Здравствуйте! Интересует позиция:/)
assert.match(msg, /Кованая корона/)
assert.match(msg, /Материал: Сталь 15х15/)
assert.match(msg, /Ссылка: .*\/product\/6150/)
assert.match(msg, /Подскажите наличие, количество и доставку\./)

// Дефолты при отсутствии полей.
const msgDefaults = buildProductInquiryMessage({ id: 1 })
assert.match(msgDefaults, /товар из каталога/)
assert.match(msgDefaults, /Материал: уточнить/)

// Опциональный комментарий добавляется.
const msgNote = buildProductInquiryMessage(product, { note: 'Нужна доставка в Астану' })
assert.match(msgNote, /Комментарий: Нужна доставка в Астану/)

console.log('✓ product-inquiry: getProductUrl / buildProductInquiryMessage')
