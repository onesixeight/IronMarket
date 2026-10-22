import { createRouter, createWebHistory } from 'vue-router'
import { trackPageView } from '../composables/useAnalytics.js'

const catalogView = () => import('../views/CatalogView.vue')
const categoryView = () => import('../views/CategoryView.vue')

const routes = [
  {
    path: '/constructor',
    name: 'Constructor',
    component: () => import('../views/ConstructorView.vue'),
    meta: { editor: true },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/catalog',
    name: 'Catalog',
    component: catalogView,
  },
  {
    path: '/catalog/page/:page([1-9]\\d*)',
    component: catalogView,
  },
  {
    path: '/catalog/:slug',
    name: 'Category',
    component: categoryView,
  },
  {
    path: '/catalog/:slug/page/:page([1-9]\\d*)',
    component: categoryView,
  },
  {
    path: '/product/:id',
    name: 'Product',
    component: () => import('../views/ProductView.vue'),
  },
  {
    path: '/cart',
    name: 'Cart',
    redirect: '/catalog',
  },
  {
    path: '/checkout',
    name: 'Checkout',
    redirect: '/contacts',
  },
  {
    path: '/thank-you',
    name: 'ThankYou',
    component: () => import('../views/ThankYouView.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/AboutView.vue'),
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: () => import('../views/ContactsView.vue'),
  },
  {
    path: '/delivery',
    name: 'Delivery',
    component: () => import('../views/DeliveryView.vue'),
  },
  {
    path: '/wishlist',
    name: 'Wishlist',
    redirect: '/catalog',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    return { left: 0, top: 0 }
  },
})

// Отправка просмотра страницы в подключенные аналитические системы при навигации SPA.
// trackPageView безопасно no-op, пока аналитика не инициализирована (до consent).
router.afterEach((to) => {
  trackPageView(to.fullPath)
})

export default router
