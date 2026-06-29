import assert from 'node:assert/strict'
import fs from 'node:fs'

const header = fs.readFileSync(new URL('../src/components/AppHeader.vue', import.meta.url), 'utf8')
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const footer = fs.readFileSync(new URL('../src/components/AppFooter.vue', import.meta.url), 'utf8')
const contacts = fs.readFileSync(new URL('../src/views/ContactsView.vue', import.meta.url), 'utf8')

assert.match(header, /brand-mark-ornament-small\.webp/, 'Header should use the optimized compact branding asset')
assert.match(html, /brand-mark-ornament-small\.webp/, 'Preloader should use the optimized compact branding asset')
assert.match(html, /favicon-brand-mark\.png/, 'Index HTML should point favicon to the new brand mark export')
assert.doesNotMatch(header, /M12 2L2 7l10 5 10-5/, 'Header should no longer use the old layered inline mark')
assert.match(footer, /Пн-Вс: 9:00-18:00/, 'Footer should show the unified weekly schedule')
assert.match(footer, /Без выходных/, 'Footer should show the no-days-off note')
assert.match(contacts, /Пн-Вс: 9:00-18:00/, 'Contacts view should show the unified weekly schedule')
assert.match(contacts, /Без выходных/, 'Contacts view should show the no-days-off note')
assert.match(contacts, /Астана, просп\. Богенбай Батыра, 6\/4/, 'Contacts page should show the Astana address above the map')
assert.match(contacts, /iframe/, 'Contacts page should embed a map iframe')
assert.match(contacts, /yandex/i, 'Contacts page should use a Yandex map embed')
assert.match(contacts, /text=%D0%90%D1%81%D1%82%D0%B0%D0%BD%D0%B0/, 'Yandex map should search by the public Astana address')
assert.match(contacts, /z=17/, 'Yandex map should use the stable address-level zoom')
