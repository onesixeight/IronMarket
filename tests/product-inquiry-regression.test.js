import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildProductInquiryMessage,
  getProductTelegramLink,
  getProductWhatsAppLink,
} from '../src/composables/useProductInquiry.js'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sampleProduct = {
  id: 42,
  name: 'Балясина БП-01',
  material: 'Сталь 12 мм',
}

const message = buildProductInquiryMessage(sampleProduct, { origin: 'https://example.com' })

assert.match(message, /Интересует позиция/)
assert.match(message, /Балясина БП-01/)
assert.match(message, /Материал: Сталь 12 мм/)
assert.match(message, /https:\/\/example\.com\/product\/42/)
assert.match(message, /наличие, количество и доставку/)
assert.doesNotMatch(message, /undefined|null|\[object Object\]/)

const whatsappLink = getProductWhatsAppLink(sampleProduct, { origin: 'https://example.com' })
const telegramLink = getProductTelegramLink(sampleProduct, { origin: 'https://example.com' })

assert.match(whatsappLink, /^https:\/\/wa\.me\/77758537092\?text=/)
assert.match(telegramLink, /^https:\/\/t\.me\/etalonkovka\?text=/)
assert.match(decodeURIComponent(whatsappLink), /Балясина БП-01/)
assert.match(decodeURIComponent(telegramLink), /https:\/\/example\.com\/product\/42/)

const productView = readFileSync(resolve(projectRoot, 'src/views/ProductView.vue'), 'utf8')
const productCard = readFileSync(resolve(projectRoot, 'src/components/ProductCard.vue'), 'utf8')

assert.match(productView, /getProductWhatsAppLink/)
assert.match(productView, /getProductTelegramLink/)
assert.match(productView, /productInquiryLinks/)
assert.match(productView, /target="_blank"/)

assert.match(productCard, /getProductWhatsAppLink/)
assert.match(productCard, /whatsappInquiryLink/)
assert.match(productCard, /target="_blank"/)

const leadPickerPath = resolve(projectRoot, 'src/components/LeadPicker.vue')
const faqSectionPath = resolve(projectRoot, 'src/components/FaqSection.vue')

assert.ok(existsSync(leadPickerPath), 'LeadPicker component should exist')
assert.ok(existsSync(faqSectionPath), 'FaqSection component should exist')

const leadPicker = readFileSync(leadPickerPath, 'utf8')
const faqSection = readFileSync(faqSectionPath, 'utf8')
const homeView = readFileSync(resolve(projectRoot, 'src/views/HomeView.vue'), 'utf8')
const contactPrefill = readFileSync(resolve(projectRoot, 'src/composables/useContactPrefill.js'), 'utf8')

assert.match(leadPicker, /projectScenarios/)
assert.match(leadPicker, /buildScenarioMessage/)
assert.match(leadPicker, /getScenarioWhatsAppLink/)
assert.match(leadPicker, /aria-pressed/)
assert.match(leadPicker, /contactScenarios/)
assert.match(leadPicker, /const selectedId = ref\(null\)/)

for (const scenarioId of ['gates', 'railings', 'fences', 'stairs']) {
  assert.match(contactPrefill, new RegExp(`id: '${scenarioId}'`))
}

assert.match(faqSection, /faqItems/)
assert.match(faqSection, /<details/)
assert.match(faqSection, /<summary/)
assert.doesNotMatch(faqSection, /:open=/)

assert.match(homeView, /import LeadPicker/)
assert.match(homeView, /<LeadPicker/)
assert.match(homeView, /import FaqSection/)
assert.match(homeView, /<FaqSection/)
