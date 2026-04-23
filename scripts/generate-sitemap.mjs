import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const catalog = JSON.parse(readFileSync(join(__dirname, '../src/data/catalog.json'), 'utf8'))

const baseUrl = 'https://etalon-kovka.kz'
const today = new Date().toISOString().split('T')[0]

const staticUrls = [
  { loc: '/', priority: '1.0' },
  { loc: '/catalog', priority: '0.9' },
  { loc: '/about', priority: '0.7' },
  { loc: '/contacts', priority: '0.8' },
  { loc: '/delivery', priority: '0.7' },
  { loc: '/wishlist', priority: '0.5' },
  { loc: '/cart', priority: '0.5' },
]

const categoryUrls = catalog.categories.map(c => ({
  loc: `/catalog/${c.slug}`,
  priority: '0.8',
}))

const productUrls = catalog.products.map(p => ({
  loc: `/product/${p.id}`,
  priority: '0.7',
}))

const allUrls = [...staticUrls, ...categoryUrls, ...productUrls]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

writeFileSync(join(__dirname, '../public/sitemap.xml'), xml)
console.log(`Sitemap generated: ${allUrls.length} URLs`)
