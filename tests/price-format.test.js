import assert from 'node:assert/strict'

import { formatPrice } from '../src/composables/usePrice.js'

// ru-RU ставит разделителем тысяч NBSP (U+00A0).
const NBSP = '\u00A0'

// Число группируется разделителем тысяч с суффиксом валюты.
assert.equal(formatPrice(1500), `1${NBSP}500 ₸`)
assert.equal(formatPrice(4600000), `4${NBSP}600${NBSP}000 ₸`)

// Ноль и пустые значения безопасно дают «0 ₸».
assert.equal(formatPrice(0), '0 ₸')
assert.equal(formatPrice(null), '0 ₸')
assert.equal(formatPrice(undefined), '0 ₸')

// Строка-число приводится.
assert.equal(formatPrice('1000'), `1${NBSP}000 ₸`)

// Явная локаль меняет разделитель (en-US — запятая).
assert.equal(formatPrice(1500, 'en-US'), '1,500 ₸')

console.log('✓ price-format: formatPrice')
