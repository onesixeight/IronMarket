<template>
  <div class="py-8" style="background: var(--color-obsidian-900); min-height: 80vh;">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm mb-8">
        <router-link to="/" class="transition-colors duration-200" style="color: var(--color-gold-600);" @mouseenter="$event.target.style.color = 'var(--color-gold-400)'" @mouseleave="$event.target.style.color = 'var(--color-gold-600)'">Главная</router-link>
        <span style="color: var(--color-obsidian-500);">/</span>
        <span style="color: var(--color-cream-100);">Корзина</span>
      </nav>

      <div class="text-center mb-10" v-reveal>
        <h1
          class="ornament-line text-3xl sm:text-4xl font-bold mb-4 justify-center"
          style="font-family: var(--font-heading); color: var(--color-gold-400);"
        >
          Корзина
        </h1>
      </div>

      <div v-if="cart.items.length === 0" class="text-center py-20">
        <svg class="w-20 h-20 mx-auto mb-6" style="color: var(--color-obsidian-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
        <h2
          class="text-2xl font-bold mb-3"
          style="font-family: var(--font-heading); color: var(--color-cream-100); opacity: 0.7;"
        >
          Корзина пуста
        </h2>
        <p class="mb-8 text-base" style="color: var(--color-obsidian-500);">
          Добавьте товары из каталога
        </p>
        <router-link
          to="/catalog"
          class="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          style="border: 1px solid var(--color-gold-400); color: var(--color-gold-400); background: transparent;"
          @mouseenter="$event.currentTarget.style.background = 'var(--color-gold-400)'; $event.currentTarget.style.color = 'var(--color-obsidian-900)'"
          @mouseleave="$event.currentTarget.style.background = 'transparent'; $event.currentTarget.style.color = 'var(--color-gold-400)'"
        >
          Перейти в каталог
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </router-link>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8" v-reveal>
        <div class="lg:col-span-2 space-y-3">
          <div
            v-for="item in cart.items"
            :key="item.id"
            class="flex gap-5 rounded-xl p-4 transition-all duration-300 border"
            style="background: var(--color-obsidian-800); border-color: rgba(201,150,59,0.08);"
            @mouseenter="$event.currentTarget.style.borderColor = 'rgba(201,150,59,0.2)'"
            @mouseleave="$event.currentTarget.style.borderColor = 'rgba(201,150,59,0.08)'"
          >
            <router-link :to="'/product/' + item.id" class="shrink-0">
              <img
                :src="item.image"
                :alt="item.name"
                class="w-20 h-20 object-contain rounded-lg p-2"
                style="background: var(--color-obsidian-700); border: 1px solid rgba(201,150,59,0.06);"
              />
            </router-link>
            <div class="flex-1 min-w-0">
              <router-link
                :to="'/product/' + item.id"
                class="font-medium text-sm line-clamp-1 transition-colors duration-200"
                style="color: var(--color-cream-100);"
                @mouseenter="$event.target.style.color = 'var(--color-gold-300)'"
                @mouseleave="$event.target.style.color = 'var(--color-cream-100)'"
              >
                {{ item.name }}
              </router-link>

              <div v-if="!item.hidePrice" class="font-semibold mt-1 text-sm" style="font-family: var(--font-heading); color: var(--color-gold-400);">
                {{ formatPrice(item.price) }}
              </div>
              <div v-else class="mt-1 text-sm" style="font-family: var(--font-heading); color: var(--color-gold-500);">
                Цена по запросу
              </div>

              <div class="flex items-center gap-3 mt-3">
                <div
                  v-if="!item.hidePrice"
                  class="flex items-center rounded-lg overflow-hidden"
                  style="border: 1px solid rgba(201,150,59,0.15);"
                >
                  <button
                    @click="cart.updateQuantity(item.id, item.quantity - 1)"
                    class="px-3 py-1.5 text-sm transition-colors duration-200"
                    style="color: var(--color-cream-100); opacity: 0.6;"
                    @mouseenter="$event.target.style.background = 'var(--color-obsidian-700)'"
                    @mouseleave="$event.target.style.background = 'transparent'"
                  >
                    −
                  </button>
                  <span
                    class="px-3 py-1.5 text-sm font-medium"
                    style="color: var(--color-cream-100); border-left: 1px solid rgba(201,150,59,0.15); border-right: 1px solid rgba(201,150,59,0.15);"
                  >
                    {{ item.quantity }}
                  </span>
                  <button
                    @click="cart.updateQuantity(item.id, item.quantity + 1)"
                    class="px-3 py-1.5 text-sm transition-colors duration-200"
                    style="color: var(--color-cream-100); opacity: 0.6;"
                    @mouseenter="$event.target.style.background = 'var(--color-obsidian-700)'"
                    @mouseleave="$event.target.style.background = 'transparent'"
                  >
                    +
                  </button>
                </div>

                <span v-if="!item.hidePrice" class="text-sm" style="color: var(--color-cream-100); opacity: 0.5;">
                  {{ formatPrice(item.price * item.quantity) }}
                </span>

                <button
                  @click="cart.removeItem(item.id)"
                  class="ml-auto p-1.5 rounded-lg transition-all duration-200"
                  style="color: var(--color-obsidian-500);"
                  @mouseenter="$event.currentTarget.style.color = '#ef4444'; $event.currentTarget.style.background = 'rgba(239,68,68,0.08)'"
                  @mouseleave="$event.currentTarget.style.color = 'var(--color-obsidian-500)'; $event.currentTarget.style.background = 'transparent'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <button
            @click="cart.clearCart()"
            class="text-sm transition-colors duration-200 mt-2"
            style="color: var(--color-obsidian-500);"
            @mouseenter="$event.target.style.color = '#ef4444'"
            @mouseleave="$event.target.style.color = 'var(--color-obsidian-500)'"
          >
            Очистить корзину
          </button>
        </div>

        <div
          class="rounded-xl p-6 h-fit sticky top-24 border"
          style="background: var(--color-obsidian-800); border-color: rgba(201,150,59,0.1);"
        >
          <h2
            class="text-xl font-bold mb-6"
            style="font-family: var(--font-heading); color: var(--color-cream-100);"
          >
            Итого
          </h2>
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-cream-100); opacity: 0.4;">Товаров</span>
              <span class="font-medium" style="color: var(--color-cream-100);">{{ cart.totalItems }} шт.</span>
            </div>
            <div
              class="pt-3 flex justify-between"
              style="border-top: 1px solid rgba(201,150,59,0.1);"
            >
              <span style="color: var(--color-cream-100); opacity: 0.5;">Сумма</span>
              <span
                class="text-xl font-bold"
                style="font-family: var(--font-heading); color: var(--color-gold-400);"
              >
                {{ formatPrice(cart.totalPrice) }}
              </span>
            </div>
          </div>
          <router-link
            to="/checkout"
            class="shimmer block w-full text-center py-3.5 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style="background: linear-gradient(135deg, #C9A96E, #D4AF37, #C9A96E); color: var(--color-obsidian-900);"
          >
            Оформить заказ
          </router-link>
          <router-link
            to="/catalog"
            class="block w-full text-center py-3 text-sm mt-2 transition-colors duration-200"
            style="color: var(--color-cream-100); opacity: 0.4;"
            @mouseenter="$event.target.style.opacity = '0.7'"
            @mouseleave="$event.target.style.opacity = '0.4'"
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
import { formatPrice } from '../composables/usePrice.js'

useSeo('Корзина', 'Ваша корзина покупок')

const cart = useCartStore()
</script>
