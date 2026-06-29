import assert from 'node:assert/strict'
import fs from 'node:fs'

const appHeader = fs.readFileSync(new URL('../src/components/AppHeader.vue', import.meta.url), 'utf8')
const mobileBottomNav = fs.readFileSync(new URL('../src/components/MobileBottomNav.vue', import.meta.url), 'utf8')

assert.match(appHeader, /@click\.self="closeMobileMenu"/, 'Mobile menu should close when tapping outside the sheet')
assert.match(appHeader, /backdrop-blur-md" @click="closeMobileMenu"/, 'Mobile menu backdrop should close the sheet on tap')
assert.match(appHeader, /<Teleport to="body">/, 'Mobile menu overlay should be teleported outside the header stacking context')
assert.match(appHeader, /class="fixed inset-0 z-\[60\] xl:hidden"/, 'Mobile menu overlay should cover the whole viewport above the header')
assert.match(appHeader, /bg-obsidian-950\/96/, 'Mobile menu sheet should use an opaque dark background for readability')
assert.match(appHeader, /function closeMobileMenu\(\)/, 'Mobile menu should expose a dedicated close handler')
assert.doesNotMatch(mobileBottomNav, /ariaLabel/, 'Bottom nav accessible names should come from visible labels')
assert.doesNotMatch(mobileBottomNav, /:aria-label="item\.ariaLabel"/, 'Bottom nav should not override visible labels with mismatched aria-labels')
