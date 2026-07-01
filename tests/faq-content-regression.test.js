import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const faqSection = readFileSync(resolve(projectRoot, 'src/components/FaqSection.vue'), 'utf8')
const useSchemaOrg = readFileSync(resolve(projectRoot, 'src/composables/useSchemaOrg.js'), 'utf8')

assert.match(faqSection, /schemaFaqPage/)
assert.match(faqSection, /home-faq/)
assert.match(faqSection, /\u0434\u043e\u0441\u0442\u0430\u0432\u043a\u043e\u0439 \u043f\u043e \u041a\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043d\u0443/i)
assert.match(faqSection, /\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u044d\u043b\u0435\u043c\u0435\u043d\u0442\u043e\u0432 \u043d\u0443\u0436\u043d\u043e/i)
assert.match(faqSection, /\u0444\u043e\u0442\u043e, \u044d\u0441\u043a\u0438\u0437 \u0438\u043b\u0438 \u043f\u0440\u0438\u043c\u0435\u0440/i)

const questionCount = (faqSection.match(/question:/g) || []).length
assert.ok(questionCount >= 7, 'homepage FAQ should cover at least seven commercial questions')

assert.match(useSchemaOrg, /const schemaScripts = new Map\(\)/)
assert.match(useSchemaOrg, /data-schema-id/)
assert.match(useSchemaOrg, /export function schemaFaqPage/)
