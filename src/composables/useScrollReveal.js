function setupReveal(el, delay = 0, threshold = 0.1) {
  const delayClass = `reveal-delay-${Math.min(Math.max(Math.round(delay * 100), 0), 40)}`
  el.classList.add('reveal-pending', delayClass)

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('reveal-visible')
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
  el.classList.remove('reveal-pending', 'reveal-visible')
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
