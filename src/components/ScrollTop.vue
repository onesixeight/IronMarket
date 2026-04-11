<template>
  <transition name="scroll-top">
    <button
      v-show="visible"
      @click="scrollToTop"
      class="fixed bottom-6 right-6 z-50 w-11 h-11 bg-iron-900 hover:bg-gold-600 text-cream-100 rounded-xl shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
      aria-label="Наверх"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>
      </svg>
    </button>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 400
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.scroll-top-enter-active { animation: fadeIn 0.3s ease; }
.scroll-top-leave-active { animation: fadeIn 0.2s ease reverse; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
