import assert from 'node:assert/strict'

import config from '../vite.config.js'

const manualChunks = config.build.rollupOptions.output.manualChunks
assert.equal(config.define.__VUE_OPTIONS_API__, false, 'The Composition API app should omit unused Options API support')

assert.equal(manualChunks('D:/project/src/data/catalog.json'), 'catalog-data')
assert.equal(manualChunks('D:\\project\\src\\data\\catalog.json'), 'catalog-data')
assert.equal(manualChunks('D:/project/src/data/constructor-elements.json'), 'constructor-data')
for (const moduleId of [
  'src/views/ConstructorView.vue',
  'src/components/constructor/ConstructorCanvas.vue',
  'src/components/constructor/ConstructorCanvas.vue?vue&type=style&index=0&lang.css',
  'src/constructor/model.js',
  'src/composables/useConstructor.js',
  'src/composables/useConstructorDialog.js',
  'src/assets/constructor.css',
  'src/assets/constructor-client.css',
]) {
  assert.equal(manualChunks(`D:/project/${moduleId}`), 'constructor-editor', moduleId)
}
assert.equal(manualChunks('D:/project/src/composables/useSeo.js'), 'storefront-shared', 'Shared route helpers must stay outside the editor')
assert.equal(manualChunks('D:/project/node_modules/livekit-client/dist/livekit-client.esm.mjs'), 'voice-assistant-sdk', 'Explicit chunking must keep the voice SDK transport out of storefront precaching')
assert.equal(manualChunks('\u0000plugin-vue:export-helper'), undefined, 'Vue export helpers must remain shareable by storefront chunks')
assert.equal(config.build.rollupOptions.output.onlyExplicitManualChunks, true, 'Manual editor chunks must not pull in shared dependencies')
assert.equal(config.build.manifest, true, 'Artifact verification needs the actual static and dynamic chunk graph')

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
