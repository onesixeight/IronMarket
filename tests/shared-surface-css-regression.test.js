import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mainCss = readFileSync(resolve(projectRoot, 'src/assets/main.css'), 'utf8')
const homeView = readFileSync(resolve(projectRoot, 'src/views/HomeView.vue'), 'utf8')
const deliveryView = readFileSync(resolve(projectRoot, 'src/views/DeliveryView.vue'), 'utf8')

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
