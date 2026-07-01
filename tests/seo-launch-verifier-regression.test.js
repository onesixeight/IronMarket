import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFileSync(resolve(projectRoot, path), 'utf8')

const packageJson = read('package.json')
const verifier = read('scripts/verify-seo-launch.mjs')

assert.ok(existsSync(resolve(projectRoot, 'scripts/verify-seo-launch.mjs')), 'SEO launch verifier should exist')
assert.match(packageJson, /"verify:seo": "node scripts\/verify-seo-launch\.mjs"/)
assert.match(packageJson, /"verify:seo:ci": "npm run build && npm run verify:seo"/)
assert.match(verifier, /buildSiteRoutes\(catalog\)/)
assert.match(verifier, /sitemap URL count matches route registry/)
assert.match(verifier, /sitemap includes all registered routes/)
assert.match(verifier, /LocalBusiness/)
assert.match(verifier, /Product/)
assert.match(verifier, /G-3TYNDM52D9/)
assert.match(verifier, /110264764/)
