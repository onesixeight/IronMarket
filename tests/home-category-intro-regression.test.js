import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const homeView = readFileSync(new URL('../src/views/HomeView.vue', import.meta.url), 'utf8')

assert.match(
  homeView,
  /class="surface-panel category-section-panel rounded-\[2rem\] p-5 sm:p-6 lg:p-8"/,
  'Category section should use the same wrapped surface style as nearby sections'
)
assert.match(homeView, /class="max-w-2xl category-heading-block mb-10 sm:mb-12"/, 'Category intro should stay with the section heading')
assert.doesNotMatch(homeView, /category-intro-note/, 'Category section should not carry redundant explanatory copy')
assert.doesNotMatch(homeView, /Навигация по каталогу/, 'Category heading should not repeat the catalog navigation idea')
assert.doesNotMatch(homeView, /Быстрый вход в основные направления/, 'Category cards should explain the navigation without extra copy')
assert.ok(
  homeView.indexOf('class="surface-panel category-section-panel') < homeView.indexOf('class="category-card premium-card premium-card--lift group"'),
  'Category cards should live inside the wrapped category section'
)
assert.match(homeView, /class="category-card-media/, 'Category cards should reserve a stable media row')
assert.match(homeView, /class="category-card-title/, 'Category cards should reserve a stable title row')
assert.match(homeView, /class="category-card-description/, 'Category cards should reserve a stable description row')
assert.match(homeView, /class="category-card-footer/, 'Category cards should pin count and action to a stable footer')
assert.match(homeView, /\.category-card\s*\{[\s\S]*display: flex;[\s\S]*flex-direction: column;/, 'Category cards should use vertical flex layout')
assert.match(homeView, /\.category-card-title\s*\{[\s\S]*min-height: 4\.5rem;/, 'Category titles should align following copy')
assert.match(homeView, /\.category-card-description\s*\{[\s\S]*min-height: 5\.25rem;/, 'Category descriptions should align footers')
assert.match(homeView, /\.category-card-footer\s*\{[\s\S]*margin-top: auto;/, 'Category footers should align to card bottoms')

console.log('ok home-category-intro: wrapped section without redundant copy')
