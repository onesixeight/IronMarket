<template>
  <div class="py-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AppBreadcrumb :items="[{ to: '/', label: 'Главная' }, { label: 'Избранное' }]" />

      <div class="text-center mb-14" v-reveal>
        <h1 class="ornament-line font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-cream-50 mb-6">Избранное</h1>
        <p class="text-cream-100/70 max-w-xl mx-auto text-[15px]" v-if="wishlist.items.length > 0">
          {{ wishlist.items.length }} {{ pluralize(wishlist.items.length) }}
        </p>
      </div>

      <div v-if="wishlist.items.length === 0" class="text-center py-24" v-reveal>
        <div class="w-20 h-20 mx-auto bg-obsidian-800 border border-obsidian-600/50 rounded-2xl flex items-center justify-center mb-8">
          <svg class="w-10 h-10 text-obsidian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
          </svg>
        </div>
        <h2 class="font-heading text-2xl font-bold text-cream-50 mb-3">Список избранного пуст</h2>
        <p class="text-cream-100/60 mb-8 text-[15px]">Нажмите сердечко на товаре, чтобы добавить</p>
        <router-link to="/catalog" class="shimmer inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-400 text-obsidian-900 px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25">
          Перейти в каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </router-link>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            v-for="p in wishlist.items"
            :key="p.id"
            :product="p"
          />
        </div>

        <div class="text-center mt-10">
          <button @click="wishlist.clear()" class="text-sm text-cream-100/40 hover:text-red-400 transition-colors duration-200">
            Очистить список избранного
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useWishlistStore } from '../stores/wishlist'
import ProductCard from '../components/ProductCard.vue'
import { useSeo } from '../composables/useSeo'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'

useSeo('Избранное', 'Список избранных товаров')

const wishlist = useWishlistStore()

function pluralize(n) {
  const mod = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return 'товаров'
  if (mod === 1) return 'товар'
  if (mod >= 2 && mod <= 4) return 'товара'
  return 'товаров'
}
</script>
