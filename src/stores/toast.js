import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let idCounter = 0

  function add(message, type = 'success', duration = 3000) {
    const id = ++idCounter
    const timer = setTimeout(() => remove(id), duration)
    toasts.value.push({ id, message, type, timer })
  }

  function remove(id) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx >= 0) {
      const toast = toasts.value[idx]
      if (toast.timer) clearTimeout(toast.timer)
      toasts.value.splice(idx, 1)
    }
  }

  function success(message) { add(message, 'success') }
  function error(message) { add(message, 'error', 4000) }
  function info(message) { add(message, 'info') }

  return { toasts, add, remove, success, error, info }
})
