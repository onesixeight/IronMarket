import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildSiteRoutes, normalizeRoutePath } from '../scripts/site-routes.mjs'
import catalog from '../src/data/catalog.json' with { type: 'json' }

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
const sitemapGenerator = fs.readFileSync(path.join(projectRoot, 'scripts/generate-sitemap.mjs'), 'utf8')
const prerenderScript = fs.readFileSync(path.join(projectRoot, 'scripts/prerender-routes.mjs'), 'utf8')
const playwrightBrowserScript = fs.readFileSync(
  path.join(projectRoot, 'scripts/ensure-playwright-browser.mjs'),
  'utf8',
)

const routes = buildSiteRoutes(catalog)
const routePaths = routes.map((route) => route.path)

assert.equal(routes.length, 5 + catalog.categories.length + catalog.products.length)
assert.equal(normalizeRoutePath('catalog///'), '/catalog')
assert.ok(routePaths.includes('/'), 'Prerender routes should include the homepage')
assert.ok(routePaths.includes('/catalog'), 'Prerender routes should include the catalog index')
assert.ok(routePaths.includes(`/catalog/${catalog.categories[0].slug}`), 'Prerender routes should include categories')
assert.ok(routePaths.includes(`/product/${catalog.products[0].id}`), 'Prerender routes should include products')
assert.equal(new Set(routePaths).size, routePaths.length, 'Prerender routes should be unique')
assert.ok(routes.every((route) => Array.isArray(route.sourceFiles) && route.sourceFiles.length > 0), 'Indexable routes should declare source files for sitemap lastmod')
assert.ok(!routePaths.includes('/cart'), 'Prerender routes should skip redirected cart pages')
assert.ok(!routePaths.includes('/checkout'), 'Prerender routes should skip redirected checkout pages')
assert.ok(!routePaths.includes('/thank-you'), 'Prerender routes should skip noindex thank-you pages')

assert.match(packageJson.scripts.build, /prerender-routes\.mjs/, 'Production build should prerender indexable routes')
assert.match(
  packageJson.scripts.build,
  /ensure-playwright-browser\.mjs && node scripts\/prerender-routes\.mjs/,
  'Production build should install Playwright Chromium before prerendering on deploy hosts',
)
assert.equal(packageJson.scripts.prerender, 'node scripts/prerender-routes.mjs')
assert.match(sitemapGenerator, /buildSiteRoutes\(\)/, 'Sitemap and prerender should share route generation')
assert.match(playwrightBrowserScript, /chromium\.executablePath\(\)/)
assert.match(playwrightBrowserScript, /playwright\/cli\.js/)
assert.match(playwrightBrowserScript, /process\.platform === 'linux'/)
assert.match(playwrightBrowserScript, /installArgs\.push\('--with-deps'\)/)
assert.match(playwrightBrowserScript, /installArgs\.push\('chromium'\)/)
assert.match(prerenderScript, /from '@playwright\/test'/, 'Prerender should use the existing Playwright dependency')
assert.match(prerenderScript, /vite preview/, 'Prerender should render against the production preview server')
assert.match(prerenderScript, /routeOutputPath\(route\.path\)/, 'Prerender should write one HTML file per route')
assert.match(prerenderScript, /window\.localStorage\.setItem\('cookie-consent', 'declined'\)/)
assert.match(prerenderScript, /window\.localStorage\.removeItem\('recently-viewed'\)/)
assert.match(prerenderScript, /requestUrl\.origin !== origin/, 'Prerender should avoid external network dependencies')

console.log('ok prerender: shared indexable routes and build integration')
