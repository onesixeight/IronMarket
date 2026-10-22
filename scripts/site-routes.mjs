import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATALOG_PAGE_SIZE, listingPagePath } from '../src/config/pagination.js'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = resolve(projectRoot, 'src/data/catalog.json')

export const staticRoutes = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0',
    sourceFiles: [
      'src/views/HomeView.vue',
      'src/components/HeroSlider.vue',
      'src/components/ApplicationExamples.vue',
      'src/components/FaqSection.vue',
    ],
  },
  {
    path: '/catalog',
    changefreq: 'weekly',
    priority: '0.9',
    sourceFiles: [
      'src/views/CatalogView.vue',
      'src/components/CatalogProjectShortcuts.vue',
      'src/data/catalog.json',
    ],
  },
  {
    path: '/constructor',
    changefreq: 'monthly',
    priority: '0.8',
    sourceFiles: ['src/views/ConstructorView.vue', 'src/data/constructor-elements.json'],
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: '0.6',
    sourceFiles: ['src/views/AboutView.vue'],
  },
  {
    path: '/delivery',
    changefreq: 'monthly',
    priority: '0.6',
    sourceFiles: ['src/views/DeliveryView.vue'],
  },
  {
    path: '/contacts',
    changefreq: 'monthly',
    priority: '0.8',
    sourceFiles: ['src/views/ContactsView.vue', 'src/config/contacts.js'],
  },
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
    sourceFiles: ['src/views/CategoryView.vue', 'src/data/catalog.json', 'src/data/category-seo.json'],
  }))

  const productRoutes = catalog.products.map((product) => ({
    path: `/product/${product.id}`,
    changefreq: 'weekly',
    priority: product.badge ? '0.7' : '0.6',
    sourceFiles: [
      'src/views/ProductView.vue',
      'src/components/ProductCard.vue',
      'src/data/catalog.json',
    ],
  }))

  const listingRoutes = [
    { path: '/catalog', count: catalog.products.length, view: 'CatalogView' },
    ...catalog.categories.map((category) => ({
      path: `/catalog/${category.slug}`,
      count: catalog.products.filter((product) => product.categorySlug === category.slug).length,
      view: 'CategoryView',
    })),
  ].flatMap((listing) => Array.from(
    { length: Math.max(0, Math.ceil(listing.count / CATALOG_PAGE_SIZE) - 1) },
    (_, index) => ({
      path: listingPagePath(listing.path, index + 2),
      changefreq: 'weekly',
      priority: '0.5',
      sourceFiles: [
        `src/views/${listing.view}.vue`, 'src/data/catalog.json',
        ...(listing.view === 'CategoryView' ? ['src/data/category-seo.json'] : []),
      ],
    })
  ))

  const seen = new Set()
  return [...staticRoutes, ...categoryRoutes, ...listingRoutes, ...productRoutes].filter((route) => {
    const path = normalizeRoutePath(route.path)
    if (seen.has(path)) return false
    seen.add(path)
    route.path = path
    return true
  })
}
