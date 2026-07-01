import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mainCss = readFileSync(resolve(projectRoot, 'src/assets/main.css'), 'utf8')
const homeView = readFileSync(resolve(projectRoot, 'src/views/HomeView.vue'), 'utf8')
const deliveryView = readFileSync(resolve(projectRoot, 'src/views/DeliveryView.vue'), 'utf8')
const tokenizedStyleFiles = [
  'src/components/AnimatedCounter.vue',
  'src/components/AppFooter.vue',
  'src/components/AppHeader.vue',
  'src/components/ApplicationExamples.vue',
  'src/components/CatalogProjectShortcuts.vue',
  'src/components/CategoryRequestPanel.vue',
  'src/components/CookieConsent.vue',
  'src/components/FaqSection.vue',
  'src/components/HeroSlider.vue',
  'src/components/LeadPicker.vue',
  'src/components/MobileBottomNav.vue',
  'src/views/CatalogView.vue',
  'src/views/ContactsView.vue',
  'src/views/DeliveryView.vue',
  'src/views/HomeView.vue',
  'src/views/ProductView.vue',
]

function extractStyleBlocks(source) {
  return [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
    .map((match) => match[1])
    .join('\n')
}

assert.match(mainCss, /--rgb-gold-400:/)
assert.match(mainCss, /--rgb-gold-300:/)
assert.match(mainCss, /--rgb-gold-bright:/)
assert.match(mainCss, /--rgb-gold-light:/)
assert.match(mainCss, /--rgb-copper-400:/)
assert.match(mainCss, /--rgb-cream-100:/)
assert.match(mainCss, /--rgb-cream-warm:/)
assert.match(mainCss, /--rgb-obsidian-950:/)
assert.match(mainCss, /--rgb-obsidian-900:/)
assert.match(mainCss, /--rgb-obsidian-850:/)
assert.match(mainCss, /--rgb-black:/)
assert.match(mainCss, /--rgb-white:/)
assert.doesNotMatch(mainCss, /rgba\(/)
assert.match(mainCss, /--surface-card-bg:/)
assert.match(mainCss, /--surface-gold-border-subtle:/)
assert.match(mainCss, /\.premium-card\s*\{/)
assert.match(mainCss, /\.premium-card--glow\s*\{/)
assert.match(mainCss, /\.premium-card--lift:hover\s*\{/)
assert.match(mainCss, /\.premium-card--soft-lift:hover\s*\{/)
assert.match(mainCss, /\.premium-icon-box\s*\{/)
assert.match(mainCss, /--surface-cream-muted/)
assert.match(mainCss, /var\(--surface-gold-border-soft\)/)
assert.match(mainCss, /var\(--surface-cream-muted\)/)

assert.match(homeView, /class="request-step-card premium-card premium-card--glow premium-card--lift"/)
assert.match(homeView, /class="category-card premium-card premium-card--lift group"/)
assert.match(homeView, /class="feature-card premium-card"/)
assert.doesNotMatch(homeView, /\.category-card:hover/)
assert.doesNotMatch(homeView, /\.request-step-card:hover/)

assert.match(deliveryView, /class="delivery-card premium-card premium-card--glow premium-card--soft-lift group"/)
assert.match(deliveryView, /class="flow-card premium-card premium-card--glow premium-card--soft-lift"/)
assert.match(deliveryView, /class="delivery-icon premium-icon-box"/)
assert.match(deliveryView, /class="flow-index premium-icon-box"/)
assert.doesNotMatch(deliveryView, /\.delivery-card:hover/)
assert.doesNotMatch(deliveryView, /\.flow-card:hover/)

for (const file of tokenizedStyleFiles) {
  const source = readFileSync(resolve(projectRoot, file), 'utf8')
  assert.doesNotMatch(
    extractStyleBlocks(source),
    /rgba\(/,
    `${file} should use tokenized rgb alpha colors in style blocks`,
  )
}
