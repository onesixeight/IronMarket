import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useProductStore } from './products'
import { loadStorage, saveStorage } from '../composables/useStorage.js'

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ⚠️ Client-side only authentication. Replace with server-side check for production.
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
    return loadStorage('admin-products')
  }

  function saveProducts() {
    const productsStore = _getProductStore()
    saveStorage('admin-products', productsStore.allProducts)
  }

  function initAdminProducts() {
    const stored = _loadAdminProducts()
    if (stored && Array.isArray(stored)) {
      const productsStore = _getProductStore()
      productsStore.setProducts(stored)
    }
  }

  function addProduct(product) {
    const productsStore = _getProductStore()
    const newProduct = productsStore.addProduct(product)
    saveProducts()
    return newProduct
  }

  function updateProduct(id, data) {
    const productsStore = _getProductStore()
    const updated = productsStore.updateProduct(id, data)
    if (updated) saveProducts()
    return updated
  }

  function deleteProduct(id) {
    const productsStore = _getProductStore()
    const success = productsStore.deleteProduct(id)
    if (success) saveProducts()
    return success
  }

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
