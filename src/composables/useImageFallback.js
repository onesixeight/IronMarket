import { DEFAULT_PRODUCT_IMAGE } from '../config/site.js'

export function applyImageFallback(event, fallback = DEFAULT_PRODUCT_IMAGE) {
  const image = event?.target
  if (!image || image.dataset.fallbackApplied === 'true') return

  image.dataset.fallbackApplied = 'true'
  image.src = fallback
}
