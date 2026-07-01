import assert from 'node:assert/strict'
import { createRecentlyViewedStore } from '../src/composables/useRecentlyViewed.js'
import { loadStorage } from '../src/composables/useStorage.js'

function createMemoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed))

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null
    },
    setItem(key, value) {
      data.set(key, String(value))
    },
    removeItem(key) {
      data.delete(key)
    },
  }
}

{
  const storage = createMemoryStorage()
  const store = createRecentlyViewedStore({ storage, maxItems: 3 })

  store.add(101)
  store.add(102)
  store.add(103)
  store.add(104)

  assert.deepEqual(store.items.value, [104, 103, 102])
  assert.equal(storage.getItem('recently-viewed'), '[104,103,102]')

  store.add(103)
  store.add('bad-id')

  assert.deepEqual(store.items.value, [103, 104, 102])
  assert.deepEqual(store.getIds(104), [103, 102])
}

{
  const storage = createMemoryStorage({ 'recently-viewed': '[7,8]' })
  const firstStore = createRecentlyViewedStore({ storage })
  const secondStore = createRecentlyViewedStore({ storage })

  firstStore.add(9)

  assert.deepEqual(firstStore.items.value, [9, 7, 8])
  assert.deepEqual(secondStore.items.value, [7, 8])
}

{
  const store = createRecentlyViewedStore({ storage: null })

  store.add(5)

  assert.deepEqual(store.items.value, [5])
}

{
  const storage = createMemoryStorage({ 'recently-viewed': '{"invalid":true}' })

  assert.deepEqual(loadStorage('recently-viewed', [], storage), [])
  assert.equal(storage.getItem('recently-viewed'), null)
}
