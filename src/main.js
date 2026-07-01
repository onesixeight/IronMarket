import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { provideRecentlyViewed } from './composables/useRecentlyViewed.js'
import { vReveal } from './composables/useScrollReveal'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
provideRecentlyViewed(app)
app.directive('reveal', vReveal)

router.isReady().then(() => {
  app.mount('#app')
})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
