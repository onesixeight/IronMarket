import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = readFileSync(resolve(projectRoot, 'package.json'), 'utf8')
const verifier = readFileSync(resolve(projectRoot, 'scripts/verify-performance-budget.mjs'), 'utf8')

assert.match(packageJson, /"verify:perf": "node scripts\/verify-performance-budget\.mjs"/)
assert.match(packageJson, /"verify:perf:ci": "npm run build && npm run verify:perf"/)

assert.match(verifier, /export const PERFORMANCE_BUDGETS/)
assert.match(verifier, /lcpMs: 3000/)
assert.match(verifier, /cls: 0\.1/)
assert.match(verifier, /assetGzipKb/)
assert.match(verifier, /gzipSync/)
assert.match(verifier, /largest-contentful-paint/)
assert.match(verifier, /layout-shift/)
assert.match(verifier, /img\[fetchpriority="high"\]/)
assert.match(verifier, /vite\.js/)
assert.match(verifier, /preview/)
assert.match(verifier, /resourceCount/)

console.log('ok performance-budget: scripted Web Vitals and asset checks')
