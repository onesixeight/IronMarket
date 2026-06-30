import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const main = readFileSync(resolve(projectRoot, 'src/main.js'), 'utf8')
const router = readFileSync(resolve(projectRoot, 'src/router/index.js'), 'utf8')

assert.match(main, /router\.isReady\(\)\.then\(\(\) => \{/)
assert.match(main, /app\.mount\('#app'\)/)
assert.ok(main.indexOf('router.isReady()') < main.indexOf("app.mount('#app')"))
assert.match(router, /redirect: '\/catalog'/)
assert.match(router, /return \{ left: 0, top: 0 \}/)
assert.doesNotMatch(router, /if \(to\.hash\)/)
assert.doesNotMatch(router, /document\.querySelector\(to\.hash\)/)
assert.doesNotMatch(router, /new Promise/)
assert.doesNotMatch(router, /setTimeout/)
