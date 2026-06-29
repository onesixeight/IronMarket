import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildContactPrefillMessage,
  buildProductContactMessage,
  buildScenarioContactMessage,
  contactScenarios,
  getContactScenario,
} from '../src/composables/useContactPrefill.js'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const gatesScenario = getContactScenario('gates')
const scenarioMessage = buildScenarioContactMessage(gatesScenario)

assert.equal(contactScenarios.length, 4)
assert.equal(gatesScenario.id, 'gates')
assert.match(scenarioMessage, /Нужен подбор кованых элементов/)
assert.match(scenarioMessage, /Ворота и калитка/)
assert.doesNotMatch(scenarioMessage, /undefined|null|\[object Object\]/)

const productMessage = buildProductContactMessage(
  {
    id: 12,
    name: 'Розетка декоративная',
    material: 'Сталь',
  },
  { origin: 'https://example.com' }
)

assert.match(productMessage, /Розетка декоративная/)
assert.match(productMessage, /Материал: Сталь/)
assert.match(productMessage, /https:\/\/example\.com\/product\/12/)

assert.equal(
  buildContactPrefillMessage({ task: 'gates' }),
  scenarioMessage
)
assert.equal(
  buildContactPrefillMessage({
    product: { id: 12, name: 'Розетка декоративная', material: 'Сталь' },
    task: 'gates',
    origin: 'https://example.com',
  }),
  productMessage
)

const leadPicker = readFileSync(resolve(projectRoot, 'src/components/LeadPicker.vue'), 'utf8')
const contactForm = readFileSync(resolve(projectRoot, 'src/components/ContactForm.vue'), 'utf8')
const contactsView = readFileSync(resolve(projectRoot, 'src/views/ContactsView.vue'), 'utf8')
const productView = readFileSync(resolve(projectRoot, 'src/views/ProductView.vue'), 'utf8')

assert.match(leadPicker, /selectedContactRoute/)
assert.match(leadPicker, /path: '\/contacts'/)
assert.match(leadPicker, /query: \{ task: selectedScenario\.value\.id \}/)

assert.match(contactForm, /initialMessage/)
assert.match(contactForm, /messagePlaceholder/)
assert.match(contactForm, /watch\(/)

assert.match(contactsView, /useRoute/)
assert.match(contactsView, /buildContactPrefillMessage/)
assert.match(contactsView, /contactInitialMessage/)
assert.match(contactsView, /:initial-message="contactInitialMessage"/)

assert.match(productView, /query: \{ product: product\.id \}/)
