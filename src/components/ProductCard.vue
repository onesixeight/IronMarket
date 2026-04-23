<template>
  <article class="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-gold-400/10 bg-obsidian-900/82 shadow-[0_24px_60px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:-translate-y-1">
    <router-link :to="'/product/' + product.id" class="relative block overflow-hidden rounded-t-[1.75rem] aspect-[4/3] bg-[radial-gradient(circle_at_top,rgba(201,150,59,0.14),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(10,9,8,0.02))]">
      <img
        :src="product.image"
        :alt="product.name"
        class="absolute inset-0 h-full w-full object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        loading="lazy"
      />
      <div v-if="product.badge" class="absolute left-4 top-4 rounded-full border border-gold-400/18 bg-obsidian-950/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
        {{ product.badge }}
      </div>
    </router-link>

    <button
      class="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/12 bg-obsidian-950/70 text-cream-100/70 transition-all duration-200 hover:border-gold-400/30 hover:text-gold-300"
      :aria-label="wished ? 'Убрать из избранного' : 'Добавить в избранное'"
      @click.stop="toggleWishlist"
    >
      <svg class="h-4 w-4" :fill="wished ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>

    <div class="flex flex-1 flex-col px-5 pb-5 pt-4">
      <h3 class="min-h-[2.8rem] text-[15px] font-semibold leading-snug text-cream-100">
        <router-link :to="'/product/' + product.id" class="transition-colors duration-200 hover:text-gold-300">
          {{ product.name }}
        </router-link>
      </h3>

      <p v-if="product.material" class="mt-3 text-sm text-cream-100/46">
        {{ product.material }}
      </p>

      <div class="mt-auto flex items-end justify-between gap-3 border-t border-gold-400/10 pt-5">
        <div v-if="!product.hidePrice">
          <div class="mb-1 text-[11px] uppercase tracking-[0.16em] text-cream-100/34">Стоимость</div>
          <div class="font-heading text-2xl text-gold-300">{{ formatPrice(product.price) }}</div>
          <div v-if="product.oldPrice" class="mt-1 text-xs line-through text-cream-100/32">
            {{ formatPrice(product.oldPrice) }}
          </div>
        </div>

        <div v-else>
          <div class="mb-1 text-[11px] uppercase tracking-[0.16em] text-cream-100/34">Стоимость</div>
          <div class="font-heading text-lg text-gold-300">По запросу</div>
        </div>

        <button
          v-if="!product.hidePrice"
          ref="addToCartBtn"
          aria-label="Добавить в корзину"
          class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-obsidian-950 transition-transform duration-200 hover:scale-105 active:scale-95"
          title="В корзину"
          @click="addToCart"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.7">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        <router-link
          v-else
          :to="'/product/' + product.id"
          class="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-400/18 bg-obsidian-950/70 text-gold-300 transition-transform duration-200 hover:scale-105 active:scale-95"
          title="Подробнее"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.7">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </router-link>
      </div>
    </div>

    <transition name="fade">
      <div v-if="added" class="absolute right-4 top-4 z-20 animate-scale-in rounded-full bg-gold-400 px-3 py-1.5 text-xs font-bold text-obsidian-950 shadow-lg shadow-gold-400/30">
        Добавлено
      </div>
    </transition>
  </article>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { formatPrice } from '../composables/usePrice.js'
import { useFlyToCart } from '../composables/useFlyToCart.js'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'
import { useWishlistStore } from '../stores/wishlist'

const props = defineProps({
  product: { type: Object, required: true },
})

const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToastStore()
const { flyFromElement } = useFlyToCart()
const addToCartBtn = ref(null)
const added = ref(false)
const wished = computed(() => wishlist.isWished(props.product.id))

let addTimer = null

function addToCart() {
  cart.addItem(props.product)
  added.value = true
  toast.success(`${props.product.name} добавлен в корзину`)
  flyFromElement(addToCartBtn.value)
  if (addTimer) clearTimeout(addTimer)
  addTimer = window.setTimeout(() => {
    added.value = false
  }, 1200)
}

onUnmounted(() => {
  if (addTimer) clearTimeout(addTimer)
})

function toggleWishlist() {
  const wasWished = wishlist.isWished(props.product.id)
  wishlist.toggle(props.product)
  toast.info(wasWished ? 'Удалено из избранного' : 'Добавлено в избранное')
}
</script>
