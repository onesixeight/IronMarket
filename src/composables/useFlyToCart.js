import { inject, onUnmounted } from 'vue'

export function useFlyToCart() {
  const cartButtonRef = inject('cartButtonRef', null)
  let bounceTimer = null

  onUnmounted(() => {
    clearTimeout(bounceTimer)
  })

  function flyFromElement(triggerEl) {
    if (!triggerEl || !cartButtonRef?.value) return

    clearTimeout(bounceTimer)

    cartButtonRef.value.classList.add('cart-bounce')
    bounceTimer = setTimeout(() => cartButtonRef.value?.classList.remove('cart-bounce'), 400)
  }

  return { flyFromElement }
}
