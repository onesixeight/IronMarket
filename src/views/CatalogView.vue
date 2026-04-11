<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm text-iron-400 dark:text-iron-500 mb-8">
        <router-link to="/" class="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Главная</router-link>
        <span>/</span>
        <span class="text-iron-700 dark:text-cream-100">Каталог</span>
      </nav>

      <div class="text-center mb-12" v-reveal>
        <h1 class="ornament-line font-heading text-3xl sm:text-4xl font-semibold text-iron-900 dark:text-cream-100 mb-4">Каталог продукции</h1>
        <p class="text-iron-500 dark:text-iron-400 max-w-xl mx-auto text-[15px]">Декоративные кованые элементы и узоры для создания уникальных решений</p>
      </div>

      <div v-if="!selectedCategory" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-20">
        <router-link
          v-for="(cat, i) in categories"
          :key="cat.id"
          :to="'/catalog/' + cat.slug"
          class="group bg-white dark:bg-iron-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-amber-500/10 dark:hover:shadow-amber-500/20 hover:-translate-y-0.5 border border-iron-100/50 dark:border-iron-700/50"
          v-reveal="i * 0.04"
        >
          <div class="p-4 bg-cream-50/80 dark:bg-iron-700/50 h-28 flex items-center justify-center">
            <img :src="cat.image" :alt="cat.name" class="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-400" loading="lazy" />
          </div>
          <div class="p-2.5 text-center border-t border-iron-100/40 dark:border-iron-700/40 bg-white dark:bg-iron-800">
            <h2 class="text-xs font-medium text-iron-700 dark:text-cream-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">{{ cat.name }}</h2>
            <p class="text-[10px] text-iron-400 dark:text-iron-500 mt-0.5">{{ getProductCount(cat.slug) }} товаров</p>
          </div>
        </router-link>
      </div>

      <div class="mb-8" v-reveal>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iron-400 dark:text-iron-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
              <input
                v-model="productStore.searchQuery"
                type="text"
                placeholder="Поиск по каталогу..."
                class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-iron-800 border border-iron-100 dark:border-iron-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:focus:ring-amber-400/20 focus:border-amber-400 text-sm transition-all text-iron-900 dark:text-cream-100 placeholder-iron-400 dark:placeholder-iron-500"
              />
            </div>
          </div>

          <CustomSelect
            :options="categoryOptions"
            v-model="productStore.selectedCategory"
            placeholder="Все категории"
          />

          <CustomSelect
            :options="sortOptions"
            v-model="productStore.sortBy"
            placeholder="Сортировка"
          />
        </div>

        <div class="mt-4 flex items-center gap-4" v-if="productStore.allPriceRange.max > productStore.allPriceRange.min">
          <span class="text-xs text-iron-400 dark:text-iron-500 uppercase tracking-wider shrink-0">Цена</span>
          <div class="flex-1 max-w-xs">
            <PriceRange
              :min="productStore.allPriceRange.min"
              :max="productStore.allPriceRange.max"
              v-model:model-min="productStore.priceMin"
              v-model:model-max="productStore.priceMax"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <ProductCard v-for="p in productStore.paginatedProducts" :key="p.id" :product="p" />
      </div>

      <Pagination
        :current-page="productStore.currentPage"
        :total-pages="productStore.totalPages"
        @update:current-page="productStore.currentPage = $event"
      />

      <div v-if="productStore.filteredProducts.length === 0" class="text-center py-20 animate-fade-in">
        <svg class="w-16 h-16 mx-auto text-iron-200 dark:text-iron-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
        <p class="text-iron-400 dark:text-iron-500 text-lg font-heading">Товары не найдены</p>
        <p class="text-iron-400/70 dark:text-iron-600 text-sm mt-1">Попробуйте изменить параметры поиска</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import catalog from '../data/catalog.json'
import { useProductStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'
import CustomSelect from '../components/CustomSelect.vue'
import PriceRange from '../components/PriceRange.vue'
import Pagination from '../components/Pagination.vue'
import { useSeo } from '../composables/useSeo'
import { useBreadcrumbs } from '../composables/useBreadcrumbs'

useSeo('Каталог продукции', 'Полный каталог декоративных кованых изделий: короны, узоры, балясины, уголки и другие элементы.')

const productStore = useProductStore()
const categories = catalog.categories
const selectedCategory = computed(() => productStore.selectedCategory)

const categoryOptions = computed(() => [
  { value: null, label: 'Все категории' },
  ...categories.map(c => ({ value: c.slug, label: c.name })),
])

const sortOptions = [
  { value: 'name', label: 'По названию' },
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
]

function getProductCount(slug) {
  return catalog.products.filter(p => p.categorySlug === slug).length
}
</script>
