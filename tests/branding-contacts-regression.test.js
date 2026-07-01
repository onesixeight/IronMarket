import assert from 'node:assert/strict'
import fs from 'node:fs'

import { CONTACTS } from '../src/config/contacts.js'

const header = fs.readFileSync(new URL('../src/components/AppHeader.vue', import.meta.url), 'utf8')
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const footer = fs.readFileSync(new URL('../src/components/AppFooter.vue', import.meta.url), 'utf8')
const contacts = fs.readFileSync(new URL('../src/views/ContactsView.vue', import.meta.url), 'utf8')
const contactsConfig = fs.readFileSync(new URL('../src/config/contacts.js', import.meta.url), 'utf8')

assert.match(header, /brand-mark-ornament-small\.webp/, 'Header should use the optimized compact branding asset')
assert.match(html, /brand-mark-ornament-small\.webp/, 'Preloader should use the optimized compact branding asset')
assert.match(html, /favicon-brand-mark\.png/, 'Index HTML should point favicon to the new brand mark export')
assert.doesNotMatch(header, /M12 2L2 7l10 5 10-5/, 'Header should no longer use the old layered inline mark')

assert.equal(CONTACTS.phone.display, '+7 775 853 70 92')
assert.equal(CONTACTS.email.value, 'etalonkovka@mail.ru')
assert.equal(CONTACTS.location.address, 'Астана, просп. Богенбай Батыра, 6/4, 16 ряд, 14 место')
assert.equal(CONTACTS.hours.primary, 'Пн-Вс: 9:00-18:00')
assert.equal(CONTACTS.hours.note, 'Без выходных')
assert.match(contactsConfig, /WHATSAPP_PHONE = CONTACTS\.phone\.raw/, 'WhatsApp phone should be exported from the contact config')
assert.match(contactsConfig, /TELEGRAM_USERNAME = CONTACTS\.telegram\.username/, 'Telegram username should be exported from the contact config')
assert.match(header, /CONTACTS\.phone\.display/, 'Header should read the phone display from the contact config')
assert.match(footer, /CONTACTS\.hours\.primary/, 'Footer should read hours from the contact config')
assert.match(contacts, /CONTACTS\.location\.address/, 'Contacts view should read the address from the contact config')
assert.doesNotMatch(header, /tel:\+77758537092/, 'Header should not hard-code the phone href')
assert.doesNotMatch(footer, /mailto:etalonkovka@mail\.ru/, 'Footer should not hard-code the email href')

assert.match(contacts, /iframe/, 'Contacts page should embed a map iframe')
assert.match(contactsConfig, /yandex/i, 'Contacts config should use a Yandex map embed')
assert.match(contactsConfig, /text=%D0%90%D1%81%D1%82%D0%B0%D0%BD%D0%B0/, 'Yandex map should search by the public Astana address')
assert.match(contactsConfig, /z=17/, 'Yandex map should use the stable address-level zoom')
