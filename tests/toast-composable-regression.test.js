import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toastComposable = readFileSync(resolve(projectRoot, 'src/composables/useToast.js'), 'utf8')
const toastContainer = readFileSync(resolve(projectRoot, 'src/components/ToastContainer.vue'), 'utf8')

assert.match(toastComposable, /export function useToast\(\)/)
assert.match(toastComposable, /storeToRefs/)
assert.match(toastComposable, /useToastStore/)
assert.match(toastComposable, /toasts/)
assert.match(toastComposable, /remove: toastStore\.remove/)
assert.match(toastComposable, /success: toastStore\.success/)
assert.match(toastComposable, /error: toastStore\.error/)
assert.match(toastComposable, /info: toastStore\.info/)

assert.match(toastContainer, /import \{ useToast \} from '\.\.\/composables\/useToast\.js'/)
assert.match(toastContainer, /const \{ toasts, remove \} = useToast\(\)/)
assert.match(toastContainer, /v-for="toast in toasts"/)
assert.match(toastContainer, /@click="remove\(toast\.id\)"/)
assert.doesNotMatch(toastContainer, /useToastStore/)
assert.doesNotMatch(toastContainer, /toastStore/)
