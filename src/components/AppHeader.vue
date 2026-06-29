<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-gold-400/10 bg-obsidian-950/88 backdrop-blur-xl">
    <div class="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
      <router-link to="/" class="flex shrink-0 items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-400/20 bg-gold-400/8">
          <img
            src="/images/branding/brand-mark-ornament-small.webp"
            alt="Эталон Ковка"
            width="36"
            height="36"
            class="h-9 w-9 rounded-xl object-cover shadow-[0_10px_24px_rgba(0,0,0,0.26)]"
          />
        </div>
        <div class="hidden sm:block">
          <div class="font-heading text-lg font-semibold uppercase tracking-[0.12em] text-cream-100">Эталон Ковка</div>
          <div class="text-[10px] uppercase tracking-[0.24em] text-gold-300/72">Астана • Казахстан</div>
        </div>
      </router-link>

      <nav class="hidden items-center gap-2 xl:flex">
        <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
          {{ item.label }}
        </router-link>
      </nav>

      <div class="flex items-center gap-1 sm:gap-2">
        <a href="tel:+77758537092" class="hidden px-4 py-2.5 text-sm lg:inline-flex metal-button">
          +7 775 853 70 92
        </a>

        <button
          class="icon-button"
          aria-label="Поиск"
          :aria-expanded="searchOpen"
          aria-controls="search-panel"
          @click="toggleSearch"
        >
          <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>

        <button
          class="icon-button xl:hidden"
          aria-label="Меню"
          :aria-expanded="mobileMenu"
          aria-controls="mobile-menu"
          @click="toggleMobileMenu"
        >
          <svg v-if="!mobileMenu" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="searchOpen" id="search-panel" class="border-t border-gold-400/10 bg-obsidian-950/94 px-4 pb-4 pt-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <div class="relative">
          <input
            v-model="searchInput"
            type="text"
            aria-label="Поиск по каталогу"
            placeholder="Поиск по каталогу"
            class="w-full rounded-[1.25rem] border border-gold-400/14 bg-obsidian-900/70 py-3 pl-11 pr-4 text-sm text-cream-100 outline-none transition focus:border-gold-400/32"
            @focus="showDropdown = true"
            @input="onSearchInput"
            @keyup.enter="goToCatalog"
          />
          <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        <div v-if="showDropdown && searchResults.length > 0" class="mt-3 overflow-hidden rounded-[1.5rem] border border-gold-400/10 bg-obsidian-900/96 shadow-2xl shadow-black/40">
          <router-link
            v-for="p in searchResults"
            :key="p.id"
            :to="'/product/' + p.id"
            class="flex items-center gap-3 border-b border-gold-400/8 px-4 py-3 transition-colors hover:bg-gold-400/6 last:border-b-0"
            @click="closeSearch"
          >
            <img :src="p.image" :alt="p.name" loading="lazy" class="h-12 w-12 rounded-xl border border-gold-400/10 bg-obsidian-800/86 p-1.5 object-contain" />
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium text-cream-100">{{ p.name }}</div>
              <div class="mt-1 text-xs uppercase tracking-[0.16em] text-gold-300/72">Каталог</div>
            </div>
            <div v-if="!p.hidePrice" class="shrink-0 text-sm font-heading text-gold-300">{{ formatPrice(p.price) }}</div>
            <div v-else class="shrink-0 text-xs text-gold-400/80">Цена по запросу</div>
          </router-link>
        </div>
      </div>
    </div>

  </header>

  <Teleport to="body">
    <transition name="mobile-menu">
      <div
        v-if="mobileMenu"
        id="mobile-menu"
        class="fixed inset-0 z-[60] xl:hidden"
        @click.self="closeMobileMenu"
      >
        <div class="absolute inset-0 bg-obsidian-950/78 backdrop-blur-md" @click="closeMobileMenu"></div>
        <nav class="mobile-sheet absolute inset-y-0 right-0 flex w-[min(20rem,calc(100vw-1rem))] flex-col gap-2 overflow-y-auto border-l border-gold-400/12 bg-obsidian-950/96 px-5 pb-8 pt-[5.5rem] shadow-[0_24px_80px_rgba(0,0,0,0.58)] backdrop-blur-2xl sm:pt-24">
          <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="mobile-link" @click="closeMobileMenu">
            {{ item.label }}
          </router-link>
          <a href="tel:+77758537092" class="mt-4 text-center metal-button" @click="closeMobileMenu">+7 775 853 70 92</a>
        </nav>
      </div>
    </transition>
  </Teleport>

  <div class="h-[4.5rem] lg:h-20"></div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { formatPrice } from '../composables/usePrice.js'
import { debounce } from '../composables/useDebounce.js'
import { lockScroll, unlockScroll } from '../composables/useScrollLock.js'
import { isTypingTarget } from '../composables/useUtils.js'
import { useProductStore } from '../stores/products'

const router = useRouter()
const productStore = useProductStore()

const searchOpen = ref(false)
const showDropdown = ref(false)
const mobileMenu = ref(false)
const searchInput = ref('')

const navItems = [
  { to: '/', label: 'Главная' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/about', label: 'О нас' },
  { to: '/delivery', label: 'Доставка' },
  { to: '/contacts', label: 'Контакты' },
]

const updateSearch = debounce((val) => {
  productStore.searchQuery = val
}, 200)

function onSearchInput() {
  showDropdown.value = true
  updateSearch(searchInput.value)
}

const searchResults = computed(() => {
  if (!searchInput.value) return []
  return productStore.searchProducts(searchInput.value).slice(0, 6)
})

function toggleSearch() {
  searchOpen.value = !searchOpen.value
  showDropdown.value = searchOpen.value
}

function closeSearch() {
  searchOpen.value = false
  showDropdown.value = false
  searchInput.value = ''
  productStore.searchQuery = ''
}

function toggleMobileMenu() {
  closeSearch()
  mobileMenu.value = !mobileMenu.value
}

function closeMobileMenu() {
  mobileMenu.value = false
}

function goToCatalog() {
  router.push('/catalog')
  closeSearch()
}

watch(mobileMenu, (value) => {
  if (value) lockScroll()
  else unlockScroll()
})

function onKeyDown(e) {
  if (e.key !== 'Escape') return
  if (isTypingTarget(e.target)) return
  closeMobileMenu()
  closeSearch()
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  if (mobileMenu.value) unlockScroll()
  updateSearch.cancel()
})
</script>

<style scoped>
.nav-link {
  border-radius: 999px;
  padding: 0.72rem 1rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(245, 240, 232, 0.64);
  transition: color 0.25s ease, background-color 0.25s ease, transform 0.25s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(201, 150, 59, 0.12);
  color: rgba(244, 201, 112, 1);
}

.icon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  border: 1px solid rgba(201, 150, 59, 0.12);
  background: rgba(10, 9, 8, 0.52);
  color: rgba(245, 240, 232, 0.82);
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.icon-button:hover {
  transform: translateY(-1px);
  border-color: rgba(201, 150, 59, 0.24);
  color: rgba(244, 201, 112, 1);
  background: rgba(201, 150, 59, 0.08);
}

.mobile-link {
  border-radius: 1rem;
  padding: 0.9rem 1rem;
  color: rgba(245, 240, 232, 0.78);
  transition: background-color 0.24s ease, color 0.24s ease, transform 0.24s ease;
}

.mobile-link:hover,
.mobile-link.router-link-active {
  background: rgba(201, 150, 59, 0.12);
  color: rgba(244, 201, 112, 1);
  transform: translateX(4px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.24s ease;
}

.mobile-menu-enter-active .mobile-sheet,
.mobile-menu-leave-active .mobile-sheet {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-enter-from .mobile-sheet,
.mobile-menu-leave-to .mobile-sheet {
  opacity: 0;
  transform: translateX(18px);
}
</style>
