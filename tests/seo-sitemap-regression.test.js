import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import catalog from '../src/data/catalog.json' with { type: 'json' }

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const indexHtml = readFileSync(resolve(projectRoot, 'index.html'), 'utf8')
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'))
const generatorPath = resolve(projectRoot, 'scripts/generate-sitemap.mjs')
const sitemapPath = resolve(projectRoot, 'public/sitemap.xml')
const robotsPath = resolve(projectRoot, 'public/robots.txt')

assert.doesNotMatch(indexHtml, /<link[^>]+rel="preload"[^>]+as="image"/, 'Shared HTML must not preload a homepage-only image')

// Metadata is checked as rendered DOM and generated HTML in
// e2e/seo-content-regressions.spec.js, independently of helper names/formatting.

assert.match(packageJson.scripts.prebuild, /\bnode scripts\/generate-sitemap\.mjs\b/)
assert.match(packageJson.scripts['prebuild:static'], /\bnode scripts\/generate-sitemap\.mjs\b/)
assert.ok(existsSync(generatorPath), 'sitemap generator should exist')
assert.ok(existsSync(sitemapPath), 'sitemap.xml should exist')
assert.ok(existsSync(robotsPath), 'robots.txt should exist')

const sitemap = readFileSync(sitemapPath, 'utf8')
const robots = readFileSync(robotsPath, 'utf8')

assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
assert.match(sitemap, /<loc>https:\/\/etalon-kovka\.kz\/<\/loc>/)
assert.match(sitemap, /<loc>https:\/\/etalon-kovka\.kz\/catalog<\/loc>/)
assert.match(sitemap, /<loc>https:\/\/etalon-kovka\.kz\/constructor<\/loc>/)
assert.match(sitemap, /<loc>https:\/\/etalon-kovka\.kz\/contacts<\/loc>/)
assert.match(sitemap, /<loc>https:\/\/etalon-kovka\.kz\/delivery<\/loc>/)
assert.match(sitemap, new RegExp(`<loc>https://etalon-kovka\\.kz/catalog/${catalog.categories[0].slug}</loc>`))
assert.match(sitemap, new RegExp(`<loc>https://etalon-kovka\\.kz/product/${catalog.products[0].id}</loc>`))
assert.doesNotMatch(sitemap, /\/cart<\/loc>|\/checkout<\/loc>|\/wishlist<\/loc>/)
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1])
assert.ok(lastmods.length > 0, 'sitemap should include lastmod when route source dates are known')
assert.ok(new Set(lastmods).size > 1, 'sitemap lastmod should come from route source history, not one generated date for every URL')

const sitemapGenerator = readFileSync(generatorPath, 'utf8')
assert.match(sitemapGenerator, /buildSiteRoutes\(\)/)
assert.match(sitemapGenerator, /readExistingLastmodByLoc/)
assert.match(sitemapGenerator, /execFileSync/)
assert.match(sitemapGenerator, /readSourceLastmod/)
assert.match(sitemapGenerator, /renderLastmod/)
assert.match(sitemapGenerator, /normalizeLastmod\(existingLastmodByLoc\.get\(loc\)\)/)
assert.doesNotMatch(sitemapGenerator, /new Date\(\)\.toISOString/)

assert.match(robots, /User-agent: \*/)
assert.match(robots, /Allow: \//)
assert.match(robots, /Disallow: \/cart/)
assert.match(robots, /Disallow: \/checkout/)
assert.match(robots, /Sitemap: https:\/\/etalon-kovka\.kz\/sitemap\.xml/)
