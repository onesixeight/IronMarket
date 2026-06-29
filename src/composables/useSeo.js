import { watchEffect, toValue, onScopeDispose } from 'vue'

import { DEFAULT_SOCIAL_IMAGE, SITE_NAME, toAbsoluteSiteUrl, toSiteUrl } from '../config/site.js'
const DEFAULT_TITLE = 'Эталон Ковка — кованые элементы в Астане'
const DEFAULT_DESCRIPTION = 'Каталог кованых элементов, узоров и комплектующих с подбором и поставкой по Астане и Казахстану.'

let cachedMetaDesc = null
let cachedMetaRobots = null
let cachedCanonical = null

function getMetaDesc() {
  if (cachedMetaDesc) return cachedMetaDesc
  cachedMetaDesc = document.querySelector('meta[name="description"]')
  if (!cachedMetaDesc) {
    cachedMetaDesc = document.createElement('meta')
    cachedMetaDesc.setAttribute('name', 'description')
    document.head.appendChild(cachedMetaDesc)
  }
  return cachedMetaDesc
}

function getMetaRobots() {
  if (cachedMetaRobots) return cachedMetaRobots
  cachedMetaRobots = document.querySelector('meta[name="robots"]')
  if (!cachedMetaRobots) {
    cachedMetaRobots = document.createElement('meta')
    cachedMetaRobots.setAttribute('name', 'robots')
    document.head.appendChild(cachedMetaRobots)
  }
  return cachedMetaRobots
}

function getCanonicalLink() {
  if (cachedCanonical) return cachedCanonical
  cachedCanonical = document.querySelector('link[rel="canonical"]')
  if (!cachedCanonical) {
    cachedCanonical = document.createElement('link')
    cachedCanonical.setAttribute('rel', 'canonical')
    document.head.appendChild(cachedCanonical)
  }
  return cachedCanonical
}

function getCurrentPath() {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname || '/'
}

function toCanonicalUrl(path = getCurrentPath()) {
  const cleanPath = path === '/' ? '/' : `/${String(path).replace(/^\/+|\/+$/g, '')}`
  return toSiteUrl(cleanPath)
}

function setCanonicalUrl(url) {
  getCanonicalLink().setAttribute('href', url)
}

function setOrCreateMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content || '')
}

function setOrCreateMetaName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content || '')
}

export function useSeo(title, description, image, { noindex = false } = {}) {
  const stop = watchEffect(() => {
    const t = toValue(title)
    const d = toValue(description)
    const img = toValue(image)
    const canonicalUrl = toCanonicalUrl()
    const socialImage = toAbsoluteSiteUrl(img || DEFAULT_SOCIAL_IMAGE)

    const fullTitle = t
      ? `${t} | ${SITE_NAME}`
      : DEFAULT_TITLE

    document.title = fullTitle

    getMetaDesc().setAttribute(
      'content',
      d || 'Кованые элементы, узоры, балясины и комплектующие с продажей и поставкой в Астане и по Казахстану.'
    )

    getMetaRobots().setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow')

    setCanonicalUrl(canonicalUrl)
    setOrCreateMeta('og:title', t || DEFAULT_TITLE)
    setOrCreateMeta('og:description', d || DEFAULT_DESCRIPTION)
    setOrCreateMeta('og:url', canonicalUrl)
    setOrCreateMeta('og:type', 'website')
    setOrCreateMeta('og:image', socialImage)
    setOrCreateMetaName('twitter:card', 'summary_large_image')
    setOrCreateMetaName('twitter:title', t || DEFAULT_TITLE)
    setOrCreateMetaName('twitter:description', d || DEFAULT_DESCRIPTION)
    setOrCreateMetaName('twitter:image', socialImage)
  })

  onScopeDispose(stop)
}
