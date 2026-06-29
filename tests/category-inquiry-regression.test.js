import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildCategoryContactMessage,
  buildContactPrefillMessage,
} from '../src/composables/useContactPrefill.js'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const categoryPanelPath = resolve(projectRoot, 'src/components/CategoryRequestPanel.vue')

const category = {
  slug: 'uzory',
  name: 'Кованые узоры',
  description: 'Декоративные элементы для ворот и ограждений.',
}

const categoryMessage = buildCategoryContactMessage(category)

assert.match(categoryMessage, /Интересует категория/)
assert.match(categoryMessage, /Кованые узоры/)
assert.match(categoryMessage, /Декоративные элементы для ворот и ограждений/)
assert.match(categoryMessage, /количество, размеры и город доставки/)
assert.doesNotMatch(categoryMessage, /undefined|null|\[object Object\]/)
assert.equal(buildContactPrefillMessage({ category }), categoryMessage)

assert.ok(existsSync(categoryPanelPath), 'CategoryRequestPanel component should exist')

const categoryPanel = readFileSync(categoryPanelPath, 'utf8')
const categoryView = readFileSync(resolve(projectRoot, 'src/views/CategoryView.vue'), 'utf8')
const contactsView = readFileSync(resolve(projectRoot, 'src/views/ContactsView.vue'), 'utf8')

assert.match(categoryPanel, /defineProps/)
assert.match(categoryPanel, /category: \{ type: Object, required: true \}/)
assert.match(categoryPanel, /path: '\/contacts'/)
assert.match(categoryPanel, /query: \{ category: category\.slug \}/)
assert.match(categoryPanel, /aria-labelledby="category-request-title"/)

assert.match(categoryView, /import CategoryRequestPanel/)
assert.match(categoryView, /<CategoryRequestPanel/)
assert.match(categoryView, /:category="category"/)
assert.match(categoryView, /:product-count="products\.length"/)

assert.match(contactsView, /contactCategory/)
assert.match(contactsView, /route\.query\.category/)
assert.match(contactsView, /category: contactCategory\.value/)
