<template>
  <div
    :class="compact
      ? 'flex gap-3 p-3 rounded-xl bg-obsidian-800 border border-gold-400/[0.06]'
      : 'flex gap-5 rounded-xl p-4 transition-all duration-300 border border-gold-400/[0.08] hover:border-gold-400/20 bg-obsidian-800'"
  >
    <router-link :to="'/product/' + item.id" @click="compact && $emit('close')">
      <img
        :src="item.image"
        :alt="item.name"
        loading="lazy"
        :class="compact
          ? 'w-16 h-16 p-1 object-contain rounded-lg bg-obsidian-700'
          : 'w-20 h-20 p-2 object-contain rounded-lg bg-obsidian-700 border border-gold-400/[0.06]'"
      />
    </router-link>

    <div class="flex-1 min-w-0">
      <component
        :is="compact ? 'h3' : 'router-link'"
        :to="compact ? undefined : '/product/' + item.id"
        :class="compact
          ? 'text-xs font-medium line-clamp-2'
          : 'font-medium text-sm line-clamp-1 transition-colors duration-200 hover:text-gold-300'"
        class="text-cream-100"
      >
        {{ item.name }}
      </component>

      <div v-if="!item.hidePrice" class="mt-1 text-sm font-semibold font-heading text-gold-400">
        {{ formatPrice(item.price) }}
      </div>
      <div v-else class="mt-1 text-sm font-heading text-gold-500">
        Цена по запросу
      </div>

      <div class="flex items-center gap-2 mt-2" :class="!compact && 'gap-3 mt-3'">
        <template v-if="!item.hidePrice">
          <div
            v-if="!compact"
            class="flex items-center rounded-lg overflow-hidden border border-gold-400/15"
          >
            <button
              @click="cart.updateQuantity(item.id, item.quantity - 1)"
              aria-label="Уменьшить количество"
              class="px-3 py-1.5 text-sm transition-colors duration-200 text-cream-100/60 hover:bg-obsidian-700"
            >
              −
            </button>
            <span class="px-3 py-1.5 text-sm font-medium text-cream-100 border-x border-gold-400/15">
              {{ item.quantity }}
            </span>
            <button
              @click="cart.updateQuantity(item.id, item.quantity + 1)"
              aria-label="Увеличить количество"
              class="px-3 py-1.5 text-sm transition-colors duration-200 text-cream-100/60 hover:bg-obsidian-700"
            >
              +
            </button>
          </div>

          <template v-if="compact">
            <button @click="cart.updateQuantity(item.id, item.quantity - 1)" aria-label="Уменьшить количество" class="qty-btn">
              −
            </button>
            <span class="text-xs w-6 text-center font-medium text-cream-100">
              {{ item.quantity }}
            </span>
            <button @click="cart.updateQuantity(item.id, item.quantity + 1)" aria-label="Увеличить количество" class="qty-btn">
              +
            </button>
          </template>

          <span v-if="!compact" class="text-sm text-cream-100/50">
            {{ formatPrice(item.price * item.quantity) }}
          </span>
        </template>

        <button
          @click="cart.removeItem(item.id)"
          aria-label="Удалить из корзины"
          :class="compact
            ? 'ml-auto transition-colors duration-200 text-obsidian-500 hover:text-red-500'
            : 'ml-auto p-1.5 rounded-lg transition-all duration-200 text-obsidian-500 hover:text-red-500 hover:bg-red-500/10'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '../stores/cart'
import { formatPrice } from '../composables/usePrice.js'

defineProps({
  item: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

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
</style>
