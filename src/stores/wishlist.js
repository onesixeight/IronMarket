import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref(JSON.parse(localStorage.getItem('wishlist-items') || '[]'))

  function save() {
    localStorage.setItem('wishlist-items', JSON.stringify(items.value))
  }

  function toggle(product) {
    const idx = items.value.findIndex(i => i.id === product.id)
    if (idx >= 0) {
      items.value.splice(idx, 1)
    } else {
      items.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        categorySlug: product.categorySlug,
      })
    }
    save()
  }

  function isWished(productId) {
    return items.value.some(i => i.id === productId)
  }

  function clear() {
    items.value = []
    save()
  }

  const totalItems = computed(() => items.value.length)

  return { items, totalItems, toggle, isWished, clear }
})
