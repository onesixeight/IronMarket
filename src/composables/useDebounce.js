export function debounce(fn, delay = 300, options = {}) {
  const { leading = false, trailing = true } = options
  let timer = null
  let lastArgs = null
  let lastThis = null
  let lastResult

  function invoke() {
    const args = lastArgs
    const context = lastThis

    lastArgs = null
    lastThis = null
    lastResult = fn.apply(context, args)

    return lastResult
  }

  function debounced(...args) {
    lastArgs = args
    lastThis = this

    const shouldCallLeading = leading && !timer

    if (timer) clearTimeout(timer)

    if (shouldCallLeading) {
      invoke()
    }

    timer = setTimeout(() => {
      timer = null

      if (trailing && lastArgs) {
        invoke()
        return
      }

      lastArgs = null
      lastThis = null
    }, delay)

    return lastResult
  }

  debounced.cancel = function () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    lastArgs = null
    lastThis = null
  }

  debounced.flush = function () {
    if (!timer) return lastResult

    clearTimeout(timer)
    timer = null

    if (trailing && lastArgs) {
      return invoke()
    }

    lastArgs = null
    lastThis = null

    return lastResult
  }

  return debounced
}
