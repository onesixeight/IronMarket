import { watchEffect, toValue, onScopeDispose } from 'vue'
import { useRoute } from 'vue-router'

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

function setOrCreateMeta(property, content, attribute = 'property') {
  let el = document.querySelector(`meta[${attribute}="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content || '')
}

export function useSeo(title, description, image, { noindex = false } = {}) {
  const route = useRoute()
  const stop = watchEffect(() => {
    const t = toValue(title)
    const d = toValue(description)
    const img = toValue(image)
    const canonicalUrl = toSiteUrl(route.path)
    const socialImage = toAbsoluteSiteUrl(img || DEFAULT_SOCIAL_IMAGE)

    const fullTitle = t
      ? `${t} | ${SITE_NAME}`
      : DEFAULT_TITLE

    document.title = fullTitle

    getMetaDesc().setAttribute(
      'content',
      d || DEFAULT_DESCRIPTION
    )

    getMetaRobots().setAttribute('content', toValue(noindex) ? 'noindex, nofollow' : 'index, follow')

    getCanonicalLink().setAttribute('href', canonicalUrl)
    setOrCreateMeta('og:title', t || DEFAULT_TITLE)
    setOrCreateMeta('og:description', d || DEFAULT_DESCRIPTION)
    setOrCreateMeta('og:url', canonicalUrl)
    // These storefront pages are websites, not articles. Product details belong
    // in schema.org JSON-LD; "product" is not a global type in https://ogp.me/.
    setOrCreateMeta('og:type', 'website')
    setOrCreateMeta('og:image', socialImage)
    setOrCreateMeta('twitter:card', 'summary_large_image', 'name')
    setOrCreateMeta('twitter:title', t || DEFAULT_TITLE, 'name')
    setOrCreateMeta('twitter:description', d || DEFAULT_DESCRIPTION, 'name')
    setOrCreateMeta('twitter:image', socialImage, 'name')
  })

  onScopeDispose(stop)
}
