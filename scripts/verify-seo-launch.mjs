#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SITE_ORIGIN, toSiteUrl } from '../src/config/site.js'
import { CONTACTS } from '../src/config/contacts.js'
import catalog from '../src/data/catalog.json' with { type: 'json' }
import { buildSiteRoutes } from './site-routes.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(projectRoot, 'dist')
const expectedRoutes = buildSiteRoutes(catalog)
const expectedLocs = new Set(expectedRoutes.map((route) => toSiteUrl(route.path)))
const checks = []

function pass(label) {
  checks.push({ ok: true, label })
}

function fail(label, detail = '') {
  checks.push({ ok: false, label, detail })
}

function assertCheck(condition, label, detail) {
  if (condition) pass(label)
  else fail(label, detail)
}

function readDist(path) {
  const filePath = resolve(distDir, path)
  if (!existsSync(filePath)) {
    fail(`dist/${path} exists`, 'Run npm run build before npm run verify:seo.')
    return ''
  }

  pass(`dist/${path} exists`)
  return readFileSync(filePath, 'utf8')
}

function routeHtmlPath(routePath) {
  const normalized = routePath === '/' ? 'index.html' : `${routePath.replace(/^\/+|\/+$/g, '')}/index.html`
  return normalized
}

function parseSitemapLocs(sitemap) {
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
}

function parseJsonLd(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1].trim())
    .map((source) => {
      try {
        return JSON.parse(source)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function hasSchemaType(schemas, type) {
  return schemas.some((schema) => schema['@type'] === type)
}

function assertRouteMetadata(routePath, expectedTitlePattern) {
  const html = readDist(routeHtmlPath(routePath))
  const url = toSiteUrl(routePath)

  assertCheck(
    html.includes(`<link rel="canonical" href="${url}"`),
    `${routePath} canonical points to ${url}`
  )
  assertCheck(
    html.includes(`<meta property="og:url" content="${url}"`),
    `${routePath} og:url points to ${url}`
  )
  assertCheck(
    expectedTitlePattern.test(html),
    `${routePath} has route-specific rendered title/content`
  )

  return {
    html,
    schemas: parseJsonLd(html),
  }
}

function assertBuiltAnalyticsIds(indexHtml) {
  const bundlePath = indexHtml.match(/\/assets\/index-[^"']+\.js/)?.[0]
  assertCheck(Boolean(bundlePath), 'index bundle is referenced from dist/index.html')

  if (!bundlePath) return

  const bundle = readDist(bundlePath.replace(/^\//, ''))
  assertCheck(bundle.includes('G-3TYNDM52D9'), 'Google Analytics ID is present in built bundle')
  assertCheck(bundle.includes('110264764'), 'Yandex Metrika ID is present in built bundle')
}

function run() {
  const indexHtml = readDist('index.html')
  const sitemap = readDist('sitemap.xml')
  const robots = readDist('robots.txt')
  const sitemapLocs = parseSitemapLocs(sitemap)
  const sitemapLocSet = new Set(sitemapLocs)

  assertCheck(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`), 'robots.txt points to production sitemap')
  assertCheck(!/Disallow:\s*\/catalog\b/.test(robots), 'robots.txt does not block catalog')
  assertCheck(!/Disallow:\s*\/product\b/.test(robots), 'robots.txt does not block product pages')

  assertCheck(sitemapLocs.length === expectedRoutes.length, 'sitemap URL count matches route registry', `${sitemapLocs.length} !== ${expectedRoutes.length}`)
  assertCheck(sitemapLocs.every((loc) => loc.startsWith(`${SITE_ORIGIN}/`) || loc === `${SITE_ORIGIN}/`), 'sitemap URLs use production origin')
  assertCheck(new Set(sitemapLocs).size === sitemapLocs.length, 'sitemap URLs are unique')

  const missingLocs = [...expectedLocs].filter((loc) => !sitemapLocSet.has(loc))
  assertCheck(
    missingLocs.length === 0,
    'sitemap includes all registered routes',
    missingLocs.slice(0, 5).join(', ')
  )

  const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1])
  assertCheck(lastmods.length > 0, 'sitemap includes lastmod values')
  assertCheck(new Set(lastmods).size > 1, 'sitemap lastmod values are source-based, not one generated date')

  const home = assertRouteMetadata('/', /Эталон Ковка|Кованые элементы/)
  assertCheck(hasSchemaType(home.schemas, 'LocalBusiness'), 'home page has LocalBusiness JSON-LD')
  const faqSchema = home.schemas.find((schema) => schema['@type'] === 'FAQPage')
  assertCheck(Boolean(faqSchema), 'home page has FAQPage JSON-LD')
  assertCheck((faqSchema?.mainEntity?.length || 0) >= 6, 'home FAQPage JSON-LD includes commercial questions')

  const catalogPage = assertRouteMetadata('/catalog', /Каталог продукции|Кованые элементы/)
  assertCheck(hasSchemaType(catalogPage.schemas, 'ItemList'), 'catalog page has ItemList JSON-LD')

  const firstCategory = catalog.categories[0]
  const categoryPage = assertRouteMetadata(`/catalog/${firstCategory.slug}`, new RegExp(firstCategory.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assertCheck(hasSchemaType(categoryPage.schemas, 'ItemList'), 'category page has ItemList JSON-LD')

  const firstProduct = catalog.products[0]
  const productPage = assertRouteMetadata(`/product/${firstProduct.id}`, new RegExp(String(firstProduct.id)))
  assertCheck(hasSchemaType(productPage.schemas, 'Product'), 'product page has Product JSON-LD')
  assertCheck(productPage.html.includes(firstProduct.name), 'product page contains product name')

  const contactsPage = assertRouteMetadata('/contacts', /Контакты|Связаться/)
  assertCheck(contactsPage.html.includes(CONTACTS.location.address), 'contacts page contains full address')

  assertBuiltAnalyticsIds(indexHtml)

  const failed = checks.filter((check) => !check.ok)
  for (const check of checks) {
    const prefix = check.ok ? 'ok' : 'not ok'
    const detail = check.detail ? ` - ${check.detail}` : ''
    console.log(`${prefix} ${check.label}${detail}`)
  }

  if (failed.length > 0) {
    console.error(`SEO launch verification failed: ${failed.length} check(s) failed.`)
    process.exit(1)
  }

  console.log(`SEO launch verification passed: ${checks.length} checks.`)
}

run()
