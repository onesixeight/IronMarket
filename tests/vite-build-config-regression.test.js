import assert from 'node:assert/strict'

import config from '../vite.config.js'

const manualChunks = config.build.rollupOptions.output.manualChunks

assert.equal(
  manualChunks('D:/project/node_modules/vue/dist/vue.runtime.esm-bundler.js'),
  'vendor-vue',
  'Vue runtime should have a stable cache chunk'
)
assert.equal(
  manualChunks('D:/project/node_modules/@vue/shared/dist/shared.esm-bundler.js'),
  'vendor-vue',
  'Vue internal packages should stay with the Vue cache chunk'
)
assert.equal(
  manualChunks('D:/project/node_modules/vue-router/dist/vue-router.mjs'),
  'vendor-router',
  'Vue Router should invalidate separately from Vue runtime'
)
assert.equal(
  manualChunks('D:/project/node_modules/pinia/dist/pinia.mjs'),
  'vendor-pinia',
  'Pinia should invalidate separately from Vue runtime and router'
)
assert.equal(
  manualChunks('D:/project/node_modules/some-package/index.js'),
  undefined,
  'Other dependencies should use normal Rollup chunking instead of creating an empty fallback vendor chunk'
)
assert.equal(manualChunks('D:/project/src/main.js'), undefined, 'App source should use normal route/component chunks')

console.log('ok vite-build-config: split vendor chunks')
