export const GOOGLE_ANALYTICS_ID = String(import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '').trim()

const GOOGLE_SCRIPT_ID = 'google-analytics-gtag'
const GOOGLE_SCRIPT_SRC = 'https://www.googletagmanager.com/gtag/js'
const GOOGLE_PLACEHOLDER_IDS = new Set(['G-XXXXXXXXXX', 'TAG_ID', 'G-0000000000'])

let loaded = false

export function isGoogleAnalyticsConfigured() {
  return Boolean(GOOGLE_ANALYTICS_ID) && !GOOGLE_PLACEHOLDER_IDS.has(GOOGLE_ANALYTICS_ID)
}

export function initGoogleAnalytics() {
  if (typeof window === 'undefined' || !isGoogleAnalyticsConfigured()) return false
  if (loaded) return true

  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments)
    }

  if (!document.getElementById(GOOGLE_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.async = true
    script.src = `${GOOGLE_SCRIPT_SRC}?id=${encodeURIComponent(GOOGLE_ANALYTICS_ID)}`
    document.head.appendChild(script)
  }

  window.gtag('js', new Date())
  window.gtag('config', GOOGLE_ANALYTICS_ID, {
    send_page_view: false,
  })

  loaded = true
  return true
}

export function trackGooglePageView(payload = {}) {
  if (typeof window === 'undefined' || !loaded || !window.gtag) return

  const pageView = {
    page_path: payload.pagePath,
    page_location: payload.pageLocation,
    page_title: payload.pageTitle || document.title,
  }

  if (payload.pageReferrer) {
    pageView.page_referrer = payload.pageReferrer
  }

  window.gtag('event', 'page_view', pageView)
}

export function trackGoogleEvent(name, params = {}) {
  if (typeof window === 'undefined' || !loaded || !window.gtag || !name) return
  window.gtag('event', name, params)
}
