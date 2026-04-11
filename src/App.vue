<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
    <AppFooter />
    <CartDrawer v-if="cartOpen" @close="cartOpen = false" />
    <ToastContainer />
    <ScrollTop />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import CartDrawer from './components/CartDrawer.vue'
import ToastContainer from './components/ToastContainer.vue'
import ScrollTop from './components/ScrollTop.vue'

const cartOpen = ref(false)
provide('cartOpen', cartOpen)

onMounted(() => {
  const preloader = document.getElementById('preloader')
  if (preloader) {
    preloader.style.opacity = '0'
    setTimeout(() => preloader.remove(), 400)
  }
})
</script>
