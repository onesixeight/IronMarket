import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8')

assert.match(workflow, /actions\/checkout@v5/, 'CI should use the Node 24-compatible checkout action')
assert.match(workflow, /actions\/setup-node@v5/, 'CI should use the Node 24-compatible setup-node action')
assert.doesNotMatch(workflow, /actions\/checkout@v4|actions\/setup-node@v4/)

console.log('ok github-actions: official actions use Node 24-compatible majors')
