import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { vReveal } from './composables/useScrollReveal'
import { useAdminStore } from './stores/admin'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.directive('reveal', vReveal)

const adminStore = useAdminStore()
adminStore.initAdminProducts()

app.mount('#app')
