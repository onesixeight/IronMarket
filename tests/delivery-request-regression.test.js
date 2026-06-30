import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildContactPrefillMessage,
  buildDeliveryContactMessage,
} from '../src/composables/useContactPrefill.js'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const deliveryView = readFileSync(resolve(projectRoot, 'src/views/DeliveryView.vue'), 'utf8')
const contactsView = readFileSync(resolve(projectRoot, 'src/views/ContactsView.vue'), 'utf8')
const footer = readFileSync(resolve(projectRoot, 'src/components/AppFooter.vue'), 'utf8')

const deliveryMessage = buildDeliveryContactMessage()

assert.match(deliveryMessage, /Хочу уточнить доставку/)
assert.match(deliveryMessage, /город/i)
assert.match(deliveryMessage, /количество/)
assert.doesNotMatch(deliveryMessage, /undefined|null|\[object Object\]/)
assert.equal(buildContactPrefillMessage({ topic: 'delivery' }), deliveryMessage)

assert.match(deliveryView, /Доставка и заявка/)
assert.match(deliveryView, /deliverySteps/)
assert.match(deliveryView, /deliveryInquiryRoute/)
assert.match(deliveryView, /query: \{ topic: 'delivery' \}/)
assert.match(deliveryView, /Уточнить доставку/)
assert.match(deliveryView, /Kaspi/)
assert.match(deliveryView, /delivery-faq-toggle/)
assert.match(deliveryView, /delivery-faq\[open\] \.delivery-faq-toggle/)
assert.doesNotMatch(deliveryView, /:open=/)
assert.match(deliveryView, /после подтверждения наличия, количества и доставки/i)
assert.doesNotMatch(deliveryView, /Способы оплаты/)
assert.doesNotMatch(deliveryView, /Банковская карта/)
assert.doesNotMatch(deliveryView, /платёжн|платежн/i)
assert.doesNotMatch(deliveryView, /paymentMethods/)
assert.doesNotMatch(deliveryView, /оплата 100%/i)

assert.match(contactsView, /route\.query\.topic/)
assert.match(contactsView, /topic: route\.query\.topic/)
assert.match(contactsView, /deliveryContextLabel/)

assert.doesNotMatch(footer, /Доставка и оплата/)
assert.match(footer, />Доставка</)
