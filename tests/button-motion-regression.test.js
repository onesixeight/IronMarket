import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mainCss = readFileSync(resolve(projectRoot, 'src/assets/main.css'), 'utf8')

assert.match(mainCss, /\.metal-button,\s*\.metal-button-ghost\s*{[\s\S]*position: relative;/)
assert.match(mainCss, /\.metal-button::before,\s*\.metal-button-ghost::before/)
assert.match(mainCss, /animation: metalButtonGlimmer 7\.5s ease-in-out 1\.8s infinite;/)
assert.match(mainCss, /@keyframes metalButtonGlimmer/)
assert.match(mainCss, /transform: translate3d\(-34%, 0, 0\) rotate\(8deg\);/)
assert.match(mainCss, /transform: translate3d\(34%, 0, 0\) rotate\(8deg\);/)
assert.match(mainCss, /@media \(prefers-reduced-motion: reduce\)/)
