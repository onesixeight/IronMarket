<template>
  <div class="fixed inset-0 z-[60] flex justify-end">
    <div
      class="absolute inset-0 backdrop-blur-sm"
      style="background: rgba(6,5,4,0.7);"
      @click="$emit('close')"
    ></div>

    <div
      class="relative w-full max-w-md h-full overflow-y-auto shadow-2xl animate-slide-in"
      style="background: var(--color-obsidian-900);"
    >
      <div
        class="sticky top-0 backdrop-blur z-10 p-5"
        style="background: rgba(10,9,8,0.95); border-bottom: 1px solid rgba(201,150,59,0.1);"
      >
        <div class="flex items-center justify-between">
          <h2
            class="text-xl font-bold"
            style="font-family: var(--font-heading); color: var(--color-gold-400);"
          >
            Корзина
            <span
              v-if="cart.totalItems > 0"
              class="text-sm font-normal ml-1"
              style="color: var(--color-cream-100); opacity: 0.5;"
            >
              ({{ cart.totalItems }})
            </span>
          </h2>
          <button
            @click="$emit('close')"
            class="p-2 rounded-lg transition-all duration-200"
            style="color: var(--color-cream-100); opacity: 0.5;"
            @mouseenter="$event.currentTarget.style.opacity = '1'; $event.currentTarget.style.background = 'var(--color-obsidian-800)'"
            @mouseleave="$event.currentTarget.style.opacity = '0.5'; $event.currentTarget.style.background = 'transparent'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="cart.items.length === 0" class="p-12 text-center">
        <svg class="w-14 h-14 mx-auto mb-4" style="color: var(--color-obsidian-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
        <p class="mb-4 text-sm" style="color: var(--color-cream-100); opacity: 0.5;">Корзина пуста</p>
        <button
          @click="$emit('close'); $router.push('/catalog')"
          class="font-medium text-sm transition-colors duration-200"
          style="color: var(--color-gold-400);"
          @mouseenter="$event.target.style.color = 'var(--color-gold-300)'"
          @mouseleave="$event.target.style.color = 'var(--color-gold-400)'"
        >
          Перейти в каталог
        </button>
      </div>

      <div v-else>
        <div class="p-4 space-y-3">
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="flex gap-3 p-3 rounded-xl"
            style="background: var(--color-obsidian-800); border: 1px solid rgba(201,150,59,0.06);"
          >
            <router-link :to="'/product/' + item.id" @click="$emit('close')">
              <img
                :src="item.image"
                :alt="item.name"
                class="w-16 h-16 object-contain rounded-lg p-1"
                style="background: var(--color-obsidian-700);"
              />
            </router-link>
            <div class="flex-1 min-w-0">
              <h3
                class="text-xs font-medium line-clamp-2"
                style="color: var(--color-cream-100);"
              >
                {{ item.name }}
              </h3>

              <div v-if="!item.hidePrice" class="mt-1 text-sm font-semibold" style="font-family: var(--font-heading); color: var(--color-gold-400);">
                {{ formatPrice(item.price) }}
              </div>
              <div v-else class="mt-1 text-sm" style="font-family: var(--font-heading); color: var(--color-gold-500);">
                Цена по запросу
              </div>

              <div class="flex items-center gap-2 mt-2">
                <button
                  v-if="!item.hidePrice"
                  @click="cart.updateQuantity(item.id, item.quantity - 1)"
                  class="qty-btn"
                >
                  -
                </button>
                <span
                  v-if="!item.hidePrice"
                  class="text-xs w-6 text-center font-medium"
                  style="color: var(--color-cream-100);"
                >
                  {{ item.quantity }}
                </span>
                <button
                  v-if="!item.hidePrice"
                  @click="cart.updateQuantity(item.id, item.quantity + 1)"
                  class="qty-btn"
                >
                  +
                </button>
                <button
                  @click="cart.removeItem(item.id)"
                  class="ml-auto transition-colors duration-200"
                  style="color: var(--color-obsidian-500);"
                  @mouseenter="$event.target.style.color = '#ef4444'"
                  @mouseleave="$event.target.style.color = 'var(--color-obsidian-500)'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          class="sticky bottom-0 backdrop-blur p-5"
          style="background: rgba(10,9,8,0.95); border-top: 1px solid rgba(201,150,59,0.1);"
        >
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm" style="color: var(--color-cream-100); opacity: 0.5;">Итого</span>
            <span
              class="text-xl font-bold"
              style="font-family: var(--font-heading); color: var(--color-gold-400);"
            >
              {{ formatPrice(cart.totalPrice) }}
            </span>
          </div>
          <router-link
            to="/checkout"
            @click="$emit('close')"
            class="shimmer block w-full text-center py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mb-2"
            style="background: linear-gradient(135deg, #C9A96E, #D4AF37, #C9A96E); color: var(--color-obsidian-900);"
          >
            Оформить заказ
          </router-link>
          <router-link
            to="/cart"
            @click="$emit('close')"
            class="block w-full text-center py-2.5 text-sm transition-colors duration-200"
            style="color: var(--color-cream-100); opacity: 0.4;"
            @mouseenter="$event.target.style.opacity = '0.7'"
            @mouseleave="$event.target.style.opacity = '0.4'"
          >
            Перейти в корзину
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '../stores/cart'
import { formatPrice } from '../composables/usePrice.js'

defineEmits(['close'])

const cart = useCartStore()
</script>

<style scoped>
.qty-btn {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(201, 150, 59, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gold-400);
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.15s;
  background: transparent;
}
.qty-btn:hover {
  background: rgba(201, 150, 59, 0.1);
  border-color: rgba(201, 150, 59, 0.4);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
.animate-slide-in {
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
