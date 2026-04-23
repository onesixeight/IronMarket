<template>
  <div class="fixed inset-0 z-[60] flex justify-end">
    <div
      class="absolute inset-0 backdrop-blur-sm bg-[rgba(6,5,4,0.7)]"
      @click="$emit('close')"
    ></div>

    <div
      ref="dialogEl"
      class="relative w-full max-w-md h-full overflow-y-auto shadow-2xl animate-slide-in bg-obsidian-900"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
    >
      <div
        class="sticky top-0 backdrop-blur z-10 p-5 bg-[rgba(10,9,8,0.95)] border-b border-gold-400/10"
      >
        <div class="flex items-center justify-between">
          <h2
            id="cart-title"
            class="text-xl font-bold font-heading text-gold-400"
          >
            Корзина
            <span
              v-if="cart.totalItems > 0"
              class="text-sm font-normal ml-1 text-cream-100/50"
            >
              ({{ cart.totalItems }})
            </span>
          </h2>
          <button
            ref="closeBtnRef"
            @click="$emit('close')"
            aria-label="Закрыть корзину"
            class="p-2 rounded-lg transition-all duration-200 text-cream-100/50 hover:text-cream-100 hover:bg-obsidian-800"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="cart.items.length === 0" class="p-12 text-center">
        <svg class="w-14 h-14 mx-auto mb-4 text-obsidian-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
        </svg>
        <p class="mb-4 text-sm text-cream-100/50">Корзина пуста</p>
        <button
          @click="goToCatalog"
          class="font-medium text-sm transition-colors duration-200 text-gold-400 hover:text-gold-300"
        >
          Перейти в каталог
        </button>
      </div>

      <div v-else>
        <div class="p-4 space-y-3">
          <CartItem
            v-for="item in cart.items"
            :key="item.id"
            :item="item"
            compact
            @close="$emit('close')"
          />
        </div>

        <div
          class="sticky bottom-0 backdrop-blur p-5 bg-[rgba(10,9,8,0.95)] border-t border-gold-400/10"
        >
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm text-cream-100/70">Итого</span>
            <span
              class="text-xl font-bold font-heading text-gold-400"
            >
              {{ formatPrice(cart.totalPrice) }}
            </span>
          </div>
          <router-link
            to="/checkout"
            @click="$emit('close')"
            class="shimmer block w-full text-center py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mb-2 bg-gradient-to-br from-[#C9A96E] via-[#D4AF37] to-[#C9A96E] text-obsidian-900"
          >
            Оформить заказ
          </router-link>
          <router-link
            to="/cart"
            @click="$emit('close')"
            class="block w-full text-center py-2.5 text-sm transition-colors duration-200 text-cream-100/50 hover:text-cream-100/80"
          >
            Перейти в корзину
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { inject, onMounted, onUnmounted, ref } from 'vue'
import { useCartStore } from '../stores/cart'
import { formatPrice } from '../composables/usePrice.js'
import { lockScroll, unlockScroll } from '../composables/useScrollLock.js'
import { isTypingTarget } from '../composables/useUtils.js'
import CartItem from './CartItem.vue'

const emit = defineEmits(['close'])
const router = useRouter()
const cart = useCartStore()
const dialogEl = ref(null)
const closeBtnRef = ref(null)
const cartButtonRef = inject('cartButtonRef', null)

function goToCatalog() {
  emit('close')
  router.push('/catalog')
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    if (isTypingTarget(e.target)) return
    emit('close')
    return
  }
  if (e.key === 'Tab' && dialogEl.value) {
    trapFocus(e)
  }
}

function trapFocus(e) {
  const focusable = dialogEl.value.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault()
      last.focus()
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  lockScroll()
  closeBtnRef.value?.focus()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  unlockScroll()
  cartButtonRef?.value?.focus()
})
</script>

<style scoped>
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
