<template>
  <div class="py-8" style="background: var(--color-obsidian-900); min-height: 80vh;">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex items-center gap-2 text-sm mb-8">
        <router-link to="/" class="transition-colors duration-200" style="color: var(--color-gold-600);" @mouseenter="$event.target.style.color = 'var(--color-gold-400)'" @mouseleave="$event.target.style.color = 'var(--color-gold-600)'">Главная</router-link>
        <span style="color: var(--color-obsidian-500);">/</span>
        <span style="color: var(--color-cream-100);">Каталог</span>
      </nav>

      <div class="text-center mb-12" v-reveal>
        <h1
          class="ornament-line text-3xl sm:text-4xl font-bold mb-4 justify-center"
          style="font-family: var(--font-heading); color: var(--color-gold-400);"
        >
          Каталог продукции
        </h1>
        <p
          class="max-w-xl mx-auto text-base leading-relaxed"
          style="color: var(--color-cream-100); opacity: 0.6;"
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
          class="group rounded-xl overflow-hidden transition-all duration-500 ease-out border"
          :style="{
            background: 'var(--color-obsidian-800)',
            borderColor: 'rgba(201,150,59,0.08)',
          }"
          v-reveal="i * 0.04"
          @mouseenter="$event.currentTarget.style.borderColor = 'rgba(201,150,59,0.3)'; $event.currentTarget.style.transform = 'translateY(-4px)'; $event.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(201,150,59,0.08)'"
          @mouseleave="$event.currentTarget.style.borderColor = 'rgba(201,150,59,0.08)'; $event.currentTarget.style.transform = ''; $event.currentTarget.style.boxShadow = ''"
        >
          <div
            class="p-4 h-28 flex items-center justify-center"
            style="background: var(--color-obsidian-700);"
          >
            <img
              :src="cat.image"
              :alt="cat.name"
              class="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          <div
            class="p-2.5 text-center"
            style="border-top: 1px solid rgba(201,150,59,0.08); background: var(--color-obsidian-800);"
          >
            <h2
              class="text-xs font-medium leading-snug transition-colors duration-300"
              style="color: var(--color-cream-100);"
            >
              {{ cat.name }}
            </h2>
            <p class="text-[10px] mt-0.5" style="color: var(--color-obsidian-500);">
              {{ getProductCount(cat.slug) }} товаров
            </p>
          </div>
        </router-link>
      </div>

      <div class="mb-8" v-reveal>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style="color: var(--color-obsidian-500);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
              <input
                v-model="productStore.searchQuery"
                type="text"
                placeholder="Поиск по каталогу..."
                class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
                style="background: var(--color-obsidian-800); border: 1px solid rgba(201,150,59,0.1); color: var(--color-cream-100);"
                @focus="$event.target.style.borderColor = 'var(--color-gold-400)'; $event.target.style.boxShadow = '0 0 0 3px rgba(201,150,59,0.15)'"
                @blur="$event.target.style.borderColor = 'rgba(201,150,59,0.1)'; $event.target.style.boxShadow = 'none'"
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
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ProductCard v-for="p in productStore.paginatedProducts" :key="p.id" :product="p" />
      </div>

      <Pagination
        :current-page="productStore.currentPage"
        :total-pages="productStore.totalPages"
        @update:current-page="productStore.currentPage = $event"
      />

      <div
        v-if="productStore.filteredProducts.length === 0"
        class="text-center py-20"
      >
        <svg class="w-16 h-16 mx-auto mb-4" style="color: var(--color-obsidian-600);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
        <p class="text-lg font-bold" style="font-family: var(--font-heading); color: var(--color-cream-100); opacity: 0.5;">
          Товары не найдены
        </p>
        <p class="text-sm mt-1" style="color: var(--color-obsidian-500);">
          Попробуйте изменить параметры поиска
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import catalog from '../data/catalog.json'
import { useProductStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'
import CustomSelect from '../components/CustomSelect.vue'
import Pagination from '../components/Pagination.vue'
import { useSeo } from '../composables/useSeo'

useSeo('Каталог продукции', 'Полный каталог декоративных кованых изделий: короны, узоры, балясины, уголки и другие элементы.')

const productStore = useProductStore()
const categories = catalog.categories
const selectedCategory = computed(() => productStore.selectedCategory)

watch(
  () => [productStore.searchQuery, productStore.selectedCategory, productStore.sortBy],
  () => { productStore.currentPage = 1 }
)

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
