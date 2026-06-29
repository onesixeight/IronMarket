import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const heroSlider = readFileSync(resolve(projectRoot, 'src/components/HeroSlider.vue'), 'utf8')

assert.match(heroSlider, /value: '7\/7'/)
assert.match(heroSlider, /label: 'без выходных'/)
assert.doesNotMatch(heroSlider, /7\/6/)
