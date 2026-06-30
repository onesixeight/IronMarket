import assert from 'node:assert/strict'
import fs from 'node:fs'

const customSelect = fs.readFileSync(new URL('../src/components/CustomSelect.vue', import.meta.url), 'utf8')

assert.match(
  customSelect,
  /<Teleport\s+to="body">/,
  'CustomSelect dropdown should render in body to avoid clipping inside overflow-hidden parents'
)
assert.match(
  customSelect,
  /class="custom-select-dropdown/,
  'Teleported dropdown should use a stable component class for positioning'
)
assert.match(customSelect, /:style="dropdownStyle"/, 'Dropdown should receive fixed coordinates from JS')
assert.match(
  customSelect,
  /getBoundingClientRect\(\)/,
  'Dropdown position should be measured from the trigger element'
)
assert.match(
  customSelect,
  /window\.addEventListener\('resize', queueDropdownPositionUpdate\)/,
  'Dropdown should update its position on resize'
)
assert.match(
  customSelect,
  /window\.addEventListener\('scroll', queueDropdownPositionUpdate, true\)/,
  'Dropdown should update its position when scroll containers move'
)
assert.match(
  customSelect,
  /dropdown\.value\?\.contains\(e\.target\)/,
  'Outside click handling should keep clicks inside the teleported menu from closing it prematurely'
)
assert.doesNotMatch(
  customSelect,
  /class="absolute left-0 right-0 top-\[/,
  'Dropdown should no longer rely on absolute positioning inside the select wrapper'
)

console.log('ok custom-select: teleported dropdown avoids clipping')
