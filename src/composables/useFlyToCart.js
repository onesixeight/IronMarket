import { inject, onUnmounted } from 'vue'

export function useFlyToCart() {
  const cartButtonRef = inject('cartButtonRef', null)
  let animTimer = null
  let bounceTimer = null

  onUnmounted(() => {
    clearTimeout(animTimer)
    clearTimeout(bounceTimer)
  })

  function flyFromElement(triggerEl) {
    if (!triggerEl || !cartButtonRef?.value) return

    clearTimeout(animTimer)
    clearTimeout(bounceTimer)

    const start = triggerEl.getBoundingClientRect()
    const end = cartButtonRef.value.getBoundingClientRect()

    const dot = document.createElement('div')
    dot.style.cssText = `
      position: fixed;
      z-index: 100;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #c9963b;
      box-shadow: 0 0 12px rgba(201, 150, 59, 0.6);
      pointer-events: none;
      left: ${start.left + start.width / 2 - 7}px;
      top: ${start.top + start.height / 2 - 7}px;
      transition: all 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    `
    document.body.appendChild(dot)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dot.style.left = `${end.left + end.width / 2 - 7}px`
        dot.style.top = `${end.top + end.height / 2 - 7}px`
        dot.style.transform = 'scale(0.3)'
        dot.style.opacity = '0.4'
      })
    })

    animTimer = setTimeout(() => {
      dot.remove()
      cartButtonRef.value?.classList.add('cart-bounce')
      bounceTimer = setTimeout(() => cartButtonRef.value?.classList.remove('cart-bounce'), 400)
    }, 550)
  }

  return { flyFromElement }
}
