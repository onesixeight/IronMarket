<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-10">
        <div>
          <h1 class="font-heading text-2xl sm:text-3xl font-bold text-cream-100">Админ-панель</h1>
          <p class="text-cream-100/50 text-sm mt-1">Управление каталогом и товарами</p>
        </div>
        <button
          @click="handleLogout"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-obsidian-500 text-sm text-cream-100/70 hover:text-red-400 hover:border-red-400/40 transition-all duration-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
          </svg>
          Выйти
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        <div class="bg-obsidian-800 border border-obsidian-600/60 rounded-2xl p-6 transition-all duration-200 hover:border-gold-400/30">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
              </svg>
            </div>
            <div>
              <p class="text-cream-100/50 text-xs uppercase tracking-wider">Товаров</p>
              <p class="text-2xl font-heading font-bold text-cream-100">{{ productStore.allProducts.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-obsidian-800 border border-obsidian-600/60 rounded-2xl p-6 transition-all duration-200 hover:border-gold-400/30">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
              </svg>
            </div>
            <div>
              <p class="text-cream-100/50 text-xs uppercase tracking-wider">Категорий</p>
              <p class="text-2xl font-heading font-bold text-cream-100">{{ productStore.categories.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-obsidian-800 border border-obsidian-600/60 rounded-2xl p-6 transition-all duration-200 hover:border-gold-400/30">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>
              </svg>
            </div>
            <div>
              <p class="text-cream-100/50 text-xs uppercase tracking-wider">Без цены</p>
              <p class="text-2xl font-heading font-bold text-cream-100">{{ hiddenPriceCount }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-obsidian-800 border border-obsidian-600/60 rounded-2xl p-6 sm:p-8">
        <h2 class="font-heading text-lg font-semibold text-cream-100 mb-6">Быстрые действия</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <router-link
            to="/admin/products"
            class="group flex items-center gap-4 p-5 rounded-xl border border-obsidian-500/60 hover:border-gold-400/30 bg-obsidian-700/50 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div class="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
              <svg class="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
              </svg>
            </div>
            <div>
              <p class="text-cream-100 font-medium text-sm">Управление товарами</p>
              <p class="text-cream-100/40 text-xs mt-0.5">Список, редактирование, добавление</p>
            </div>
          </router-link>

          <router-link
            to="/admin/products/new"
            class="group flex items-center gap-4 p-5 rounded-xl border border-obsidian-500/60 hover:border-gold-400/30 bg-obsidian-700/50 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div class="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center group-hover:bg-gold-400/20 transition-colors">
              <svg class="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
            </div>
            <div>
              <p class="text-cream-100 font-medium text-sm">Добавить товар</p>
              <p class="text-cream-100/40 text-xs mt-0.5">Создать новую позицию каталога</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../../stores/products'
import { useAdminStore } from '../../stores/admin'

const router = useRouter()
const productStore = useProductStore()
const adminStore = useAdminStore()

const hiddenPriceCount = computed(() =>
  productStore.allProducts.filter(p => p.hidePrice).length
)

function handleLogout() {
  adminStore.logout()
  router.push('/admin/login')
}
</script>
