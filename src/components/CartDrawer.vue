<template>
  <div class="fixed inset-0 z-[60] flex justify-end">
    <div class="absolute inset-0 bg-iron-900/60 dark:bg-black/70 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative w-full max-w-md bg-white dark:bg-iron-900 h-full overflow-y-auto shadow-2xl animate-slide-in">
      <div class="sticky top-0 bg-white/95 dark:bg-iron-900/95 backdrop-blur z-10 p-5 border-b border-iron-100/60 dark:border-iron-800">
        <div class="flex items-center justify-between">
          <h2 class="font-heading text-xl font-semibold text-iron-900 dark:text-cream-100">Корзина</h2>
          <button @click="$emit('close')" class="p-2 text-iron-400 dark:text-iron-400 hover:text-iron-700 dark:hover:text-cream-100 transition-colors rounded-lg hover:bg-iron-50 dark:hover:bg-iron-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="cart.items.length === 0" class="p-12 text-center">
        <svg class="w-14 h-14 mx-auto text-iron-200 dark:text-iron-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
        <p class="text-iron-500 dark:text-iron-400 mb-4 text-sm">Корзина пуста</p>
        <button @click="$emit('close'); $router.push('/catalog')" class="text-gold-700 dark:text-amber-500 hover:text-gold-600 dark:hover:text-amber-400 font-medium text-sm">
          Перейти в каталог
        </button>
      </div>

      <div v-else>
        <div class="p-4 space-y-3">
          <div v-for="item in cart.items" :key="item.id" class="flex gap-3 p-3 bg-cream-50 dark:bg-iron-800 rounded-xl">
            <router-link :to="'/product/' + item.id">
              <img :src="item.image" :alt="item.name" class="w-16 h-16 object-contain rounded-lg bg-white dark:bg-iron-700 p-1" />
            </router-link>
            <div class="flex-1 min-w-0">
              <h3 class="text-xs font-medium text-iron-800 dark:text-cream-100 line-clamp-2">{{ item.name }}</h3>
              <div class="mt-1 text-sm font-heading font-semibold text-gold-700 dark:text-amber-400">{{ item.price.toLocaleString() }} &#8381;</div>
              <div class="flex items-center gap-2 mt-2">
                <button @click="cart.updateQuantity(item.id, item.quantity - 1)" class="qty-btn">-</button>
                <span class="text-xs w-6 text-center font-medium text-iron-700 dark:text-cream-100">{{ item.quantity }}</span>
                <button @click="cart.updateQuantity(item.id, item.quantity + 1)" class="qty-btn">+</button>
                <button @click="cart.removeItem(item.id)" class="ml-auto text-iron-300 dark:text-iron-400 hover:text-red-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="sticky bottom-0 bg-white/95 dark:bg-iron-900/95 backdrop-blur border-t border-iron-100/60 dark:border-iron-800 p-5">
          <div class="flex justify-between items-center mb-4">
            <span class="text-iron-500 dark:text-iron-400 text-sm">Итого</span>
            <span class="text-xl font-heading font-semibold text-iron-900 dark:text-cream-100">{{ cart.totalPrice.toLocaleString() }} &#8381;</span>
          </div>
          <router-link to="/checkout" @click="$emit('close')" class="block w-full bg-iron-900 dark:bg-amber-600 hover:bg-iron-800 dark:hover:bg-amber-500 text-cream-100 text-center py-3 rounded-xl font-medium text-sm transition-all mb-2">
            Оформить заказ
          </router-link>
          <router-link to="/cart" @click="$emit('close')" class="block w-full text-center py-2.5 text-iron-500 dark:text-iron-400 hover:text-iron-700 dark:hover:text-iron-300 text-sm transition-colors">
            Перейти в корзину
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '../stores/cart'
defineEmits(['close'])
const cart = useCartStore()
</script>

<style scoped>
.qty-btn {
  width: 1.5rem; height: 1.5rem;
  border-radius: 0.375rem;
  border: 1px solid var(--color-iron-200);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-iron-600);
  font-size: 0.75rem; font-weight: 600;
  transition: background-color 0.15s;
}
.qty-btn:hover { background: var(--color-iron-100); }
:deep(html[data-theme="dark"]) .qty-btn {
  border-color: var(--color-iron-600);
  color: var(--color-iron-300);
}
:deep(html[data-theme="dark"]) .qty-btn:hover {
  background: var(--color-iron-700);
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in {
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
