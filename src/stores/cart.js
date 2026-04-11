import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('cart-items') || '[]'))

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  function save() {
    localStorage.setItem('cart-items', JSON.stringify(items.value))
  }

  function addItem(product, quantity = 1) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        slug: product.slug,
        quantity,
      })
    }
    save()
  }

  function removeItem(productId) {
    items.value = items.value.filter(i => i.id !== productId)
    save()
  }

  function updateQuantity(productId, quantity) {
    const item = items.value.find(i => i.id === productId)
    if (item) {
      item.quantity = Math.max(1, quantity)
      save()
    }
  }

  function clearCart() {
    items.value = []
    save()
  }

  return { items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }
})
