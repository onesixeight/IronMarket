const DEFAULT_YANDEX_METRIKA_ID = '110264764'

export const YM_COUNTER_ID = String(
  import.meta.env.VITE_YANDEX_METRIKA_ID || DEFAULT_YANDEX_METRIKA_ID
).trim()

const YM_SCRIPT_ID = 'yandex-metrika-tag'
const YM_SCRIPT_SRC = 'https://mc.yandex.ru/metrika/tag.js'
const YM_PLACEHOLDER_IDS = new Set(['00000000', 'XXXXXXXX'])

let loaded = false

export function isYandexMetrikaConfigured() {
  return Boolean(YM_COUNTER_ID) && !YM_PLACEHOLDER_IDS.has(YM_COUNTER_ID)
}

export function initYandexMetrika() {
  if (typeof window === 'undefined' || !isYandexMetrikaConfigured()) return false
  if (loaded) return true

  window.ym =
    window.ym ||
    function () {
      ;(window.ym.a = window.ym.a || []).push(arguments)
    }
  window.ym.l = window.ym.l || +new Date()

  if (!document.getElementById(YM_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = YM_SCRIPT_ID
    script.async = true
    script.src = YM_SCRIPT_SRC
    document.head.appendChild(script)
  }

  window.ym(YM_COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    ecommerce: 'dataLayer',
    defer: true,
  })

  loaded = true
  return true
}

export function trackYandexPageView(path, options = {}) {
  if (typeof window === 'undefined' || !loaded || !window.ym) return

  window.ym(YM_COUNTER_ID, 'hit', path || currentPath(), {
    title: options.title || document.title,
    referer: options.referer,
  })
}

export function trackPageView(path, options) {
  trackYandexPageView(path, options)
}

export function trackGoal(target, params) {
  if (typeof window === 'undefined' || !loaded || !window.ym || !target) return
  window.ym(YM_COUNTER_ID, 'reachGoal', target, params)
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}
