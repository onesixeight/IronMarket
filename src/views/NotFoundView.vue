<template>
  <div class="min-h-[70vh] flex items-center justify-center">
    <div class="text-center animate-fade-up px-4">
      <div class="font-heading text-[8rem] sm:text-[10rem] lg:text-[12rem] font-bold text-gold-400 leading-none mb-4 drop-shadow-[0_0_80px_rgba(201,150,59,0.15)]">
        404
      </div>
      <h1 class="font-heading text-2xl sm:text-3xl font-bold text-cream-50 mb-4">Страница не найдена</h1>
      <p class="text-cream-100/60 mb-10 text-[15px] max-w-md mx-auto">
        Запрашиваемая страница не существует или была удалена. Попробуйте вернуться на главную.
      </p>
      <div class="flex items-center justify-center gap-4 flex-wrap">
        <router-link to="/" class="shimmer inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-400 text-obsidian-900 px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
          На главную
        </router-link>
        <router-link to="/catalog" class="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300 transition-colors">
          Каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSeo } from '../composables/useSeo'
useSeo('Страница не найдена', 'Запрашиваемая страница не существует или была удалена.')
</script>
