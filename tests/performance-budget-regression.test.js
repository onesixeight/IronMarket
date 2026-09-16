import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { assertConstructorIsolation, getAssetTotals, PERFORMANCE_BUDGETS } from '../scripts/verify-performance-budget.mjs'

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

test('editor budgets are additional and do not weaken storefront limits or exempt other chunks', () => {
  assert.equal(PERFORMANCE_BUDGETS.assetGzipKb.totalJs, 130)
  assert.equal(PERFORMANCE_BUDGETS.assetGzipKb.totalCss, 30)
  assert.equal(PERFORMANCE_BUDGETS.assetGzipKb.appEntryJs, 35)
  const totals = getAssetTotals([
    { name: 'index-a.js', gzipKb: 20 },
    { name: 'index-a.css', gzipKb: 15 },
    { name: 'catalog-data-a.js', gzipKb: 18 },
    { name: 'constructor-editor-a.js', gzipKb: 60 },
    { name: 'constructor-data-a.js', gzipKb: 18 },
    { name: 'constructor-editor-a.css', gzipKb: 13 },
    { name: 'constructor-unrecognized-a.js', gzipKb: 5 },
    { name: 'other-route-a.css', gzipKb: 2 },
    { name: 'voice-assistant-sdk-a.js', gzipKb: 160 },
    { name: 'rawAudioProcessor-a.js', gzipKb: 2 },
  ])
  assert.deepEqual(totals, { storefrontJs: 43, storefrontCss: 17, constructorJs: 78, constructorCss: 13, voiceJs: 162 })
})

function isolatedManifest() {
  return {
    'index.html': { file: 'assets/index-a.js', isEntry: true, imports: ['_shared'], dynamicImports: ['src/views/ConstructorView.vue'], css: ['assets/index-a.css'] },
    'src/views/HomeView.vue': { file: 'assets/HomeView-a.js', isDynamicEntry: true, imports: ['_shared'] },
    'src/views/ConstructorView.vue': { file: 'assets/constructor-editor-a.js', isDynamicEntry: true, imports: ['_shared', '_editorData'], css: ['assets/constructor-editor-a.css'] },
    _shared: { file: 'assets/shared-a.js', imports: ['index.html'] },
    _editorData: { file: 'assets/constructor-data-a.js' },
  }
}

test('artifact validation follows static dependencies and tolerates shared cycles without following the lazy route', () => {
  assert.deepEqual(assertConstructorIsolation(isolatedManifest(), ['/assets/index-a.js']).sort(), [
    'assets/constructor-data-a.js', 'assets/constructor-editor-a.css', 'assets/constructor-editor-a.js',
  ])
})

test('artifact validation rejects editor leakage through a shared dependency, global CSS, or SW precache', () => {
  const dependencyLeak = isolatedManifest()
  dependencyLeak._shared.imports.push('src/views/ConstructorView.vue')
  assert.throws(() => assertConstructorIsolation(dependencyLeak), /imports constructor assets/)
  const styleLeak = isolatedManifest()
  styleLeak['index.html'].css.push('assets/constructor-editor-a.css')
  assert.throws(() => assertConstructorIsolation(styleLeak), /imports constructor assets/)
  assert.throws(() => assertConstructorIsolation(isolatedManifest(), ['/assets/constructor-data-a.js']), /must not precache/)
  const disabledRoute = isolatedManifest()
  delete disabledRoute['src/views/ConstructorView.vue']
  assert.throws(() => assertConstructorIsolation(disabledRoute), /lazy production route/)
})
