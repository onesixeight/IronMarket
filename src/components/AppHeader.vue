<template>
  <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-charcoal-900/95 dark:bg-iron-950/95 backdrop-blur-md border-b border-white/5 dark:border-iron-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 lg:h-20">
        <router-link to="/" class="flex items-center gap-3 shrink-0 group">
          <div class="w-10 h-10 border-2 border-amber-500/60 dark:border-amber-400/60 rounded-sm flex items-center justify-center transition-all duration-300 group-hover:border-amber-400 dark:group-hover:border-amber-300 group-hover:bg-amber-500/15 dark:group-hover:bg-amber-400/15 group-hover:shadow-lg group-hover:shadow-amber-500/20">
            <svg class="w-5 h-5 text-amber-400 dark:text-amber-400 transition-colors group-hover:text-amber-300 dark:group-hover:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="hidden sm:block">
            <div class="font-heading text-xl font-bold text-cream-100 dark:text-cream-100 tracking-wide leading-none group-hover:text-amber-50 transition-colors">Ковка</div>
            <div class="text-[10px] text-amber-400/90 dark:text-amber-400/90 tracking-[0.2em] uppercase mt-0.5 font-medium">мастерская</div>
          </div>
        </router-link>

        <nav class="hidden lg:flex items-center gap-1">
          <router-link to="/" custom v-slot="{ isActive, navigate }">
            <button @click="navigate" class="nav-link" :class="isActive && 'nav-link-active'">Главная</button>
          </router-link>
          <router-link to="/catalog" custom v-slot="{ isActive, navigate }">
            <button @click="navigate" class="nav-link" :class="isActive && 'nav-link-active'">Каталог</button>
          </router-link>
          <router-link to="/about" custom v-slot="{ isActive, navigate }">
            <button @click="navigate" class="nav-link" :class="isActive && 'nav-link-active'">О нас</button>
          </router-link>
          <router-link to="/delivery" custom v-slot="{ isActive, navigate }">
            <button @click="navigate" class="nav-link" :class="isActive && 'nav-link-active'">Доставка</button>
          </router-link>
          <router-link to="/contacts" custom v-slot="{ isActive, navigate }">
            <button @click="navigate" class="nav-link" :class="isActive && 'nav-link-active'">Контакты</button>
          </router-link>
        </nav>

        <div class="flex items-center gap-1">
          <button @click="searchOpen = !searchOpen" class="p-2.5 text-iron-300 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-all duration-200 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/10 active:scale-95" aria-label="Поиск">
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
          </button>

          <router-link to="/wishlist" class="relative p-2.5 text-iron-300 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-all duration-200 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/10 active:scale-95" aria-label="Избранное">
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
            </svg>
            <span v-if="wishlist.totalItems > 0" class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-500 text-iron-900 text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-amber-500/30">
              {{ wishlist.totalItems }}
            </span>
          </router-link>

          <button @click="cartOpen = true" class="relative p-2.5 text-iron-300 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-all duration-200 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/10 active:scale-95" aria-label="Корзина">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
            </svg>
            <span v-if="cart.totalItems > 0" class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-500 text-iron-900 text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-amber-500/30">
              {{ cart.totalItems }}
            </span>
          </button>

          <button @click="theme.toggle()" class="p-2.5 text-iron-300 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-all duration-200 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/10 active:scale-95" :aria-label="theme.dark ? 'Светлая тема' : 'Тёмная тема'">
            <svg v-if="theme.dark" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
            </svg>
            <svg v-else class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
            </svg>
          </button>

          <button @click="mobileMenu = !mobileMenu" class="lg:hidden p-2.5 text-iron-300 dark:text-iron-400 hover:text-amber-400 dark:hover:text-amber-400 transition-all duration-200 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/10 active:scale-95" aria-label="Меню">
            <svg v-if="!mobileMenu" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="searchOpen" class="pb-4 animate-fade-in">
        <div class="relative">
          <input
            v-model="productStore.searchQuery"
            type="text"
            placeholder="Поиск по каталогу..."
            class="w-full pl-10 pr-4 py-2.5 bg-white/10 dark:bg-iron-800/50 border border-white/10 dark:border-iron-700 rounded-lg text-cream-100 dark:text-cream-100 placeholder-iron-400 dark:placeholder-iron-500 text-sm focus:outline-none focus:border-amber-400/50 dark:focus:border-amber-400/50 focus:bg-white/15 dark:focus:bg-iron-800/70 focus:ring-2 focus:ring-amber-400/20 dark:focus:ring-amber-400/10 transition-all shadow-inner"
            @input="onSearchInput"
            @keyup.enter="goToSearch"
            @focus="showDropdown = true"
          />
          <svg class="absolute left-3 top-3 w-4 h-4 text-iron-400 dark:text-iron-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
        </div>
        <div v-if="showDropdown && searchResults.length > 0" class="mt-2 bg-iron-800/95 dark:bg-iron-800/95 backdrop-blur-md border border-white/10 dark:border-iron-700 rounded-xl overflow-hidden shadow-2xl shadow-black/30">
          <router-link
            v-for="p in searchResults"
            :key="p.id"
            :to="'/product/' + p.id"
            @click="showDropdown = false; searchOpen = false"
            class="flex items-center gap-3 px-4 py-3 hover:bg-white/5 dark:hover:bg-iron-700/50 transition-colors border-b border-white/5 dark:border-iron-700/50 last:border-0"
          >
            <img :src="p.image" :alt="p.name" class="w-10 h-10 object-contain bg-cream-50 dark:bg-iron-700 rounded-lg p-1 shadow-sm" />
            <div class="flex-1 min-w-0">
              <div class="text-sm text-cream-200 dark:text-cream-100 truncate font-medium">{{ p.name }}</div>
              <div class="text-xs text-amber-400 dark:text-amber-400 font-semibold">{{ p.price.toLocaleString() }} &#8381;</div>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <transition name="mobile-menu">
      <div v-if="mobileMenu" class="lg:hidden fixed inset-0 top-16 lg:top-20 z-[55]">
        <div class="absolute inset-0 bg-iron-900/90 dark:bg-iron-950/90 backdrop-blur-md" @click="mobileMenu = false"></div>
        <nav class="relative bg-iron-900 dark:bg-iron-900 border-t border-white/5 dark:border-iron-800 w-80 h-full p-4 flex flex-col gap-0.5 shadow-2xl shadow-black/50">
          <router-link to="/" @click="mobileMenu = false" class="mobile-nav-link">Главная</router-link>
          <router-link to="/catalog" @click="mobileMenu = false" class="mobile-nav-link">Каталог</router-link>
          <router-link to="/wishlist" @click="mobileMenu = false" class="mobile-nav-link">Избранное</router-link>
          <router-link to="/about" @click="mobileMenu = false" class="mobile-nav-link">О нас</router-link>
          <router-link to="/delivery" @click="mobileMenu = false" class="mobile-nav-link">Доставка</router-link>
          <router-link to="/contacts" @click="mobileMenu = false" class="mobile-nav-link">Контакты</router-link>
        </nav>
      </div>
    </transition>
  </header>

  <div class="h-16 lg:h-20"></div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useThemeStore } from '../stores/theme'
import { useProductStore } from '../stores/products'

const router = useRouter()
const cart = useCartStore()
const wishlist = useWishlistStore()
const theme = useThemeStore()
const productStore = useProductStore()
const cartOpen = inject('cartOpen')
const searchOpen = ref(false)
const mobileMenu = ref(false)
const scrolled = ref(false)
const showDropdown = ref(false)
let searchTimeout = null

const searchResults = computed(() => {
  if (!productStore.searchQuery) return []
  return productStore.searchProducts(productStore.searchQuery)
})

function onSearchInput() {
  showDropdown.value = true
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {}, 300)
}

function goToSearch() {
  router.push('/catalog')
  searchOpen.value = false
  showDropdown.value = false
}

function onScroll() {
  scrolled.value = window.scrollY > 20
}

watch(mobileMenu, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.nav-link {
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-iron-300);
  transition: all 0.2s ease;
  border-radius: 0.5rem;
  text-transform: uppercase;
  position: relative;
}
.nav-link:hover {
  color: var(--color-amber-400);
  background: rgba(251, 191, 36, 0.08);
}
.nav-link-active {
  color: var(--color-amber-400);
  background: rgba(251, 191, 36, 0.12);
}
.nav-link-active::after {
  content: '';
  position: absolute;
  bottom: 0.25rem;
  left: 50%;
  transform: translateX(-50%);
  width: 1.25rem;
  height: 2px;
  background: var(--color-amber-400);
  border-radius: 1px;
}
:deep(html[data-theme="dark"]) .nav-link {
  color: var(--color-iron-300);
}

.mobile-nav-link {
  display: block;
  padding: 0.875rem 1.125rem;
  color: var(--color-iron-300);
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: 0.625rem;
  transition: all 0.2s ease;
}
.mobile-nav-link:hover {
  color: var(--color-amber-400);
  background: rgba(255,255,255,0.05);
  transform: translateX(4px);
}
:deep(html[data-theme="dark"]) .mobile-nav-link {
  color: var(--color-iron-300);
}

.mobile-menu-enter-active { animation: menuSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.mobile-menu-leave-active { animation: menuSlide 0.2s ease reverse; }
@keyframes menuSlide {
  from { opacity: 0; transform: translateX(-100%); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
