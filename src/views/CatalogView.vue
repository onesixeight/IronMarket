<template>
  <div class="py-8 bg-obsidian-900 min-h-[80vh]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AppBreadcrumb :items="[{ to: '/', label: 'Главная' }, { label: 'Каталог' }]" />

      <section id="catalog-products" class="catalog-control-bar mb-8" aria-label="Фильтры каталога" v-reveal>
        <div class="catalog-control-summary">
          <span>Сейчас в подборке</span>
          <strong>{{ productStore.filteredProducts.length }} позиций</strong>
          <small>из {{ productStore.allProducts.length }} в каталоге</small>
        </div>

        <div class="catalog-control-fields">
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
      </section>

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
        class="mx-auto max-w-2xl py-20 text-center"
      >
        <div class="rounded-[2rem] border border-gold-400/12 bg-obsidian-800/70 p-8 sm:p-10">
          <svg class="w-16 h-16 mx-auto mb-5 text-gold-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <p class="font-heading text-2xl text-cream-100">
            Не нашли нужную позицию?
          </p>
          <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-100/54">
            Сбросьте фильтры или отправьте заявку: по описанию объекта мы подскажем, какие элементы лучше смотреть.
          </p>
          <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" class="metal-button-ghost justify-center" @click="resetCatalogFilters">
              Сбросить фильтры
            </button>
            <router-link :to="{ path: '/contacts', query: { task: 'gates' } }" class="metal-button justify-center">
              Подобрать элементы
            </router-link>
          </div>
        </div>
      </div>

      <section class="catalog-hero mt-12 mb-8 sm:mb-10" v-reveal>
        <div class="catalog-hero-copy">
          <div class="eyebrow mb-5">Каталог мастерской</div>
          <h1 class="section-title text-3xl sm:text-5xl lg:text-6xl leading-[0.96]">
            Кованые элементы для ворот, ограждений и лестниц.
          </h1>
          <p class="section-lead mt-5 max-w-2xl text-sm sm:text-base">
            Выбирайте декоративные детали по задаче, категории или артикулу. Если не знаете точный набор, отправьте заявку: поможем собрать аккуратную композицию под объект, объём и доставку.
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <router-link :to="{ path: '/contacts', query: { task: 'gates' } }" class="metal-button justify-center">
              Получить подбор
            </router-link>
            <router-link to="/catalog" class="metal-button-ghost justify-center">
              Смотреть позиции
            </router-link>
          </div>
        </div>

        <aside class="catalog-hero-panel" aria-label="Каталог в цифрах">
          <div class="grid gap-3">
            <div v-for="stat in catalogStats" :key="stat.label" class="catalog-hero-stat">
              <span>{{ stat.value }}</span>
              <small>{{ stat.label }}</small>
            </div>
          </div>

          <p class="mt-5 rounded-[1.25rem] border border-gold-400/12 bg-obsidian-950/48 p-4 text-sm leading-relaxed text-cream-100/58">
            Без онлайн-оплаты и случайной корзины: сайт помогает выбрать, а финальный расчёт делаем после уточнения размеров и количества.
          </p>
        </aside>
      </section>

      <CatalogProjectShortcuts class="mt-12" v-reveal="0.04" />

      <div
        v-if="!selectedCategory"
        class="catalog-category-grid mt-8 mb-16 sm:mb-20"
      >
        <router-link
          v-for="(cat, i) in categories"
          :key="cat.id"
          :to="'/catalog/' + cat.slug"
          class="catalog-category-card group"
          :style="{ '--category-index': i }"
          :aria-label="`Открыть категорию ${cat.name}`"
          v-reveal="i * 0.04"
        >
          <div class="catalog-category-image">
            <img
              :src="cat.image"
              :alt="cat.name"
              class="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </div>
          <div class="catalog-category-content">
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="catalog-category-number">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="catalog-category-count">{{ getProductCount(cat.slug) }} товаров</span>
            </div>
            <h2 class="catalog-category-title">
              {{ cat.name }}
            </h2>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useProductStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'
import CatalogProjectShortcuts from '../components/CatalogProjectShortcuts.vue'
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
const catalogStats = computed(() => [
  { value: productStore.allProducts.length, label: 'позиций в каталоге' },
  { value: categories.value.length, label: 'категорий' },
  { value: 'KZ', label: 'доставка по Казахстану' },
])

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

function resetCatalogFilters() {
  productStore.searchQuery = ''
  productStore.selectedCategory = null
  productStore.sortBy = 'name'
  productStore.currentPage = 1
}
</script>

<style scoped>
.catalog-hero {
  position: relative;
  display: grid;
  gap: 1.5rem;
  overflow: hidden;
  padding: 1.5rem;
  border: 1px solid rgba(201, 150, 59, 0.14);
  border-radius: 2rem;
  background:
    radial-gradient(circle at 14% 0%, rgba(201, 150, 59, 0.16), transparent 34%),
    radial-gradient(circle at 92% 12%, rgba(245, 240, 232, 0.08), transparent 26%),
    linear-gradient(135deg, rgba(20, 18, 16, 0.98), rgba(8, 7, 6, 0.98));
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.34);
}

.catalog-hero::before {
  content: '';
  position: absolute;
  inset: 1rem;
  pointer-events: none;
  border-radius: 1.5rem;
  border: 1px solid rgba(201, 150, 59, 0.06);
}

.catalog-hero::after {
  content: '';
  position: absolute;
  right: -8rem;
  bottom: -9rem;
  width: 22rem;
  height: 22rem;
  pointer-events: none;
  border-radius: 999px;
  background: rgba(201, 150, 59, 0.11);
  filter: blur(54px);
}

.catalog-hero-copy,
.catalog-hero-panel {
  position: relative;
  z-index: 1;
}

.catalog-hero-panel {
  display: grid;
  gap: 1rem;
  align-self: stretch;
  padding: 1rem;
  border: 1px solid rgba(201, 150, 59, 0.12);
  border-radius: 1.5rem;
  background:
    linear-gradient(180deg, rgba(10, 9, 8, 0.66), rgba(10, 9, 8, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.catalog-hero-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(201, 150, 59, 0.1);
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.035);
}

.catalog-hero-stat span {
  color: rgb(228, 185, 109);
  font-family: var(--font-heading);
  font-size: 1.65rem;
  line-height: 1;
}

.catalog-hero-stat small {
  max-width: 9rem;
  color: rgba(245, 240, 232, 0.48);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1.4;
  text-align: right;
  text-transform: uppercase;
}

.catalog-category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.catalog-category-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(201, 150, 59, 0.1);
  border-radius: 1.35rem;
  background:
    radial-gradient(circle at 50% 0%, rgba(201, 150, 59, 0.08), transparent 42%),
    linear-gradient(180deg, rgba(20, 18, 16, 0.96), rgba(10, 9, 8, 0.98));
  transition:
    transform 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.35s ease;
  transition-delay: calc(var(--category-index) * 8ms);
}

.catalog-category-card:hover,
.catalog-category-card:focus-visible {
  transform: translateY(-4px);
  border-color: rgba(201, 150, 59, 0.34);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.34),
    0 0 28px rgba(201, 150, 59, 0.08);
  outline: none;
}

.catalog-category-card:focus-visible {
  box-shadow:
    0 0 0 3px rgba(201, 150, 59, 0.18),
    0 18px 42px rgba(0, 0, 0, 0.34);
}

.catalog-category-card::after {
  content: '';
  position: absolute;
  inset: auto -24% -46% 16%;
  height: 7rem;
  pointer-events: none;
  border-radius: 999px;
  background: rgba(201, 150, 59, 0.1);
  filter: blur(34px);
}

.catalog-category-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 7.75rem;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(245, 240, 232, 0.06), rgba(10, 9, 8, 0.04));
}

.catalog-category-content {
  position: relative;
  z-index: 1;
  padding: 0.9rem;
  border-top: 1px solid rgba(201, 150, 59, 0.1);
}

.catalog-category-number,
.catalog-category-count {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.catalog-category-number {
  color: rgba(228, 185, 109, 0.84);
}

.catalog-category-count {
  color: rgba(245, 240, 232, 0.36);
}

.catalog-category-title {
  min-height: 2.4rem;
  color: rgb(245, 240, 232);
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.25;
}

.catalog-control-bar {
  position: relative;
  z-index: 20;
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgba(201, 150, 59, 0.12);
  border-radius: 1.5rem;
  background:
    radial-gradient(circle at 12% 0%, rgba(201, 150, 59, 0.08), transparent 30%),
    linear-gradient(180deg, rgba(20, 18, 16, 0.92), rgba(10, 9, 8, 0.94));
  box-shadow: 0 20px 52px rgba(0, 0, 0, 0.24);
}

.catalog-control-summary {
  display: grid;
  gap: 0.25rem;
  min-width: 12rem;
}

.catalog-control-summary span,
.catalog-control-summary small {
  color: rgba(245, 240, 232, 0.42);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.catalog-control-summary strong {
  color: rgb(228, 185, 109);
  font-family: var(--font-heading);
  font-size: 1.65rem;
  line-height: 1.1;
}

.catalog-control-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .catalog-hero {
    padding: 2rem;
  }

  .catalog-category-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .catalog-hero {
    grid-template-columns: minmax(0, 1fr) 22rem;
    align-items: stretch;
    padding: 2.5rem;
  }

  .catalog-category-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .catalog-control-bar {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    padding: 1.15rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .catalog-category-card {
    transition-delay: 0ms;
  }
}
</style>
