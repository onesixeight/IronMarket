import assert from 'node:assert/strict'

import { buildWhatsAppLink, buildTelegramLink, WHATSAPP_PHONE, TELEGRAM_USERNAME } from '../src/composables/messengerConfig.js'

// Константы контактов.
assert.equal(WHATSAPP_PHONE, '77758537092')
assert.equal(TELEGRAM_USERNAME, 'etalonkovka')

// WhatsApp-ссылка содержит номер и encodeURIComponent-сообщение.
const wa = buildWhatsAppLink('Здравствуйте!')
assert.equal(wa, `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('Здравствуйте!')}`)
assert.ok(wa.startsWith('https://wa.me/'))
assert.ok(wa.includes('%D0%97')) // кириллица закодирована

// Telegram-ссылка содержит username (без @) и закодированное сообщение.
const tg = buildTelegramLink('Тест сообщения')
assert.equal(tg, `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent('Тест сообщения')}`)
assert.ok(tg.startsWith('https://t.me/'))

// Пустое сообщение тоже безопасно кодируется.
assert.equal(buildWhatsAppLink(''), 'https://wa.me/77758537092?text=')

console.log('✓ messenger-config: buildWhatsAppLink / buildTelegramLink')
