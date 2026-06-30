export const SITE_ORIGIN = 'https://etalon-kovka.kz'
export const SITE_NAME = 'Эталон Ковка'
export const DEFAULT_SOCIAL_IMAGE = '/images/branding/brand-mark-ornament.png'
export const DEFAULT_PRODUCT_IMAGE = '/images/branding/brand-mark-ornament-small.webp'

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value))
}

export function toSiteUrl(path = '/') {
  const value = String(path || '/')
  if (isAbsoluteUrl(value)) return value

  const normalizedPath = value === '/' ? '/' : `/${value.replace(/^\/+|\/+$/g, '')}`
  return `${SITE_ORIGIN}${normalizedPath}`
}

export function toAbsoluteSiteUrl(url = DEFAULT_SOCIAL_IMAGE) {
  const value = String(url || DEFAULT_SOCIAL_IMAGE)
  return isAbsoluteUrl(value) ? value : toSiteUrl(value)
}
