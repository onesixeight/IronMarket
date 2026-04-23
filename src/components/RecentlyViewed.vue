<template>
  <div v-if="products.length > 0" class="mt-16">
    <div class="text-center mb-8" v-reveal>
      <h2 class="ornament-line font-heading text-xl font-bold text-cream-100 justify-center">
        Недавно просмотренные
      </h2>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      <ProductCard
        v-for="(p, i) in products"
        :key="p.id"
        :product="p"
        v-reveal="i * 0.04"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProductStore } from '../stores/products'
import { useRecentlyViewed } from '../composables/useRecentlyViewed.js'
import ProductCard from './ProductCard.vue'

const props = defineProps({
  excludeId: { type: Number, default: null },
})

const productStore = useProductStore()
const { getIds } = useRecentlyViewed()

const products = computed(() => {
  const ids = getIds(props.excludeId)
  return ids
    .map(id => productStore.getProductById(id))
    .filter(Boolean)
})
</script>
