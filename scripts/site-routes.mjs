import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = resolve(projectRoot, 'src/data/catalog.json')

export const staticRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/catalog', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/delivery', changefreq: 'monthly', priority: '0.6' },
  { path: '/contacts', changefreq: 'monthly', priority: '0.8' },
]

export function readCatalog() {
  return JSON.parse(readFileSync(catalogPath, 'utf8'))
}

export function normalizeRoutePath(path) {
  if (path === '/') return '/'
  return `/${String(path).replace(/^\/+|\/+$/g, '')}`
}

export function buildSiteRoutes(catalog = readCatalog()) {
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

  const seen = new Set()
  return [...staticRoutes, ...categoryRoutes, ...productRoutes].filter((route) => {
    const path = normalizeRoutePath(route.path)
    if (seen.has(path)) return false
    seen.add(path)
    route.path = path
    return true
  })
}
