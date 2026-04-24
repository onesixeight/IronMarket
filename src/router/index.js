import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/catalog',
    name: 'Catalog',
    component: () => import('../views/CatalogView.vue'),
  },
  {
    path: '/catalog/:slug',
    name: 'Category',
    component: () => import('../views/CategoryView.vue'),
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

    return new Promise((resolve) => {
      window.setTimeout(() => {
        resolve({ left: 0, top: 0 })
      }, 0)
    })
  },
})

export default router
