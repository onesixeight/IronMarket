import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SITE_ORIGIN, toSiteUrl } from '../src/config/site.js'
import { buildSiteRoutes } from './site-routes.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(projectRoot, 'public')
const sitemapPath = resolve(publicDir, 'sitemap.xml')
const today = new Date().toISOString().slice(0, 10)
const routes = buildSiteRoutes()
const existingLastmodByLoc = readExistingLastmodByLoc(sitemapPath)

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function readExistingLastmodByLoc(path) {
  if (!existsSync(path)) return new Map()

  const source = readFileSync(path, 'utf8')
  const entries = new Map()
  const urlPattern = /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g

  for (const match of source.matchAll(urlPattern)) {
    entries.set(match[1], match[2])
  }

  return entries
}

function getLastmod(route) {
  const loc = toSiteUrl(route.path)
  return route.lastmod || existingLastmodByLoc.get(loc) || today
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${escapeXml(toSiteUrl(route.path))}</loc>
    <lastmod>${getLastmod(route)}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /
Disallow: /cart
Disallow: /checkout
Disallow: /wishlist
Disallow: /thank-you

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`

mkdirSync(publicDir, { recursive: true })
writeFileSync(sitemapPath, sitemap, 'utf8')
writeFileSync(resolve(publicDir, 'robots.txt'), robots, 'utf8')

console.log(`Generated sitemap.xml with ${routes.length} URLs`)
