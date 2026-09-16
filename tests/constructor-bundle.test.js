import assert from 'node:assert/strict'
import test from 'node:test'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'

import { getPrecacheAssets } from '../scripts/inject-sw-precache.mjs'
import { assertConstructorIsolation, getAssetTotals, PERFORMANCE_BUDGETS } from '../scripts/verify-performance-budget.mjs'

test('production artifacts keep editor code, metadata and styles lazy without pulling shared or voice dependencies into startup', async () => {
  const result = await build({ build: { write: false, reportCompressedSize: false }, logLevel: 'error' })
  const output = result.output
  const manifest = JSON.parse(output.find((item) => item.fileName === '.vite/manifest.json').source)
  const assetFiles = output.map((item) => '/' + item.fileName).filter((file) => /\.(?:js|css)$/.test(file))
  const constructorFiles = assertConstructorIsolation(manifest, getPrecacheAssets(assetFiles))
  assert.equal(constructorFiles.length, 3, 'Editor JS, metadata JS and editor CSS are separate on-demand artifacts')
  const editor = output.find((item) => item.fileName === manifest['src/views/ConstructorView.vue'].file)
  assert.ok(Object.keys(editor.modules).every((id) => !id.includes('/node_modules/')), 'Shared framework/SDK dependencies must not move into the editor chunk')
  const voice = output.find((item) => item.type === 'chunk' && item.fileName.includes('/voice-assistant-sdk-'))
  assert.ok(Object.keys(voice.modules).some((id) => id.includes('/livekit-client/')), 'The large voice transport must stay inside the optional voice SDK')
  const assets = output.filter((item) => /\.(?:js|css)$/.test(item.fileName)).map((item) => ({
    name: item.fileName.replace(/^assets\//, ''),
    gzipKb: gzipSync(item.type === 'chunk' ? item.code : item.source).length / 1024,
  }))
  const totals = getAssetTotals(assets)
  const budgets = PERFORMANCE_BUDGETS.assetGzipKb
  assert.ok(totals.storefrontJs <= budgets.totalJs, `Storefront JS: ${totals.storefrontJs.toFixed(2)}KB`)
  assert.ok(totals.storefrontCss <= budgets.totalCss, `Storefront CSS: ${totals.storefrontCss.toFixed(2)}KB`)
  assert.ok(totals.constructorJs <= budgets.constructorTotalJs, `Constructor JS: ${totals.constructorJs.toFixed(2)}KB`)
  assert.ok(totals.constructorCss <= budgets.constructorTotalCss, `Constructor CSS: ${totals.constructorCss.toFixed(2)}KB`)
  assert.ok(totals.voiceJs <= budgets.voiceAssistantSdk, `Voice JS: ${totals.voiceJs.toFixed(2)}KB`)
})
