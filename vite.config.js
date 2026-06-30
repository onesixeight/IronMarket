import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const VENDOR_CHUNKS = [
  { name: 'vendor-vue', packages: ['/node_modules/vue/', '/node_modules/@vue/'] },
  { name: 'vendor-router', packages: ['/node_modules/vue-router/'] },
  { name: 'vendor-pinia', packages: ['/node_modules/pinia/'] },
]

function getManualChunk(id) {
  const normalizedId = id.replace(/\\/g, '/')

  if (!normalizedId.includes('/node_modules/')) return undefined

  const chunk = VENDOR_CHUNKS.find(({ packages }) => packages.some((packageName) => normalizedId.includes(packageName)))
  return chunk?.name
}

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
})
