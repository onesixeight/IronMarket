<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AppBreadcrumb :items="[{ to: '/', label: 'Главная' }, { to: '/catalog', label: 'Каталог' }, { label: category?.name }]" />

      <div v-if="category">
        <div class="mb-10" v-reveal>
          <h1 class="ornament-line font-heading text-3xl sm:text-4xl font-semibold text-cream-50 mb-4">{{ category.name }}</h1>
          <p class="text-cream-100/70 max-w-3xl text-[15px]">{{ category.description }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ProductCard v-for="(p, i) in paginatedProducts" :key="p.id" :product="p" v-reveal="i * 0.04" />
        </div>

        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @update:current-page="currentPage = $event"
        />

        <div v-if="products.length === 0" class="text-center py-20 animate-fade-in">
          <svg class="w-16 h-16 mx-auto text-obsidian-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
          </svg>
          <p class="text-cream-100/60 text-lg font-heading">В этой категории пока нет товаров</p>
        </div>
      </div>

      <div v-else class="text-center py-20 animate-fade-in">
        <h1 class="font-heading text-3xl font-semibold text-cream-50 mb-4">Категория не найдена</h1>
        <router-link to="/catalog" class="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-500 transition-colors group">
          <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
          Вернуться в каталог
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../stores/products'
import ProductCard from '../components/ProductCard.vue'
import Pagination from '../components/Pagination.vue'
import { useSeo } from '../composables/useSeo'
import { useSchemaOrg, schemaItemList } from '../composables/useSchemaOrg.js'
import AppBreadcrumb from '../components/AppBreadcrumb.vue'

const route = useRoute()
const productStore = useProductStore()
const currentPage = ref(1)
const perPage = 20

const category = computed(() => productStore.getCategoryBySlug(route.params.slug))
const products = computed(() => productStore.getProductsByCategory(route.params.slug))
const totalPages = computed(() => Math.ceil(products.value.length / perPage))

useSchemaOrg(() => schemaItemList(products.value, category.value?.name || 'Категория'))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return products.value.slice(start, start + perPage)
})

watch(() => route.params.slug, () => { currentPage.value = 1 })

const seoTitle = computed(() => category.value ? category.value.name : 'Категория')
const seoDesc = computed(() => category.value?.description)
useSeo(seoTitle, seoDesc)
</script>
