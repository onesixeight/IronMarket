<template>
  <div class="group relative bg-white dark:bg-iron-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 dark:hover:shadow-amber-500/20 hover:-translate-y-1 flex flex-col border border-iron-100/60 dark:border-iron-700/60">
    <router-link :to="'/product/' + product.id" class="block relative overflow-hidden bg-gradient-to-br from-cream-50 to-white dark:from-iron-700 dark:to-iron-800 p-5">
      <img
        :src="product.image"
        :alt="product.name"
        class="w-full h-48 object-contain transition-transform duration-500 ease-out group-hover:scale-[1.08] group-hover:drop-shadow-lg"
        loading="lazy"
      />
      <div v-if="product.badge" class="absolute top-3 left-3 bg-iron-900 dark:bg-amber-600 text-amber-400 dark:text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-sm shadow-lg">
        {{ product.badge }}
      </div>
    </router-link>

    <button
      @click.stop="toggleWishlist"
      class="absolute top-3 right-3 z-10 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
      :class="wished ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white/90 text-iron-300 hover:text-amber-500 hover:bg-white opacity-0 group-hover:opacity-100 hover:scale-110'"
    >
      <svg class="w-4 h-4 transition-transform duration-200" :class="wished ? 'scale-110' : ''" :fill="wished ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
      </svg>
    </button>

    <div class="p-4 flex flex-col flex-1">
      <h3 class="font-body text-[13px] font-semibold text-iron-800 dark:text-cream-100 leading-snug mb-1.5 line-clamp-2 flex-1">
        <router-link :to="'/product/' + product.id" class="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
          {{ product.name }}
        </router-link>
      </h3>

      <div v-if="product.material" class="text-[11px] text-iron-500 dark:text-iron-400 mb-3 font-medium">{{ product.material }}</div>

      <div class="flex items-end justify-between mt-auto pt-3 border-t border-iron-100/60 dark:border-iron-700/60">
        <div>
          <div class="text-lg font-heading font-bold text-iron-900 dark:text-cream-100">{{ product.price.toLocaleString() }} &#8381;</div>
          <div v-if="product.oldPrice" class="text-xs text-iron-400 dark:text-iron-500 line-through mt-0.5">{{ product.oldPrice.toLocaleString() }} &#8381;</div>
        </div>

        <button
          @click="addToCart"
          class="p-2.5 bg-iron-900 dark:bg-amber-600 hover:bg-amber-500 dark:hover:bg-amber-500 text-cream-100 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-amber-500/30"
          title="В корзину"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="added" class="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-lg shadow-amber-500/30 animate-scale-in">
        Добавлено
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useToastStore } from '../stores/toast'

const props = defineProps({
  product: { type: Object, required: true },
})

const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToastStore()
const added = ref(false)

const wished = ref(wishlist.isWished(props.product.id))

function addToCart() {
  cart.addItem(props.product)
  added.value = true
  toast.success(`${props.product.name} — добавлен в корзину`)
  setTimeout(() => { added.value = false }, 1200)
}

function toggleWishlist() {
  wishlist.toggle(props.product)
  wished.value = !wished.value
  if (wished.value) {
    toast.info('Добавлено в избранное')
  }
}
</script>
