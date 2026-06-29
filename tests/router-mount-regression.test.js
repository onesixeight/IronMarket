import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const main = readFileSync(resolve(projectRoot, 'src/main.js'), 'utf8')

assert.match(main, /router\.isReady\(\)\.then\(\(\) => \{/)
assert.match(main, /app\.mount\('#app'\)/)
assert.ok(main.indexOf('router.isReady()') < main.indexOf("app.mount('#app')"))
