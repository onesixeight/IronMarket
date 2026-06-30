import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFileSync(resolve(projectRoot, path), 'utf8')

const analytics = read('src/composables/useAnalytics.js')
const googleAnalytics = read('src/composables/useGoogleAnalytics.js')
const yandexMetrika = read('src/composables/useYandexMetrika.js')
const cookieConsent = read('src/components/CookieConsent.vue')
const router = read('src/router/index.js')
const productView = read('src/views/ProductView.vue')
const productCard = read('src/components/ProductCard.vue')
const contactForm = read('src/components/ContactForm.vue')
const floatingMessenger = read('src/components/FloatingMessenger.vue')
const indexHtml = read('index.html')
const headers = read('public/_headers')
const vercel = read('vercel.json')

assert.ok(existsSync(resolve(projectRoot, '.env.example')), '.env.example should document analytics env ids')

assert.match(googleAnalytics, /import\.meta\.env\.VITE_GOOGLE_ANALYTICS_ID/)
assert.match(googleAnalytics, /https:\/\/www\.googletagmanager\.com\/gtag\/js/)
assert.match(googleAnalytics, /send_page_view: false/)
assert.match(googleAnalytics, /window\.gtag\('event', 'page_view'/)

assert.match(yandexMetrika, /import\.meta\.env\.VITE_YANDEX_METRIKA_ID/)
assert.match(yandexMetrika, /DEFAULT_YANDEX_METRIKA_ID = '110264764'/)
assert.match(yandexMetrika, /https:\/\/mc\.yandex\.ru\/metrika\/tag\.js/)
assert.match(yandexMetrika, /ecommerce: 'dataLayer'/)
assert.match(yandexMetrika, /defer: true/)
assert.match(yandexMetrika, /window\.ym\(YM_COUNTER_ID, 'hit'/)
assert.doesNotMatch(yandexMetrika, /export const YM_COUNTER_ID = '00000000'/)

assert.match(analytics, /initGoogleAnalytics\(\)/)
assert.match(analytics, /initYandexMetrika\(\)/)
assert.match(analytics, /trackGoogleEvent\('generate_lead'/)
assert.match(analytics, /trackYandexGoal\(`lead_\$\{channel\}`/)

assert.match(cookieConsent, /initAnalytics/)
assert.doesNotMatch(cookieConsent, /initYandexMetrika/)
assert.match(router, /useAnalytics\.js/)
assert.match(router, /trackPageView\(to\.fullPath\)/)

for (const [name, content] of Object.entries({
  productView,
  productCard,
  contactForm,
  floatingMessenger,
})) {
  assert.match(content, /trackLead/, `${name} should track lead intent without personal data`)
  assert.doesNotMatch(content, /trackLead\([^)]*phone|trackLead\([^)]*email|trackLead\([^)]*name/i)
}

assert.doesNotMatch(indexHtml, /mc\.yandex\.ru\/watch\/00000000/)
assert.match(headers, /https:\/\/www\.googletagmanager\.com/)
assert.match(headers, /https:\/\/www\.google-analytics\.com/)
assert.match(headers, /https:\/\/mc\.yandex\.ru/)
assert.match(vercel, /https:\/\/www\.googletagmanager\.com/)
assert.match(vercel, /https:\/\/www\.google-analytics\.com/)
assert.match(vercel, /https:\/\/mc\.yandex\.ru/)
