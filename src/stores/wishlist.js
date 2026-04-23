import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadStorage, saveStorage } from '../composables/useStorage.js'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref(loadStorage('wishlist-items', []))

  const wishedSet = computed(() => new Set(items.value.map(i => i.id)))

  function save() {
    saveStorage('wishlist-items', items.value)
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
        oldPrice: product.oldPrice,
        image: product.image,
        categorySlug: product.categorySlug,
        badge: product.badge,
        material: product.material,
        hidePrice: product.hidePrice,
      })
    }
    save()
  }

  function isWished(productId) {
    return wishedSet.value.has(productId)
  }

  function clear() {
    items.value = []
    save()
  }

  const totalItems = computed(() => items.value.length)

  return { items, totalItems, toggle, isWished, clear }
})
