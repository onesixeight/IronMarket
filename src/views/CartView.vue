<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm text-iron-400 mb-8">
        <router-link to="/" class="hover:text-gold-500 transition-colors">Главная</router-link>
        <span>/</span>
        <span class="text-iron-700">Корзина</span>
      </nav>

      <div class="text-center mb-10" v-reveal>
        <h1 class="ornament-line font-heading text-3xl sm:text-4xl font-semibold text-iron-900 mb-4">Корзина</h1>
      </div>

      <div v-if="cart.items.length === 0" class="text-center py-20 animate-fade-in">
        <svg class="w-20 h-20 mx-auto text-iron-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
        <h2 class="font-heading text-2xl font-semibold text-iron-700 mb-3">Корзина пуста</h2>
        <p class="text-iron-400 mb-8 text-[15px]">Добавьте товары из каталога</p>
        <router-link to="/catalog" class="inline-flex items-center gap-2 bg-iron-900 hover:bg-gold-600 text-cream-100 px-8 py-3 rounded-xl font-medium transition-all duration-200">
          Перейти в каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
        </router-link>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8" v-reveal>
        <div class="lg:col-span-2 space-y-3">
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="flex gap-5 bg-white rounded-xl border border-iron-100/60 p-4 transition-all duration-200 hover:shadow-sm"
          >
            <router-link :to="'/product/' + item.id" class="shrink-0">
              <img :src="item.image" :alt="item.name" class="w-20 h-20 object-contain bg-cream-50/80 rounded-lg p-2 border border-iron-100/40" />
            </router-link>
            <div class="flex-1 min-w-0">
              <router-link :to="'/product/' + item.id" class="font-medium text-iron-800 hover:text-gold-600 transition-colors text-sm line-clamp-1">
                {{ item.name }}
              </router-link>
              <div class="text-gold-600 font-semibold mt-1 text-sm">{{ item.price.toLocaleString() }} &#8381;</div>
              <div class="flex items-center gap-3 mt-3">
                <div class="flex items-center border border-iron-100 rounded-lg overflow-hidden">
                  <button @click="cart.updateQuantity(item.id, item.quantity - 1)" class="px-3 py-1.5 text-iron-500 hover:bg-cream-50 transition-colors text-sm">−</button>
                  <span class="px-3 py-1.5 text-sm font-medium border-x border-iron-100">{{ item.quantity }}</span>
                  <button @click="cart.updateQuantity(item.id, item.quantity + 1)" class="px-3 py-1.5 text-iron-500 hover:bg-cream-50 transition-colors text-sm">+</button>
                </div>
                <span class="text-sm text-iron-500">{{ (item.price * item.quantity).toLocaleString() }} &#8381;</span>
                <button @click="cart.removeItem(item.id)" class="ml-auto p-1.5 text-iron-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <button @click="cart.clearCart()" class="text-sm text-iron-400 hover:text-red-500 transition-colors mt-2">
            Очистить корзину
          </button>
        </div>

        <div class="bg-white rounded-xl border border-iron-100/60 p-6 h-fit sticky top-24">
          <h2 class="font-heading text-xl font-semibold text-iron-900 mb-6">Итого</h2>
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-sm">
              <span class="text-iron-400">Товаров</span>
              <span class="text-iron-800 font-medium">{{ cart.totalItems }} шт.</span>
            </div>
            <div class="border-t border-iron-100/60 pt-3 flex justify-between">
              <span class="text-iron-500">Сумма</span>
              <span class="text-xl font-heading font-bold text-iron-900">{{ cart.totalPrice.toLocaleString() }} &#8381;</span>
            </div>
          </div>
          <router-link
            to="/checkout"
            class="block w-full bg-iron-900 hover:bg-gold-600 text-cream-100 text-center py-3.5 rounded-xl font-medium transition-all duration-200"
          >
            Оформить заказ
          </router-link>
          <router-link
            to="/catalog"
            class="block w-full text-center py-3 text-iron-400 hover:text-iron-600 text-sm mt-2 transition-colors"
          >
            Продолжить покупки
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '../stores/cart'
import { useSeo } from '../composables/useSeo'
useSeo('Корзина', 'Ваша корзина покупок')
const cart = useCartStore()
</script>
