// Яндекс.Метрика для Vue SPA.
// Замени Ym_COUNTER_ID ниже на свой номер счётчика из интерфейса Метрики.
// Скрипт грузится только после согласия пользователя (см. CookieConsent),
// поэтому window.ym может быть undefined до согласия — все вызовы безопасны.

export const YM_COUNTER_ID = '00000000' // ← поставь свой номер счётчика Метрики

const YM_SCRIPT_SRC = 'https://mc.yandex.ru/metrika/tag.js'

let loaded = false

/** Загружает скрипт Метрики. Вызывается после согласия пользователя. */
export function initYandexMetrika() {
  if (loaded || typeof window === 'undefined') return
  if (window.ym) {
    loaded = true
    return
  }

  window.ym =
    window.ym ||
    function () {
      ;(window.ym.a = window.ym.a || []).push(arguments)
    }
  window.ym.l = +new Date()

  const script = document.createElement('script')
  script.async = true
  script.src = YM_SCRIPT_SRC
  document.head.appendChild(script)

  // Инициализация счётчика (современный tag.js).
  window.ym(YM_COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    defer: false,
  })

  loaded = true
}

/** Отправляет просмотр страницы. Вызывается из router.afterEach. */
export function trackPageView(path) {
  if (typeof window === 'undefined' || !window.ym) return
  window.ym(YM_COUNTER_ID, 'hit', path || window.location.pathname)
}

/** Достигновение цели. Например: trackGoal('whatsapp_click'). */
export function trackGoal(target, params) {
  if (typeof window === 'undefined' || !window.ym) return
  window.ym(YM_COUNTER_ID, 'reachGoal', target, params)
}
