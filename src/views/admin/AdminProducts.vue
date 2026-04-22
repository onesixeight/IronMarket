<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="font-heading text-2xl sm:text-3xl font-bold text-cream-100">Товары</h1>
          <p class="text-cream-100/50 text-sm mt-1">{{ filteredProducts.length }} из {{ productStore.allProducts.length }}</p>
        </div>
        <router-link
          to="/admin/products/new"
          class="shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-obsidian-900 transition-all duration-200 hover:-translate-y-0.5 shrink-0"
          :style="{ background: 'linear-gradient(135deg, #C9A96E, #D4AF37)' }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Добавить товар
        </router-link>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Поиск по названию..."
            class="form-input pl-10"
          />
        </div>
        <select v-model="categoryFilter" class="form-input sm:w-56">
          <option :value="null">Все категории</option>
          <option v-for="cat in productStore.categories" :key="cat.slug" :value="cat.slug">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div class="bg-obsidian-800 border border-obsidian-600/60 rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-obsidian-600/60">
                <th class="text-left px-5 py-4 text-xs uppercase tracking-wider text-cream-100/40 font-semibold">Фото</th>
                <th class="text-left px-5 py-4 text-xs uppercase tracking-wider text-cream-100/40 font-semibold">Название</th>
                <th class="text-left px-5 py-4 text-xs uppercase tracking-wider text-cream-100/40 font-semibold hidden md:table-cell">Категория</th>
                <th class="text-left px-5 py-4 text-xs uppercase tracking-wider text-cream-100/40 font-semibold">Цена</th>
                <th class="text-left px-5 py-4 text-xs uppercase tracking-wider text-cream-100/40 font-semibold hidden sm:table-cell">Цена скрыта</th>
                <th class="text-right px-5 py-4 text-xs uppercase tracking-wider text-cream-100/40 font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in filteredProducts"
                :key="product.id"
                class="border-b border-obsidian-600/30 last:border-b-0 hover:bg-obsidian-700/40 transition-colors"
              >
                <td class="px-5 py-3">
                  <img
                    :src="product.image"
                    :alt="product.name"
                    class="w-12 h-12 object-contain rounded-lg bg-obsidian-700 border border-obsidian-600/40 p-1"
                  />
                </td>
                <td class="px-5 py-3">
                  <router-link
                    :to="'/product/' + product.id"
                    class="text-sm font-medium text-cream-100 hover:text-gold-400 transition-colors"
                  >
                    {{ product.name }}
                  </router-link>
                  <div v-if="product.badge" class="mt-1">
                    <span class="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gold-400/15 text-gold-400 border border-gold-400/20 font-medium">
                      {{ product.badge }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-3 hidden md:table-cell">
                  <span class="text-sm text-cream-100/60">{{ getCategoryName(product.categorySlug) }}</span>
                </td>
                <td class="px-5 py-3">
                  <span v-if="product.hidePrice" class="text-sm text-cream-100/40 italic">По запросу</span>
                  <span v-else class="text-sm font-heading font-semibold text-gold-400">{{ product.price?.toLocaleString() }} ?</span>
                </td>
                <td class="px-5 py-3 hidden sm:table-cell">
                  <button
                    @click="toggleHidePrice(product)"
                    class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
                    :class="product.hidePrice ? 'bg-gold-400' : 'bg-obsidian-600'"
                  >
                    <span
                      class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200"
                      :class="product.hidePrice ? 'translate-x-4.5' : 'translate-x-1'"
                    />
                  </button>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <router-link
                      :to="'/admin/products/' + product.id"
                      class="p-2 rounded-lg text-cream-100/50 hover:text-gold-400 hover:bg-gold-400/10 transition-all"
                      title="Редактировать"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
                      </svg>
                    </router-link>
                    <button
                      @click="handleDelete(product)"
                      class="p-2 rounded-lg text-cream-100/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      title="Удалить"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredProducts.length === 0">
                <td colspan="6" class="px-5 py-12 text-center">
                  <p class="text-cream-100/40 text-sm">Товары не найдены</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProductStore } from '../../stores/products'
import { useAdminStore } from '../../stores/admin'
import { useToastStore } from '../../stores/toast'

const productStore = useProductStore()
const adminStore = useAdminStore()
const toast = useToastStore()

const search = ref('')
const categoryFilter = ref(null)

const filteredProducts = computed(() => {
  let result = productStore.allProducts

  if (categoryFilter.value) {
    result = result.filter(p => p.categorySlug === categoryFilter.value)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    )
  }

  return result
})

function getCategoryName(slug) {
  const cat = productStore.getCategoryBySlug(slug)
  return cat ? cat.name : slug
}

function toggleHidePrice(product) {
  adminStore.updateProduct(product.id, { hidePrice: !product.hidePrice })
  toast.success(product.hidePrice ? 'Цена отображается' : 'Цена скрыта')
}

function handleDelete(product) {
  if (confirm(`Удалить товар «${product.name}»?`)) {
    adminStore.deleteProduct(product.id)
    toast.success('Товар удалён')
  }
}
</script>
