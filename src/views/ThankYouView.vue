<template>
  <div class="min-h-[70vh] flex items-center justify-center">
    <div class="text-center px-4 max-w-lg" v-reveal>
      <div class="w-20 h-20 mx-auto bg-gold-400/10 border border-gold-400/20 rounded-2xl flex items-center justify-center mb-8">
        <svg class="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>

      <h1 class="font-heading text-2xl sm:text-3xl font-bold text-cream-50 mb-4">
        Заказ оформлен
      </h1>
      <p class="text-cream-100/60 mb-2 text-[15px]">
        Мы получили ваш запрос и свяжемся с вами в ближайшее время для уточнения деталей.
      </p>
      <p class="text-cream-100/40 text-sm mb-10">
        Если у вас срочный вопрос — позвоните нам или напишите в мессенджеры.
      </p>

      <div class="flex items-center justify-center gap-4 flex-wrap">
        <router-link
          to="/catalog"
          class="shimmer inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-400 text-obsidian-900 px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
          </svg>
          В каталог
        </router-link>
        <router-link
          to="/contacts"
          class="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300 transition-colors"
        >
          Контакты
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSeo } from '../composables/useSeo'
import { useSchemaOrg, schemaOrganization } from '../composables/useSchemaOrg.js'

useSeo('Заказ оформлен', 'Спасибо за заказ. Мы свяжемся с вами в ближайшее время.')
useSchemaOrg(schemaOrganization)
</script>
