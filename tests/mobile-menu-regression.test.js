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
assert.match(appHeader, /mobile-menu-trigger/, 'Header menu button should have a dedicated desktop hiding hook')
assert.match(appHeader, /@media \(min-width: 1280px\)[\s\S]*\.mobile-menu-trigger[\s\S]*display: none/, 'Header menu button should stay hidden on desktop even after icon-button display styles')
assert.match(appHeader, /\{ to: '\/catalog', label:/, 'Header catalog link should use the direct catalog route')
assert.match(appHeader, /ref="searchButtonElement"/, 'Search button should be tracked for outside-click handling')
assert.match(appHeader, /ref="searchPanelElement"/, 'Search panel should be tracked for outside-click handling')
assert.match(appHeader, /function onDocumentPointerDown\(e\)/, 'Header search should expose an outside-click handler')
assert.match(appHeader, /document\.addEventListener\('pointerdown', onDocumentPointerDown\)/, 'Search should close from document pointerdown outside the panel')
assert.match(appHeader, /document\.removeEventListener\('pointerdown', onDocumentPointerDown\)/, 'Search outside-click handler should be cleaned up')
assert.doesNotMatch(mobileBottomNav, /ariaLabel/, 'Bottom nav accessible names should come from visible labels')
assert.doesNotMatch(mobileBottomNav, /:aria-label="item\.ariaLabel"/, 'Bottom nav should not override visible labels with mismatched aria-labels')
