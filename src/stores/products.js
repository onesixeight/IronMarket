import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import catalog from '../data/catalog.json'

export const useProductStore = defineStore('products', () => {
  const categories = ref(catalog.categories)
  const allProducts = ref(catalog.products)
  const searchQuery = ref('')
  const selectedCategory = ref(null)
  const sortBy = ref('name')
  const priceMin = ref(0)
  const priceMax = ref(0)
  const currentPage = ref(1)
  const perPage = 20

  const allPriceRange = computed(() => {
    const prices = allProducts.value.map(p => p.price)
    if (prices.length === 0) return { min: 0, max: 0 }
    return { min: Math.min(...prices), max: Math.max(...prices) }
  })

  const categoryProductCount = computed(() => {
    const map = new Map()
    for (const p of allProducts.value) {
      map.set(p.categorySlug, (map.get(p.categorySlug) || 0) + 1)
    }
    return map
  })

  const filteredProducts = computed(() => {
    let result = allProducts.value
    if (selectedCategory.value) {
      result = result.filter(p => p.categorySlug === selectedCategory.value)
    }
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
    }
    if (priceMin.value > 0) {
      result = result.filter(p => p.price >= priceMin.value)
    }
    if (priceMax.value > 0) {
      result = result.filter(p => p.price <= priceMax.value)
    }
    switch (sortBy.value) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price)
        break
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    return result
  })

  const totalPages = computed(() => Math.ceil(filteredProducts.value.length / perPage))
  const paginatedProducts = computed(() => {
    const start = (currentPage.value - 1) * perPage
    return filteredProducts.value.slice(start, start + perPage)
  })

  function getCategoryBySlug(slug) {
    return categories.value.find(c => c.slug === slug)
  }

  function getProductsByCategory(slug) {
    return allProducts.value.filter(p => p.categorySlug === slug)
  }

  function getProductById(id) {
    return allProducts.value.find(p => p.id === id)
  }

  function getRelatedProducts(productId) {
    const product = getProductById(productId)
    if (!product) return []
    return allProducts.value
      .filter(p => p.categorySlug === product.categorySlug && p.id !== productId)
      .slice(0, 4)
  }

  function searchProducts(query) {
    if (!query) return []
    const q = query.toLowerCase()
    return allProducts.value
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 5)
  }

  function setProducts(products) {
    allProducts.value = Array.isArray(products) ? products : []
  }

  function addProduct(product) {
    const maxId = allProducts.value.reduce((max, p) => Math.max(max, p.id), 0)
    const newProduct = { ...product, id: maxId + 1 }
    allProducts.value = [...allProducts.value, newProduct]
    return newProduct
  }

  function updateProduct(id, data) {
    const index = allProducts.value.findIndex(p => p.id === id)
    if (index !== -1) {
      const updated = { ...allProducts.value[index], ...data }
      allProducts.value = allProducts.value.map((p, i) => (i === index ? updated : p))
      return updated
    }
    return null
  }

  function deleteProduct(id) {
    const index = allProducts.value.findIndex(p => p.id === id)
    if (index !== -1) {
      allProducts.value = allProducts.value.filter(p => p.id !== id)
      return true
    }
    return false
  }

  return {
    categories, allProducts, searchQuery, selectedCategory, sortBy,
    priceMin, priceMax, currentPage, perPage,
    filteredProducts, paginatedProducts, totalPages, allPriceRange, categoryProductCount,
    getCategoryBySlug, getProductsByCategory, getProductById,
    getRelatedProducts, searchProducts,
    setProducts, addProduct, updateProduct, deleteProduct,
  }
})
