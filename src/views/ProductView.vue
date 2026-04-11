<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm text-iron-400 mb-8">
        <router-link to="/" class="hover:text-gold-500 transition-colors">Главная</router-link>
        <span>/</span>
        <router-link to="/catalog" class="hover:text-gold-500 transition-colors">Каталог</router-link>
        <span>/</span>
        <router-link :to="'/catalog/' + product?.categorySlug" class="hover:text-gold-500 transition-colors">{{ category?.name }}</router-link>
        <span>/</span>
        <span class="text-iron-700">{{ product?.name }}</span>
      </nav>

      <div v-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14" v-reveal>
        <div class="bg-cream-50/80 rounded-2xl p-8 lg:p-12 flex items-center justify-center border border-iron-100/40 cursor-zoom-in relative group" @click="lightbox = true">
          <img :src="product.image" :alt="product.name" class="max-w-full max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.03]" />
          <div class="absolute bottom-4 right-4 p-2 bg-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4 text-iron-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/>
            </svg>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-3 mb-5">
            <div v-if="product.badge" class="inline-block bg-iron-900 text-gold-400 text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-sm">
              {{ product.badge }}
            </div>
            <button
              @click="toggleWish"
              class="p-2 rounded-lg transition-all duration-200"
              :class="wished ? 'bg-gold-50 text-gold-500' : 'bg-iron-50 text-iron-300 hover:text-gold-400'"
            >
              <svg class="w-5 h-5" :fill="wished ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
              </svg>
            </button>
          </div>

          <h1 class="font-heading text-2xl sm:text-3xl font-semibold text-iron-900 mb-5 leading-tight">{{ product.name }}</h1>

          <div class="flex items-end gap-4 mb-6">
            <span class="text-3xl font-heading font-bold text-iron-900">{{ product.price.toLocaleString() }} &#8381;</span>
            <span v-if="product.oldPrice" class="text-lg text-iron-400 line-through">{{ product.oldPrice.toLocaleString() }} &#8381;</span>
          </div>

          <div v-if="product.material" class="mb-6 flex items-center gap-3 p-4 bg-cream-50/80 rounded-xl border border-iron-100/40">
            <svg class="w-5 h-5 text-gold-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/>
            </svg>
            <div>
              <div class="text-xs text-iron-400 uppercase tracking-wider">Материал</div>
              <div class="font-medium text-iron-800 text-sm">{{ product.material }}</div>
            </div>
          </div>

          <p v-if="product.description" class="text-iron-600 mb-8 leading-relaxed text-[15px]">{{ product.description }}</p>

          <div class="flex items-center gap-4 mb-8">
            <div class="flex items-center border border-iron-100 rounded-xl overflow-hidden">
              <button @click="qty > 1 && qty--" class="px-4 py-3 text-iron-500 hover:bg-cream-50 transition-colors text-lg">−</button>
              <span class="px-4 py-3 text-iron-900 font-medium min-w-[48px] text-center border-x border-iron-100">{{ qty }}</span>
              <button @click="qty++" class="px-4 py-3 text-iron-500 hover:bg-cream-50 transition-colors text-lg">+</button>
            </div>

            <button
              @click="addToCart"
              class="flex-1 bg-iron-900 hover:bg-gold-600 text-cream-100 py-3 px-8 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              В корзину
            </button>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="p-3 bg-cream-50/80 rounded-xl border border-iron-100/40">
              <svg class="w-5 h-5 mx-auto text-gold-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h.008M21 12.75H3.375m0 0V5.625A1.125 1.125 0 014.5 4.5h15A1.875 1.875 0 0121.375 6.375v8.25"/>
              </svg>
              <div class="text-[11px] text-iron-500">Быстрая доставка</div>
            </div>
            <div class="p-3 bg-cream-50/80 rounded-xl border border-iron-100/40">
              <svg class="w-5 h-5 mx-auto text-gold-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
              </svg>
              <div class="text-[11px] text-iron-500">Гарантия качества</div>
            </div>
            <div class="p-3 bg-cream-50/80 rounded-xl border border-iron-100/40">
              <svg class="w-5 h-5 mx-auto text-gold-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
              </svg>
              <div class="text-[11px] text-iron-500">Консультация</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="related.length > 0" class="mt-20">
        <div class="text-center mb-10" v-reveal>
          <h2 class="ornament-line font-heading text-2xl font-semibold text-iron-900 mb-4">Похожие товары</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ProductCard v-for="(p, i) in related" :key="p.id" :product="p" v-reveal="i * 0.05" />
        </div>
      </div>
    </div>

    <ImageLightbox :visible="lightbox" :src="product?.image" :alt="product?.name" @close="lightbox = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../stores/products'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useToastStore } from '../stores/toast'
import ProductCard from '../components/ProductCard.vue'
import ImageLightbox from '../components/ImageLightbox.vue'
import { useSeo } from '../composables/useSeo'

const route = useRoute()
const productStore = useProductStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToastStore()
const qty = ref(1)
const lightbox = ref(false)

const product = computed(() => productStore.getProductById(Number(route.params.id)))
const category = computed(() => {
  if (!product.value) return null
  return productStore.getCategoryBySlug(product.value.categorySlug)
})
const related = computed(() => {
  if (!product.value) return []
  return productStore.getRelatedProducts(product.value.id)
})

const wished = computed(() => product.value ? wishlist.isWished(product.value.id) : false)

function toggleWish() {
  if (product.value) {
    wishlist.toggle(product.value)
    toast.info(wished.value ? 'Удалено из избранного' : 'Добавлено в избранное')
  }
}

function addToCart() {
  if (product.value) {
    cart.addItem(product.value, qty.value)
    toast.success(`${product.value.name} — добавлен в корзину`)
  }
}

const seoName = computed(() => product.value?.name || 'Товар')
useSeo(seoName.value, product.value?.description)
</script>
