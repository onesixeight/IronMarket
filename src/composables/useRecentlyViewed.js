import { getCurrentInstance, inject, ref } from 'vue'
import { loadStorage, saveStorage } from './useStorage.js'

const MAX_ITEMS = 8
const STORAGE_KEY = 'recently-viewed'
const recentlyViewedKey = Symbol('recently-viewed')

export function createRecentlyViewedStore({
  maxItems = MAX_ITEMS,
  storageKey = STORAGE_KEY,
  storage,
} = {}) {
  const items = ref(loadStorage(storageKey, [], storage))

  function add(productId) {
    const id = Number(productId)
    if (!Number.isFinite(id)) return

    const current = items.value.filter(i => i !== id)
    current.unshift(id)
    items.value = current.slice(0, maxItems)
    saveStorage(storageKey, items.value, storage)
  }

  function getIds(excludeId) {
    const excluded = Number(excludeId)
    if (!Number.isFinite(excluded)) return items.value

    return items.value.filter(id => id !== excluded)
  }

  return {
    items,
    add,
    getIds,
  }
}

export function provideRecentlyViewed(app, options) {
  const store = createRecentlyViewedStore(options)
  app.provide(recentlyViewedKey, store)
  return store
}

export function useRecentlyViewed() {
  if (!getCurrentInstance()) {
    return createRecentlyViewedStore()
  }

  return inject(recentlyViewedKey, null) ?? createRecentlyViewedStore()
}
