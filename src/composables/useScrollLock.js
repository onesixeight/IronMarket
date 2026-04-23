let lockCount = 0

export function lockScroll() {
  if (++lockCount === 1) {
    document.body.classList.add('overflow-hidden')
  }
}

export function unlockScroll() {
  if (lockCount <= 0) return
  if (--lockCount === 0) {
    document.body.classList.remove('overflow-hidden')
  }
}
