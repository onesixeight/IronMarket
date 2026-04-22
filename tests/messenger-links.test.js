import assert from 'node:assert/strict'

import { useMessengerOrder } from '../src/composables/useMessengerOrder.js'

const { buildOrderMessage } = useMessengerOrder()

const message = buildOrderMessage(
  [
    {
      name: 'Кованый элемент',
      quantity: 2,
      price: 1500,
      hidePrice: false,
    },
  ],
  3000,
  {
    name: 'Алия',
    phone: '+7 (777) 123-45-67',
    city: 'Астана',
    street: 'пр. Туран, 12',
    addressLine: 'ЖК Example, кв. 45',
    delivery: 'courier',
    payment: 'card',
  }
)

assert.match(message, /Заказ с сайта Эталон Ковка/)
assert.match(message, /Имя: Алия/)
assert.match(message, /Телефон: \+7 \(777\) 123-45-67/)
assert.match(message, /Итого: 3[\s\u00A0]000[\s\u00A0]?₸/)
assert.match(message, /Город: Астана/)
assert.match(message, /Улица: пр\. Туран, 12/)
assert.match(message, /Адрес: ЖК Example, кв\. 45/)
assert.doesNotMatch(message, /Р.|вЂ|Г°Её|Гђ|Г‘/)

let buildLeadMessage

try {
  ;({ buildLeadMessage } = await import('../src/composables/useMessengerLead.js'))
} catch {
  assert.fail('buildLeadMessage export is missing')
}

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
