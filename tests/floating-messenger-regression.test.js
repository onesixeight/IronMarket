import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const floatingMessenger = readFileSync(
  resolve(projectRoot, 'src/components/FloatingMessenger.vue'),
  'utf8'
)

assert.match(floatingMessenger, /ref="floatingMessengerRef"/)
assert.match(floatingMessenger, /@click="toggleMessenger"/)
assert.match(floatingMessenger, /:aria-label="open \? 'Закрыть чат' : 'Открыть чат'"/)
assert.match(floatingMessenger, /:aria-expanded="open"/)
assert.match(floatingMessenger, /function handleDocumentPointerDown\(event\)/)
assert.match(floatingMessenger, /floatingMessengerRef\.value\?\.contains\(target\)/)
assert.match(floatingMessenger, /open\.value = false/)
assert.match(
  floatingMessenger,
  /document\.addEventListener\('pointerdown', handleDocumentPointerDown\)/
)
assert.match(
  floatingMessenger,
  /document\.removeEventListener\('pointerdown', handleDocumentPointerDown\)/
)
