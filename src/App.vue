<template>
  <div class="site-shell min-h-screen flex flex-col">
    <div class="site-ambience" aria-hidden="true">
      <div class="ambient-orb ambient-orb-left"></div>
      <div class="ambient-orb ambient-orb-right"></div>
      <div class="ambient-grid"></div>
      <div class="ambient-noise"></div>
    </div>

    <AppHeader />

    <main class="relative z-10 flex-1">
      <router-view v-slot="{ Component, route }">
        <transition name="page">
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
