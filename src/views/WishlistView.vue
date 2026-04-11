<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm text-iron-400 mb-8">
        <router-link to="/" class="hover:text-gold-500 transition-colors">Главная</router-link>
        <span class="text-iron-300">/</span>
        <span class="text-iron-700">Избранное</span>
      </nav>

      <div class="text-center mb-10" v-reveal>
        <h1 class="ornament-line font-heading text-3xl sm:text-4xl font-semibold text-iron-900 mb-4">Избранное</h1>
        <p class="text-iron-500 max-w-xl mx-auto text-[15px]">Товары, которые вам понравились</p>
      </div>

      <div v-if="wishlist.items.length === 0" class="text-center py-20" v-reveal>
        <svg class="w-20 h-20 mx-auto text-iron-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
        </svg>
        <h2 class="font-heading text-2xl font-semibold text-iron-700 mb-3">Список избранного пуст</h2>
        <p class="text-iron-400 mb-8 text-[15px]">Нажмите сердечко на товаре, чтобы добавить</p>
        <router-link to="/catalog" class="inline-flex items-center gap-2 bg-iron-900 hover:bg-gold-600 text-cream-100 px-8 py-3 rounded-xl font-medium transition-all duration-200">
          Перейти в каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </router-link>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ProductCard
          v-for="p in wishlist.items"
          :key="p.id"
          :product="p"
        />
      </div>

      <div v-if="wishlist.items.length > 0" class="text-center mt-8">
        <button @click="wishlist.clear()" class="text-sm text-iron-400 hover:text-red-500 transition-colors">
          Очистить список избранного
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useWishlistStore } from '../stores/wishlist'
import ProductCard from '../components/ProductCard.vue'
import { useSeo } from '../composables/useSeo'
import { useBreadcrumbs } from '../composables/useBreadcrumbs'

useSeo('Избранное', 'Список избранных товаров')
const wishlist = useWishlistStore()
</script>
