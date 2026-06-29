import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const shortcutsPath = resolve(projectRoot, 'src/components/CatalogProjectShortcuts.vue')

assert.ok(existsSync(shortcutsPath), 'CatalogProjectShortcuts component should exist')

const shortcuts = readFileSync(shortcutsPath, 'utf8')
const catalogView = readFileSync(resolve(projectRoot, 'src/views/CatalogView.vue'), 'utf8')

assert.match(shortcuts, /contactScenarios/)
assert.match(shortcuts, /catalogShortcutItems/)
assert.match(shortcuts, /path: '\/contacts'/)
assert.match(shortcuts, /query: \{ task: scenario\.id \}/)
assert.match(shortcuts, /aria-labelledby="catalog-shortcuts-title"/)

for (const scenarioId of ['gates', 'railings', 'fences', 'stairs']) {
  assert.match(shortcuts, new RegExp(`scenario\\.id === '${scenarioId}'|${scenarioId}`))
}

assert.match(catalogView, /import CatalogProjectShortcuts/)
assert.match(catalogView, /<CatalogProjectShortcuts/)
assert.match(catalogView, /resetCatalogFilters/)
assert.match(catalogView, /@click="resetCatalogFilters"/)
assert.match(catalogView, /path: '\/contacts', query: \{ task: 'gates' \}/)
