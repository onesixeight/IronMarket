<template>
  <section class="relative h-[75vh] min-h-[550px] max-h-[850px] overflow-hidden bg-iron-900 dark:bg-iron-950">
    <div
      v-for="(slide, i) in slides"
      :key="i"
      v-show="current === i"
      class="absolute inset-0 transition-opacity duration-1000"
      :class="current === i ? 'opacity-100' : 'opacity-0'"
    >
      <div class="absolute inset-0 bg-gradient-to-r from-iron-900 via-iron-900/75 to-iron-900/50 dark:from-iron-950 dark:via-iron-950/75 dark:to-iron-950/50 z-10"></div>
      <img :src="slide.image" :alt="slide.title" class="w-full h-full object-cover scale-105" />
    </div>

    <div class="absolute inset-0 z-10 opacity-[0.03]" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 40px, currentColor 40px, currentColor 41px);"></div>

    <div class="relative z-20 h-full flex items-center">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div class="max-w-2xl">
          <div class="inline-block bg-amber-500/10 border border-amber-400/20 text-amber-400 dark:text-amber-400 text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 rounded-sm mb-6 shadow-lg shadow-amber-500/20">
            {{ slides[current]?.tag }}
          </div>
          <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-cream-100 dark:text-cream-100 mb-6 leading-[1.1]">
            {{ slides[current]?.title }}
          </h1>
          <p class="text-base sm:text-lg text-iron-300 dark:text-iron-400 mb-10 leading-relaxed max-w-lg">
            {{ slides[current]?.subtitle }}
          </p>
          <div class="flex flex-wrap gap-3">
            <router-link
              to="/catalog"
              class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-iron-900 px-7 py-3.5 rounded-xl font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]"
            >
              Каталог продукции
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </router-link>
            <router-link
              to="/contacts"
              class="inline-flex items-center gap-2 bg-white/5 dark:bg-iron-800/50 backdrop-blur-md border border-white/10 dark:border-iron-700 hover:bg-white/10 dark:hover:bg-iron-800/70 hover:border-white/20 dark:hover:border-iron-600 text-cream-200 dark:text-cream-100 px-7 py-3.5 rounded-xl font-semibold transition-all duration-200"
            >
              Связаться с нами
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
      <button
        v-for="(_, i) in slides"
        :key="i"
        @click="current = i"
        class="h-2 rounded-full transition-all duration-500"
        :class="current === i ? 'bg-amber-400 w-10 shadow-lg shadow-amber-400/30' : 'bg-white/20 dark:bg-white/10 w-5 hover:bg-white/40 dark:hover:bg-white/20'"
      />
    </div>

    <button
      @click="prev"
      class="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-3.5 bg-white/5 dark:bg-iron-800/50 backdrop-blur-md border border-white/10 dark:border-iron-700 hover:bg-white/10 dark:hover:bg-iron-800/70 hover:border-white/20 dark:hover:border-iron-600 rounded-xl text-cream-200 dark:text-cream-100 transition-all hover:scale-110 active:scale-95"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
      </svg>
    </button>
    <button
      @click="next"
      class="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-3.5 bg-white/5 dark:bg-iron-800/50 backdrop-blur-md border border-white/10 dark:border-iron-700 hover:bg-white/10 dark:hover:bg-iron-800/70 hover:border-white/20 dark:hover:border-iron-600 rounded-xl text-cream-200 dark:text-cream-100 transition-all hover:scale-110 active:scale-95"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
      </svg>
    </button>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const current = ref(0)
let timer = null

const slides = [
  {
    tag: 'Производство ковки',
    title: 'Кованые изделия от производителя',
    subtitle: 'Широкий ассортимент декоративных элементов и узоров для заборов, ворот, лестниц и ограждений.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80',
  },
  {
    tag: 'Декор и узоры',
    title: 'Короны и узоры на ворота',
    subtitle: 'Создайте уникальный дизайн входной группы с нашими коваными элементами.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80',
  },
  {
    tag: 'Доставка',
    title: 'Доставка по всей России',
    subtitle: 'Быстрая и надёжная доставка кованых изделий в любой регион.',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
  },
]

function next() {
  current.value = (current.value + 1) % slides.length
}
function prev() {
  current.value = (current.value - 1 + slides.length) % slides.length
}

onMounted(() => {
  timer = setInterval(next, 6000)
})
onUnmounted(() => {
  clearInterval(timer)
})
</script>
