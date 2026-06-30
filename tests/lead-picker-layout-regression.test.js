import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const leadPicker = readFileSync(resolve(projectRoot, 'src/components/LeadPicker.vue'), 'utf8')

assert.match(leadPicker, /class="project-picker-layout"/)
assert.match(leadPicker, /class="project-picker-copy"/)
assert.match(leadPicker, /class="project-picker-panel"/)
assert.match(leadPicker, /class="eyebrow project-picker-eyebrow mb-5"/)
assert.match(leadPicker, /class="scenario-grid"/)
assert.match(leadPicker, /class="picker-actions"/)
assert.match(leadPicker, /const selectedId = ref\(null\)/)
assert.match(leadPicker, /'scenario-card-active': scenario\.id === selectedId/)
assert.match(leadPicker, /grid-auto-rows: 1fr/)
assert.match(leadPicker, /\.project-picker-eyebrow \{[\s\S]*align-self: flex-start/)
assert.match(leadPicker, /\.project-picker-eyebrow \{[\s\S]*inline-size: fit-content/)
assert.match(leadPicker, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
assert.match(
  leadPicker,
  /grid-template-columns: minmax\(0, 1\.2fr\) minmax\(0, 0\.82fr\) minmax\(0, 0\.95fr\)/
)
