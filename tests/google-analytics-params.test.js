import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let analytics
const calls = []

before(async () => {
  server = await createServer({
    configFile: false,
    envFile: false,
    server: { middlewareMode: true },
    define: { 'import.meta.env.VITE_GOOGLE_ANALYTICS_ID': JSON.stringify('G-REGRESSION') },
  })
  analytics = await server.ssrLoadModule('/src/composables/useGoogleAnalytics.js')
  globalThis.window = { gtag: (...args) => calls.push(args) }
  globalThis.document = { getElementById: () => ({}) }
})

after(async () => {
  delete globalThis.window
  delete globalThis.document
  await server?.close()
})

test('Google events remain disabled until analytics is initialized', () => {
  analytics.trackGoogleEvent('catalog_open', { source: 'desktop_header' })
  assert.equal(calls.length, 0)
  assert.equal(analytics.initGoogleAnalytics(), true)
})

test('button context cannot override Google traffic source on any intent event', () => {
  for (const name of ['catalog_open', 'contact_form_open', 'generate_lead', 'select_item']) {
    const params = Object.freeze({ source: 'desktop_header', method: 'whatsapp', item_id: 6150 })
    analytics.trackGoogleEvent(name, params)
    assert.deepEqual(calls.at(-1), ['event', name, {
      interaction_source: 'desktop_header', method: 'whatsapp', item_id: 6150,
    }])
    assert.equal(params.source, 'desktop_header', 'other providers retain the original context')
  }
})

test('explicit interaction context and campaign configuration are preserved', () => {
  analytics.trackGoogleEvent('catalog_open', {
    source: 'legacy_context', interaction_source: 'header_search',
    campaign_source: 'newsletter', campaign_medium: 'email',
  })
  assert.deepEqual(calls.at(-1), ['event', 'catalog_open', {
    interaction_source: 'header_search', campaign_source: 'newsletter', campaign_medium: 'email',
  }])
  analytics.trackGoogleEvent('scroll', { percent_scrolled: 90 })
  assert.deepEqual(calls.at(-1), ['event', 'scroll', { percent_scrolled: 90 }])
})
