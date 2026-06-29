import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Выносим фреймворк (vue, vue-router, pinia) в стабильный чанк vendor,
        // чтобы он кэшировался отдельно от кода приложения. Затрагивает только
        // production-сборку; dev-сервер и HMR не меняются.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
