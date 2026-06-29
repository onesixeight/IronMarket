import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const manifest = JSON.parse(fs.readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'))
const serviceWorker = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
const bottomNav = fs.readFileSync(new URL('../src/components/MobileBottomNav.vue', import.meta.url), 'utf8')

assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest"/, 'Index should load the PWA manifest')
assert.match(html, /apple-mobile-web-app-capable/, 'Index should opt into iOS home-screen app mode')
assert.equal(manifest.display, 'standalone', 'PWA should open without browser chrome when installed')
assert.equal(manifest.start_url, '/', 'PWA should start at the homepage')
assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'), 'Manifest should include a 192px icon')
assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'), 'Manifest should include a 512px icon')

assert.match(main, /navigator\.serviceWorker\.register\('\/sw\.js'\)/, 'App should register the service worker')
assert.match(serviceWorker, /self\.addEventListener\('fetch'/, 'Service worker should handle fetches for offline resilience')
assert.match(app, /<MobileBottomNav \/>/, 'App shell should render the mobile bottom navigation')
assert.match(bottomNav, /lg:hidden/, 'Bottom navigation should be mobile-only')
assert.match(bottomNav, /@media \(min-width: 1024px\)[\s\S]*display: none/, 'Scoped bottom nav styles should not override desktop hiding')
assert.match(bottomNav, /to: '\/catalog'/, 'Bottom navigation should link to the catalog')
assert.match(bottomNav, /to: '\/contacts'/, 'Bottom navigation should expose the lead/contact action')
