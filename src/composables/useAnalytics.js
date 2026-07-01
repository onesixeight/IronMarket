import {
  initGoogleAnalytics,
  trackGoogleEvent,
  trackGooglePageView,
} from './useGoogleAnalytics.js'
import {
  initYandexMetrika,
  trackGoal as trackYandexGoal,
  trackYandexPageView,
} from './useYandexMetrika.js'

let initialized = false
let lastPageLocation = ''

export function initAnalytics() {
  if (typeof window === 'undefined' || initialized) return

  const hasGoogleAnalytics = initGoogleAnalytics()
  const hasYandexMetrika = initYandexMetrika()
  initialized = hasGoogleAnalytics || hasYandexMetrika

  if (initialized) {
    trackPageView()
  }
}

export function trackPageView(path) {
  if (typeof window === 'undefined' || !initialized) return

  const payload = buildPageViewPayload(path)

  trackGooglePageView(payload)
  trackYandexPageView(payload.pagePath, {
    title: payload.pageTitle,
    referer: payload.pageReferrer,
  })

  lastPageLocation = payload.pageLocation
}

export function trackGoal(target, params = {}) {
  if (!target || !initialized) return

  trackGoogleEvent(target, params)
  trackYandexGoal(target, params)
}

export function trackCatalogOpen(params = {}) {
  trackGoal('catalog_open', params)
}

export function trackContactFormOpen(params = {}) {
  trackGoal('contact_form_open', params)
}

export function trackLead(channel, params = {}) {
  if (!channel || !initialized) return

  const payload = {
    method: channel,
    ...params,
  }

  trackGoogleEvent('generate_lead', payload)
  trackYandexGoal(`lead_${channel}`, payload)
}

export function trackProductOpen(product, params = {}) {
  if (!product || !initialized) return

  const payload = {
    item_id: product.id,
    item_name: product.name,
    item_category: product.categorySlug,
    ...params,
  }

  trackGoogleEvent('select_item', payload)
  trackYandexGoal('product_open', payload)
}

function buildPageViewPayload(path) {
  const pagePath = normalizePagePath(path)
  const pageLocation = new URL(pagePath, window.location.origin).href

  return {
    pagePath,
    pageLocation,
    pageTitle: document.title,
    pageReferrer: lastPageLocation || document.referrer || undefined,
  }
}

function normalizePagePath(path) {
  const rawPath =
    path || `${window.location.pathname}${window.location.search}${window.location.hash}` || '/'

  try {
    const url = new URL(rawPath, window.location.origin)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return String(rawPath || '/')
  }
}
