import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import catalog from '../src/data/catalog.json' with { type: 'json' }

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const indexHtml = readFileSync(resolve(projectRoot, 'index.html'), 'utf8')
const useSeo = readFileSync(resolve(projectRoot, 'src/composables/useSeo.js'), 'utf8')
const useSchemaOrg = readFileSync(resolve(projectRoot, 'src/composables/useSchemaOrg.js'), 'utf8')
const packageJson = readFileSync(resolve(projectRoot, 'package.json'), 'utf8')
const generatorPath = resolve(projectRoot, 'scripts/generate-sitemap.mjs')
const sitemapPath = resolve(projectRoot, 'public/sitemap.xml')
const robotsPath = resolve(projectRoot, 'public/robots.txt')

assert.match(indexHtml, /<link rel="canonical" href="https:\/\/etalon-kovka\.kz\/" \/>/)
assert.match(indexHtml, /<meta property="og:url" content="https:\/\/etalon-kovka\.kz\/" \/>/)
assert.match(indexHtml, /<meta name="twitter:image" content="https:\/\/etalon-kovka\.kz\/images\/branding\/brand-mark-ornament\.png" \/>/)
assert.match(indexHtml, /<meta property="og:image" content="https:\/\/etalon-kovka\.kz\/images\/branding\/brand-mark-ornament\.png" \/>/)
assert.match(indexHtml, /<link rel="preload" as="image" href="\/images\/hero\/hero-ornamental-pattern-v2\.webp" fetchpriority="high" \/>/)

assert.match(useSeo, /from '\.\.\/config\/site\.js'/)
assert.match(useSeo, /setCanonicalUrl/)
assert.match(useSeo, /setOrCreateMeta\('og:url'/)
assert.match(useSeo, /setOrCreateMetaName\('twitter:card', 'summary_large_image'\)/)
assert.match(useSeo, /toAbsoluteSiteUrl/)
assert.match(useSeo, /toSiteUrl/)
assert.match(useSchemaOrg, /from '\.\.\/config\/site\.js'/)
assert.match(useSchemaOrg, /url: toSiteUrl\('\/'\)/)
assert.match(useSchemaOrg, /logo: toAbsoluteSiteUrl\(DEFAULT_SOCIAL_IMAGE\)/)

assert.match(packageJson, /"prebuild": "node scripts\/generate-sitemap\.mjs"/)
assert.ok(existsSync(generatorPath), 'sitemap generator should exist')
assert.ok(existsSync(sitemapPath), 'sitemap.xml should exist')
assert.ok(existsSync(robotsPath), 'robots.txt should exist')

const sitemap = readFileSync(sitemapPath, 'utf8')
const robots = readFileSync(robotsPath, 'utf8')

assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
assert.match(sitemap, /<loc>https:\/\/etalon-kovka\.kz\/<\/loc>/)
assert.match(sitemap, /<loc>https:\/\/etalon-kovka\.kz\/catalog<\/loc>/)
assert.match(sitemap, /<loc>https:\/\/etalon-kovka\.kz\/contacts<\/loc>/)
assert.match(sitemap, /<loc>https:\/\/etalon-kovka\.kz\/delivery<\/loc>/)
assert.match(sitemap, new RegExp(`<loc>https://etalon-kovka\\.kz/catalog/${catalog.categories[0].slug}</loc>`))
assert.match(sitemap, new RegExp(`<loc>https://etalon-kovka\\.kz/product/${catalog.products[0].id}</loc>`))
assert.doesNotMatch(sitemap, /\/cart<\/loc>|\/checkout<\/loc>|\/wishlist<\/loc>/)

assert.match(robots, /User-agent: \*/)
assert.match(robots, /Allow: \//)
assert.match(robots, /Disallow: \/cart/)
assert.match(robots, /Disallow: \/checkout/)
assert.match(robots, /Sitemap: https:\/\/etalon-kovka\.kz\/sitemap\.xml/)
