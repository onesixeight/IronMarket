import { nextTick, onMounted, onScopeDispose, watch } from 'vue'
import { lockScroll, unlockScroll } from './useScrollLock.js'

export function useConstructorDialog(element, isOpen, close) {
  let previousFocus
  let locked = false
  async function sync(open) {
    await nextTick()
    if (!element.value) return
    if (open && !element.value.open) {
      previousFocus = document.activeElement
      element.value.showModal()
      lockScroll()
      locked = true
    } else if (!open && element.value.open) {
      element.value.close()
      if (locked) {
        unlockScroll()
        locked = false
      }
      previousFocus?.focus?.()
    }
  }
  watch(isOpen, sync)
  onMounted(() => sync(isOpen()))
  onScopeDispose(() => {
    if (locked) unlockScroll()
  })
  return {
    cancel: (event) => {
      event.preventDefault()
      close()
    },
  }
}
