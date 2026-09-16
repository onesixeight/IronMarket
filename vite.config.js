import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const VENDOR_CHUNKS = [
  { name: 'voice-assistant-sdk', packages: ['/node_modules/@elevenlabs/client/', '/node_modules/livekit-client/'] },
  { name: 'vendor-vue', packages: ['/node_modules/vue/', '/node_modules/@vue/'] },
  { name: 'vendor-router', packages: ['/node_modules/vue-router/'] },
  { name: 'vendor-pinia', packages: ['/node_modules/pinia/'] },
]

function getManualChunk(id) {
  const normalizedId = id.replace(/\\/g, '/')

  // Catalogue updates can invalidate data independently of the application code.
  // Keep it inside the total JS budget as well as its own data budget.
  if (normalizedId.endsWith('/src/data/catalog.json')) return 'catalog-data'
  if (normalizedId.endsWith('/src/data/constructor-elements.json')) return 'constructor-data'
  // These route helpers already load together on the homepage. One shared
  // chunk avoids duplicating small chunk/import wrappers across every route.
  if (/\/src\/composables\/use(?:Seo|SchemaOrg|ContactPrefill|ProductInquiry)\.js$/.test(normalizedId)) return 'storefront-shared'

  if (
    normalizedId.includes('/src/constructor/') ||
    normalizedId.includes('/src/components/constructor/') ||
    /\/src\/views\/ConstructorView\.vue(?:\?|$)/.test(normalizedId) ||
    /\/src\/composables\/useConstructor[^/]*\.js$/.test(normalizedId) ||
    /\/src\/assets\/constructor(?:-client)?\.css$/.test(normalizedId)
  ) return 'constructor-editor'

  if (!normalizedId.includes('/node_modules/')) return undefined

  const chunk = VENDOR_CHUNKS.find(({ packages }) => packages.some((packageName) => normalizedId.includes(packageName)))
  return chunk?.name
}

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // Components and Vue dependencies use Composition API; omit the unused
  // Options API runtime. Revisit this flag before adding an Options API library.
  define: { __VUE_OPTIONS_API__: false },
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
        // Shared helpers stay outside the lazy editor; importing one on the
        // storefront must never pull the entire constructor into startup.
        onlyExplicitManualChunks: true,
      },
    },
  },
})
