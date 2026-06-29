import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SITE_ORIGIN, toSiteUrl } from '../src/config/site.js'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// JSON грузим через readFileSync вместо static import с атрибутом
// 'with { type: "json" }' — это совместимо с любой версией Node (включая
// Node 18/20 на CI/хостингах, где import attributes могут не поддерживаться).
const catalog = JSON.parse(readFileSync(resolve(projectRoot, 'src/data/catalog.json'), 'utf8'))

const publicDir = resolve(projectRoot, 'public')
const today = new Date().toISOString().slice(0, 10)

const staticRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/catalog', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/delivery', changefreq: 'monthly', priority: '0.6' },
  { path: '/contacts', changefreq: 'monthly', priority: '0.8' },
]

const categoryRoutes = catalog.categories.map((category) => ({
  path: `/catalog/${category.slug}`,
  changefreq: 'weekly',
  priority: '0.8',
}))

const productRoutes = catalog.products.map((product) => ({
  path: `/product/${product.id}`,
  changefreq: 'weekly',
  priority: product.badge ? '0.7' : '0.6',
}))

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function normalizePath(path) {
  if (path === '/') return '/'
  return `/${String(path).replace(/^\/+|\/+$/g, '')}`
}

const seen = new Set()
const routes = [...staticRoutes, ...categoryRoutes, ...productRoutes].filter((route) => {
  const path = normalizePath(route.path)
  if (seen.has(path)) return false
  seen.add(path)
  route.path = path
  return true
})

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${escapeXml(toSiteUrl(route.path))}</loc>
    <lastmod>${today}</lastmod>
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
writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(resolve(publicDir, 'robots.txt'), robots, 'utf8')

console.log(`Generated sitemap.xml with ${routes.length} URLs`)
