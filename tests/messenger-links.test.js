import assert from 'node:assert/strict'

import { buildLeadMessage } from '../src/composables/useMessengerLead.js'

// Тестируем сборку сообщения заявки (lead) — живая логика, используется
// в ContactForm.vue. Order-часть (useMessengerOrder) удалена вместе с
// корзиной/checkout, т.к. магазин переведён на лидогенерацию.

const leadMessage = buildLeadMessage({
  name: 'Диас',
  phone: '+7 (701) 111-22-33',
  email: 'dias@example.com',
  message: 'Нужен подбор элементов для ворот.',
})

assert.match(leadMessage, /Заявка с сайта Эталон Ковка/)
assert.match(leadMessage, /Имя: Диас/)
assert.match(leadMessage, /Телефон: \+7 \(701\) 111-22-33/)
assert.match(leadMessage, /Email: dias@example\.com/)
assert.match(leadMessage, /Нужен подбор элементов для ворот\./)

// Без email и сообщения — те же обязательные поля, без лишних строк.
const minimal = buildLeadMessage({ name: 'Алия', phone: '+7 777 000 11 22' })
assert.match(minimal, /Заявка с сайта Эталон Ковка/)
assert.match(minimal, /Имя: Алия/)
assert.match(minimal, /Телефон: \+7 777 000 11 22/)
assert.doesNotMatch(minimal, /Email/)
assert.doesNotMatch(minimal, /Сообщение/)

// Кастомный source-лейбл.
const branded = buildLeadMessage(
  { name: 'Тест', phone: '+7 700 000 00 00' },
  { sourceLabel: 'со страницы доставки' }
)
assert.match(branded, /Заявка со страницы доставки/)

console.log('✓ messenger-links: buildLeadMessage')
