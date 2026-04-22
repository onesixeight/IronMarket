import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useProductStore } from './products'

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const ADMIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'

export const useAdminStore = defineStore('admin', () => {
  const isAuthenticated = ref(localStorage.getItem('admin-auth') === 'true')

  async function login(password) {
    const hash = await sha256(password)
    if (hash === ADMIN_HASH) {
      isAuthenticated.value = true
      localStorage.setItem('admin-auth', 'true')
      return true
    }
    return false
  }

  function logout() {
    isAuthenticated.value = false
    localStorage.removeItem('admin-auth')
  }

  function _getProductStore() {
    return useProductStore()
  }

  function _loadAdminProducts() {
    try {
      const stored = localStorage.getItem('admin-products')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {}
    return null
  }

  function saveProducts() {
    const productsStore = _getProductStore()
    localStorage.setItem('admin-products', JSON.stringify(productsStore.allProducts))
  }

  function initAdminProducts() {
    const stored = _loadAdminProducts()
    if (stored) {
      const productsStore = _getProductStore()
      productsStore.allProducts = stored
    }
  }

  function addProduct(product) {
    const productsStore = _getProductStore()
    const maxId = productsStore.allProducts.reduce((max, p) => Math.max(max, p.id), 0)
    const newProduct = { ...product, id: maxId + 1 }
    productsStore.allProducts.push(newProduct)
    saveProducts()
    return newProduct
  }

  function updateProduct(id, data) {
    const productsStore = _getProductStore()
    const index = productsStore.allProducts.findIndex(p => p.id === id)
    if (index !== -1) {
      productsStore.allProducts[index] = { ...productsStore.allProducts[index], ...data }
      saveProducts()
      return productsStore.allProducts[index]
    }
    return null
  }

  function deleteProduct(id) {
    const productsStore = _getProductStore()
    const index = productsStore.allProducts.findIndex(p => p.id === id)
    if (index !== -1) {
      productsStore.allProducts.splice(index, 1)
      saveProducts()
      return true
    }
    return false
  }

  initAdminProducts()

  return {
    isAuthenticated,
    login,
    logout,
    addProduct,
    updateProduct,
    deleteProduct,
    saveProducts,
    initAdminProducts,
  }
})
