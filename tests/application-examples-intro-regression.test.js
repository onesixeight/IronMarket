import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const applicationExamples = readFileSync(
  new URL('../src/components/ApplicationExamples.vue', import.meta.url),
  'utf8'
)

assert.match(
  applicationExamples,
  /class="application-examples-intro surface-panel rounded-\[2rem\] p-6 sm:p-8 lg:p-10 mb-14"/,
  'Application examples intro should be framed like the nearby order section'
)
assert.match(
  applicationExamples,
  /class="application-examples-copy"/,
  'Application examples heading and copy should stay grouped inside the framed intro'
)
assert.match(
  applicationExamples,
  /class="section-lead mt-4 max-w-2xl text-sm sm:text-base"/,
  'Application examples copy should live inside the framed intro block'
)
assert.match(
  applicationExamples,
  /class="application-examples-points"/,
  'Application examples intro should fill the right side with useful compact points'
)
assert.match(
  applicationExamples,
  /const introPoints = \[/,
  'Application examples intro should render compact points from data'
)
assert.match(
  applicationExamples,
  /\.application-examples-intro\s*\{[\s\S]*display: grid;/,
  'Application examples intro should use a full-width internal grid'
)
assert.match(
  applicationExamples,
  /grid-template-columns: minmax\(0, 1fr\) minmax\(17rem, 0\.42fr\);/,
  'Application examples intro should reserve a useful right column on desktop'
)
assert.doesNotMatch(
  applicationExamples,
  /lg:flex-row lg:items-end lg:justify-between/,
  'Application examples intro should not split heading and copy into separate columns'
)
assert.ok(
  applicationExamples.indexOf('class="application-examples-intro surface-panel') <
    applicationExamples.indexOf('class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'),
  'Application examples grid should follow the wrapped intro'
)
