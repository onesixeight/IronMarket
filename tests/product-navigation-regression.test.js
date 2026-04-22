import assert from 'node:assert/strict'
import fs from 'node:fs'

const productView = fs.readFileSync(new URL('../src/views/ProductView.vue', import.meta.url), 'utf8')
const imageLightbox = fs.readFileSync(new URL('../src/components/ImageLightbox.vue', import.meta.url), 'utf8')
const appView = fs.readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

assert.doesNotMatch(productView, /<div[^>]*rounded-2xl[^>]*@click="lightbox = true"/, 'Product page should not open lightbox from the whole image panel')
assert.match(productView, /aria-label="Открыть изображение крупнее"/, 'Product page should keep an explicit zoom control')
assert.match(productView, /import\s+\{\s*formatPrice\s*\}\s+from\s+'..\/composables\/usePrice\.js'/, 'Product page should import formatPrice for price rendering')
assert.match(imageLightbox, /aria-label="Закрыть изображение"/, 'Lightbox should expose a clickable backdrop close control')
assert.match(imageLightbox, /@click="\$emit\('close'\)"/, 'Backdrop should close the lightbox on click')
assert.match(imageLightbox, /@click\.stop/, 'Lightbox content should stop backdrop clicks from leaking through')
assert.doesNotMatch(appView, /<transition[^>]*mode="out-in"/, 'App router transition should not force out-in mode on async route changes')
