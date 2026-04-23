import { ref } from 'vue'
import { loadStorage, saveStorage } from './useStorage.js'

const MAX_ITEMS = 8
const STORAGE_KEY = 'recently-viewed'

const items = ref(loadStorage(STORAGE_KEY) || [])

export function useRecentlyViewed() {
  function add(productId) {
    const id = Number(productId)
    const current = items.value.filter(i => i !== id)
    current.unshift(id)
    items.value = current.slice(0, MAX_ITEMS)
    saveStorage(STORAGE_KEY, items.value)
  }

  function getIds(excludeId) {
    return items.value.filter(id => id !== Number(excludeId))
  }

  return {
    items,
    add,
    getIds,
  }
}
