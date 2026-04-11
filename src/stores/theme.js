import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const dark = ref(localStorage.getItem('theme') === 'dark')

  function apply() {
    document.documentElement.setAttribute('data-theme', dark.value ? 'dark' : 'light')
  }

  function toggle() {
    dark.value = !dark.value
  }

  watch(dark, () => {
    localStorage.setItem('theme', dark.value ? 'dark' : 'light')
    apply()
  }, { immediate: true })

  return { dark, toggle }
})
