import assert from 'node:assert/strict'
import fs from 'node:fs'

const aboutView = fs.readFileSync(new URL('../src/views/AboutView.vue', import.meta.url), 'utf8')
const animatedCounter = fs.readFileSync(new URL('../src/components/AnimatedCounter.vue', import.meta.url), 'utf8')

assert.match(aboutView, /import AnimatedCounter from '\.\.\/components\/AnimatedCounter\.vue'/, 'About page should use the animated counter component')
assert.match(aboutView, /<AnimatedCounter\s+:value="s\.value"\s+:delay="i \* 120"/, 'Stats should stagger count-up animations')

assert.match(animatedCounter, /IntersectionObserver/, 'Counter should start only when it enters the viewport')
assert.match(animatedCounter, /requestAnimationFrame/, 'Counter should animate with requestAnimationFrame')
assert.match(animatedCounter, /prefers-reduced-motion: reduce/, 'Counter should respect reduced-motion preferences')
assert.match(animatedCounter, /cancelAnimationFrame/, 'Counter should clean up pending animation frames')
assert.match(animatedCounter, /aria-label="value"/, 'Counter should expose the final value to assistive technology')
assert.match(animatedCounter, /aria-hidden="true"/, 'Animated visual value should not be re-announced repeatedly')
