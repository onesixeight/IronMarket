<template>
  <div class="py-8 bg-obsidian-900 min-h-[80vh]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AppBreadcrumb :items="[{ to: '/', label: 'Главная' }, { label: 'Корзина' }]" />

      <div class="text-center mb-10" v-reveal>
        <h1
          class="ornament-line text-3xl sm:text-4xl font-bold mb-4 justify-center font-heading text-gold-400"
        >
          Корзина
        </h1>
      </div>

      <div v-if="cart.items.length === 0" class="text-center py-20">
        <svg class="w-20 h-20 mx-auto mb-6 text-obsidian-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
        <h2
          class="text-2xl font-bold mb-3 font-heading text-cream-100/70"
        >
          Корзина пуста
        </h2>
        <p class="mb-8 text-base text-cream-100/50">
          Добавьте товары из каталога
        </p>
        <router-link
          to="/catalog"
          class="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-gold-400 text-gold-400 bg-transparent hover:bg-gold-400 hover:text-obsidian-900"
        >
          Перейти в каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </router-link>

        <div v-if="featuredProducts.length" class="mt-16 max-w-3xl mx-auto">
          <h3 class="font-heading text-lg font-bold text-cream-100 mb-6">Популярные товары</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <ProductCard
              v-for="p in featuredProducts"
              :key="p.id"
              :product="p"
            />
          </div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8" v-reveal>
        <div class="lg:col-span-2 space-y-3">
          <CartItem v-for="item in cart.items" :key="item.id" :item="item" />

          <button
            @click="cart.clearCart()"
            class="text-sm transition-colors duration-200 mt-2 text-cream-100/50 hover:text-red-500"
          >
            Очистить корзину
          </button>
        </div>

        <div
          class="rounded-xl p-6 h-fit sticky top-24 border bg-obsidian-800 border-gold-400/10"
        >
          <h2
            class="text-xl font-bold mb-6 font-heading text-cream-100"
          >
            Итого
          </h2>
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-cream-100/60">Товаров</span>
              <span class="font-medium text-cream-100">{{ cart.totalItems }} шт.</span>
            </div>
            <div
              class="pt-3 flex justify-between border-t border-gold-400/10"
            >
              <span class="text-cream-100/70">Сумма</span>
              <span
                class="text-xl font-bold font-heading text-gold-400"
              >
                {{ formatPrice(cart.totalPrice) }}
              </span>
            </div>
          </div>
          <router-link
            to="/checkout"
            class="shimmer block w-full text-center py-3.5 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br from-[#C9A96E] via-[#D4AF37] to-[#C9A96E] text-obsidian-900"
          >
            Оформить заказ
          </router-link>
          <router-link
            to="/catalog"
            class="block w-full text-center py-3 text-sm mt-2 transition-colors duration-200 text-cream-100/40 hover:text-cream-100/70"
          >
            Продолжить покупки
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { shallowRef, onMounted } from 'vue'
import { useCartStore } from '../stores/cart'
import { useProductStore } from '../stores/products'
import { useSeo } from '../composables/useSeo'
import { formatPrice } from '../composables/usePrice.js'
import CartItem from '../components/CartItem.vue'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'
import ProductCard from '../components/ProductCard.vue'

useSeo('Корзина', 'Ваша корзина покупок', null, { noindex: true })

const cart = useCartStore()
const productStore = useProductStore()

const featuredProducts = shallowRef([])
onMounted(() => {
  const shuffled = [...productStore.allProducts].sort(() => 0.5 - Math.random())
  featuredProducts.value = shuffled.slice(0, 3)
})
</script>
