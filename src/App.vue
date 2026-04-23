<template>
  <div class="site-shell min-h-screen flex flex-col">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:bg-gold-400 focus:text-obsidian-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold">Перейти к основному содержимому</a>
    <div class="site-ambience" aria-hidden="true">
      <div class="ambient-orb ambient-orb-left"></div>
      <div class="ambient-orb ambient-orb-right"></div>
      <div class="ambient-grid"></div>
      <div class="ambient-noise"></div>
    </div>

    <AppHeader />

    <main id="main-content" class="relative z-10 flex-1">
      <router-view v-slot="{ Component, route }">
        <transition name="page">
          <component :is="Component" :key="route.name" />
        </transition>
      </router-view>
    </main>

    <AppFooter />
    <Transition name="slide">
      <CartDrawer v-if="cartOpen" @close="cartOpen = false" />
    </Transition>
    <ToastContainer />
    <ScrollTop />
    <FloatingMessenger />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import CartDrawer from './components/CartDrawer.vue'
import ToastContainer from './components/ToastContainer.vue'
import ScrollTop from './components/ScrollTop.vue'
import FloatingMessenger from './components/FloatingMessenger.vue'

const cartOpen = ref(false)
provide('cartOpen', cartOpen)

onMounted(() => {
  const preloader = document.getElementById('preloader')
  if (preloader) {
    preloader.style.opacity = '0'
    setTimeout(() => {
      preloader.style.visibility = 'hidden'
    }, 400)
  }
})
</script>
