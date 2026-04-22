<template>
  <div class="py-8" style="background: var(--color-obsidian-900); min-height: 80vh;">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm mb-8">
        <router-link to="/" class="transition-colors duration-200" style="color: var(--color-gold-600);" @mouseenter="$event.target.style.color = 'var(--color-gold-400)'" @mouseleave="$event.target.style.color = 'var(--color-gold-600)'">Главная</router-link>
        <span style="color: var(--color-obsidian-500);">/</span>
        <router-link to="/catalog" class="transition-colors duration-200" style="color: var(--color-gold-600);" @mouseenter="$event.target.style.color = 'var(--color-gold-400)'" @mouseleave="$event.target.style.color = 'var(--color-gold-600)'">Каталог</router-link>
        <span style="color: var(--color-obsidian-500);">/</span>
        <router-link
          v-if="product"
          :to="'/catalog/' + product.categorySlug"
          class="transition-colors duration-200"
          style="color: var(--color-gold-600);"
          @mouseenter="$event.target.style.color = 'var(--color-gold-400)'"
          @mouseleave="$event.target.style.color = 'var(--color-gold-600)'"
        >
          {{ category?.name }}
        </router-link>
        <template v-if="product">
          <span style="color: var(--color-obsidian-500);">/</span>
          <span style="color: var(--color-cream-100);">{{ product.name }}</span>
        </template>
      </nav>

      <div v-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        <div
          class="rounded-2xl p-8 lg:p-12 flex items-center justify-center relative group transition-all duration-300"
          style="background: var(--color-obsidian-800); border: 1px solid rgba(201,150,59,0.08);"
          @mouseenter="$event.currentTarget.style.borderColor = 'rgba(201,150,59,0.2)'"
          @mouseleave="$event.currentTarget.style.borderColor = 'rgba(201,150,59,0.08)'"
        >
          <img
            :src="product.image"
            :alt="product.name"
            class="max-w-full max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <button
            type="button"
            class="absolute bottom-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-zoom-in"
            style="background: rgba(201,150,59,0.1); border: 1px solid rgba(201,150,59,0.2);"
            aria-label="Открыть изображение крупнее"
            @click="lightbox = true"
          >
            <svg class="w-4 h-4" style="color: var(--color-gold-400);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"/>
            </svg>
          </button>
        </div>

        <div>
          <div class="flex items-center gap-3 mb-5">
            <div
              v-if="product.badge"
              class="shimmer inline-block text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-sm"
              style="background: linear-gradient(135deg, var(--color-gold-400), var(--color-gold-500)); color: var(--color-obsidian-900);"
            >
              {{ product.badge }}
            </div>
            <button
              @click="toggleWish"
              class="p-2 rounded-lg transition-all duration-200"
              :style="wished ? 'background: rgba(201,150,59,0.15); color: var(--color-gold-400);' : 'background: var(--color-obsidian-800); color: var(--color-obsidian-500);'"
            >
              <svg class="w-5 h-5" :fill="wished ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
              </svg>
            </button>
          </div>

          <h1
            class="text-2xl sm:text-3xl font-bold mb-5 leading-tight"
            style="font-family: var(--font-heading); color: var(--color-cream-100);"
          >
            {{ product.name }}
          </h1>

          <div class="flex items-end gap-4 mb-6" v-if="!product.hidePrice">
            <span
              class="text-3xl font-bold"
              style="font-family: var(--font-heading); color: var(--color-gold-400);"
            >
              {{ formatPrice(product.price) }}
            </span>
            <span
              v-if="product.oldPrice"
              class="text-lg line-through"
              style="color: var(--color-obsidian-500);"
            >
              {{ formatPrice(product.oldPrice) }}
            </span>
          </div>
          <div v-else class="mb-6">
            <span
              class="text-xl font-medium"
              style="font-family: var(--font-heading); color: var(--color-gold-500);"
            >
              Цена по запросу
            </span>
          </div>

          <div
            v-if="product.material"
            class="mb-6 flex items-center gap-3 p-4 rounded-xl"
            style="background: var(--color-obsidian-700); border: 1px solid rgba(201,150,59,0.08);"
          >
            <svg class="w-5 h-5 shrink-0" style="color: var(--color-gold-400);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/>
            </svg>
            <div>
              <div class="text-[10px] uppercase tracking-wider" style="color: var(--color-obsidian-500);">Материал</div>
              <div class="font-medium text-sm" style="color: var(--color-cream-100);">{{ product.material }}</div>
            </div>
          </div>

          <p
            v-if="product.description"
            class="mb-8 leading-relaxed text-[15px]"
            style="color: var(--color-cream-100); opacity: 0.6;"
          >
            {{ product.description }}
          </p>

          <div v-if="!product.hidePrice" class="flex items-center gap-4 mb-8">
            <div
              class="flex items-center rounded-xl overflow-hidden"
              style="border: 1px solid rgba(201,150,59,0.15);"
            >
              <button
                @click="qty > 1 && qty--"
                class="px-4 py-3 text-lg transition-colors duration-200"
                style="color: var(--color-cream-100); opacity: 0.6;"
                @mouseenter="$event.target.style.background = 'var(--color-obsidian-700)'"
                @mouseleave="$event.target.style.background = 'transparent'"
              >
                −
              </button>
              <span
                class="px-4 py-3 font-medium min-w-[48px] text-center"
                style="color: var(--color-cream-100); border-left: 1px solid rgba(201,150,59,0.15); border-right: 1px solid rgba(201,150,59,0.15);"
              >
                {{ qty }}
              </span>
              <button
                @click="qty++"
                class="px-4 py-3 text-lg transition-colors duration-200"
                style="color: var(--color-cream-100); opacity: 0.6;"
                @mouseenter="$event.target.style.background = 'var(--color-obsidian-700)'"
                @mouseleave="$event.target.style.background = 'transparent'"
              >
                +
              </button>
            </div>

            <button
              @click="addToCart"
              class="flex-1 py-3 px-8 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style="border: 1px solid var(--color-gold-400); color: var(--color-gold-400); background: transparent;"
              @mouseenter="$event.currentTarget.style.background = 'var(--color-gold-400)'; $event.currentTarget.style.color = 'var(--color-obsidian-900)'"
              @mouseleave="$event.currentTarget.style.background = 'transparent'; $event.currentTarget.style.color = 'var(--color-gold-400)'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
              </svg>
              В корзину
            </button>
          </div>

          <div v-else class="mb-8">
            <router-link
              to="/contacts"
              class="shimmer inline-flex items-center gap-2 py-3 px-8 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style="background: linear-gradient(135deg, #C9A96E, #D4AF37, #C9A96E); color: var(--color-obsidian-900);"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
              </svg>
              Запросить цену
            </router-link>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="p-3 rounded-xl" style="background: var(--color-obsidian-700); border: 1px solid rgba(201,150,59,0.06);">
              <svg class="w-5 h-5 mx-auto mb-1.5" style="color: var(--color-gold-400);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h.008M21 12.75H3.375m0 0V5.625A1.125 1.125 0 014.5 4.5h15A1.875 1.875 0 0121.375 6.375v8.25"/>
              </svg>
              <div class="text-[11px]" style="color: var(--color-cream-100); opacity: 0.5;">Быстрая доставка</div>
            </div>
            <div class="p-3 rounded-xl" style="background: var(--color-obsidian-700); border: 1px solid rgba(201,150,59,0.06);">
              <svg class="w-5 h-5 mx-auto mb-1.5" style="color: var(--color-gold-400);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
              </svg>
              <div class="text-[11px]" style="color: var(--color-cream-100); opacity: 0.5;">Гарантия качества</div>
            </div>
            <div class="p-3 rounded-xl" style="background: var(--color-obsidian-700); border: 1px solid rgba(201,150,59,0.06);">
              <svg class="w-5 h-5 mx-auto mb-1.5" style="color: var(--color-gold-400);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
              </svg>
              <div class="text-[11px]" style="color: var(--color-cream-100); opacity: 0.5;">Консультация</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="related.length > 0" class="mt-20">
        <div class="text-center mb-10" v-reveal>
          <h2
            class="ornament-line text-2xl font-bold mb-4 justify-center"
            style="font-family: var(--font-heading); color: var(--color-gold-400);"
          >
            Похожие товары
          </h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
import { formatPrice } from '../composables/usePrice.js'

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
