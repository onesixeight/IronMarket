function setupReveal(el, delay = 0, threshold = 0.1) {
  el.style.opacity = '0'
  el.style.transform = 'translateY(24px)'
  el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
        observer.unobserve(el)
      }
    },
    { threshold }
  )
  observer.observe(el)
  el._scrollObserver = observer
}

function teardownReveal(el) {
  if (el._scrollObserver) {
    el._scrollObserver.disconnect()
    delete el._scrollObserver
  }
}

export function useScrollReveal() {
  function mounted(el, binding) {
    const delay = binding.value?.delay || 0
    const threshold = binding.value?.threshold || 0.1
    setupReveal(el, delay, threshold)
  }

  function unmounted(el) {
    teardownReveal(el)
  }

  return { mounted, unmounted }
}

export const vReveal = {
  mounted(el, binding) {
    const delay = typeof binding.value === 'number' ? binding.value : 0
    setupReveal(el, delay, 0.1)
  },
  unmounted(el) {
    teardownReveal(el)
  },
}
