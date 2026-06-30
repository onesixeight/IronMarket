import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const productView = readFileSync(resolve(projectRoot, 'src/views/ProductView.vue'), 'utf8')
const deliveryView = readFileSync(resolve(projectRoot, 'src/views/DeliveryView.vue'), 'utf8')
const faqSection = readFileSync(resolve(projectRoot, 'src/components/FaqSection.vue'), 'utf8')
const breadcrumb = readFileSync(resolve(projectRoot, 'src/components/AppBreadcrumb.vue'), 'utf8')

assert.match(productView, /class="product-detail-grid/)
assert.match(productView, /class="product-media-card/)
assert.match(productView, /productOrderSteps/)
assert.match(productView, /productTrustItems/)
assert.match(productView, /product-payment-note/)
assert.match(productView, /product-material-note/)
assert.match(productView, /product-material-label/)
assert.doesNotMatch(productView, /uppercase tracking-wider text-obsidian-500">Материал/)
assert.match(productView, /Оплата через Kaspi/)
assert.match(productView, /после подтверждения наличия, количества и доставки/i)
assert.match(productView, /На сайте онлайн-оплата не списывается/)
assert.match(productView, /aria-label="Как проходит заявка по товару"/)
assert.match(productView, /prefers-reduced-motion/)

assert.match(deliveryView, /Kaspi/)
assert.match(deliveryView, /Поможем рассчитать доставку для вашего заказа\./)
assert.match(deliveryView, /Останется указать город, позиции и примерный объём\./)
assert.doesNotMatch(deliveryView, /Нужно понять доставку под ваш объём/)
assert.match(deliveryView, /после подтверждения наличия, количества и доставки/i)
assert.match(faqSection, /Kaspi/)
assert.match(faqSection, /после подтверждения заказа/i)
assert.match(breadcrumb, /overflow-x-auto/)
assert.match(breadcrumb, /whitespace-nowrap/)
assert.match(breadcrumb, /aria-label="Хлебные крошки"/)

for (const content of [productView, deliveryView, faqSection]) {
  assert.doesNotMatch(content, /paymentMethods/)
  assert.doesNotMatch(content, /Банковская карта/)
  assert.doesNotMatch(content, /оплата 100%/i)
}
