<template>
  <div class="py-8 bg-obsidian-900 min-h-[80vh]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AppBreadcrumb :items="[{ to: '/', label: 'Главная' }, { label: 'Каталог' }]" />

      <div class="text-center mb-12" v-reveal>
        <h1
          class="ornament-line text-3xl sm:text-4xl font-bold mb-4 justify-center font-heading text-gold-400"
        >
          Каталог продукции
        </h1>
        <p
          class="max-w-xl mx-auto text-base leading-relaxed text-cream-100/60"
        >
          Декоративные кованые элементы и узоры для создания уникальных решений
        </p>
      </div>

      <div
        v-if="!selectedCategory"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-20"
      >
        <router-link
          v-for="(cat, i) in categories"
          :key="cat.id"
          :to="'/catalog/' + cat.slug"
          class="group rounded-xl overflow-hidden transition-all duration-500 ease-out border border-gold-400/[0.08] bg-obsidian-800 hover:border-gold-400/30 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_24px_rgba(201,150,59,0.08)]"
          v-reveal="i * 0.04"
        >
          <div
            class="p-4 h-28 flex items-center justify-center bg-obsidian-700"
          >
            <img
              :src="cat.image"
              :alt="cat.name"
              class="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          <div
            class="p-2.5 text-center border-t border-gold-400/[0.08] bg-obsidian-800"
          >
            <h2
              class="text-xs font-medium leading-snug transition-colors duration-300 text-cream-100"
            >
              {{ cat.name }}
            </h2>
            <p class="text-[10px] mt-0.5 text-cream-100/40">
              {{ getProductCount(cat.slug) }} товаров
            </p>
          </div>
        </router-link>
      </div>

      <div class="relative z-20 mb-8" v-reveal>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
              <input
                :value="productStore.searchQuery"
                type="text"
                placeholder="Поиск по каталогу..."
                class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-[border-color,box-shadow,background-color,color] focus:outline-none bg-obsidian-800 border border-gold-400/10 text-cream-100 focus:border-gold-400 focus:shadow-[0_0_0_3px_rgba(201,150,59,0.15)]"
                @input="onSearchInput"
              />
            </div>
          </div>

          <CustomSelect
            :options="categoryOptions"
            v-model="productStore.selectedCategory"
            placeholder="Все категории"
            aria-label="Категория"
          />

          <CustomSelect
            :options="sortOptions"
            v-model="productStore.sortBy"
            placeholder="Сортировка"
            aria-label="Сортировка"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ProductCard v-for="p in productStore.paginatedProducts" :key="p.id" :product="p" />
      </div>

      <Pagination
        v-if="productStore.filteredProducts.length > 0"
        :current-page="productStore.currentPage"
        :total-pages="productStore.totalPages"
        @update:current-page="productStore.currentPage = $event"
      />

      <div
        v-if="productStore.filteredProducts.length === 0"
        class="text-center py-20"
      >
        <svg class="w-16 h-16 mx-auto mb-4 text-obsidian-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
        <p class="text-lg font-bold font-heading text-cream-100/70">
          Товары не найдены
        </p>
        <p class="text-sm mt-1 text-cream-100/50">
          Попробуйте изменить параметры поиска
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useProductStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'
import CustomSelect from '../components/CustomSelect.vue'
import Pagination from '../components/Pagination.vue'
import { useSeo } from '../composables/useSeo'
import { useSchemaOrg, schemaItemList } from '../composables/useSchemaOrg.js'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'
import { debounce } from '../composables/useDebounce.js'

const productStore = useProductStore()

const debouncedSearch = debounce((val) => { productStore.searchQuery = val }, 200)

function onSearchInput(e) {
  debouncedSearch(e.target.value)
}

useSeo('Каталог продукции', 'Полный каталог декоративных кованых изделий: короны, узоры, балясины, уголки и другие элементы.')

useSchemaOrg(() => schemaItemList(productStore.filteredProducts, 'Каталог кованых элементов'))
const categories = computed(() => productStore.categories)
const selectedCategory = computed(() => productStore.selectedCategory)

watch(
  () => [productStore.searchQuery, productStore.selectedCategory, productStore.sortBy],
  () => { productStore.currentPage = 1 }
)

const categoryOptions = computed(() => [
  { value: null, label: 'Все категории' },
  ...categories.value.map(c => ({ value: c.slug, label: c.name })),
])

const sortOptions = [
  { value: 'name', label: 'По названию' },
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
]

function getProductCount(slug) {
  return productStore.categoryProductCount.get(slug) || 0
}
</script>
