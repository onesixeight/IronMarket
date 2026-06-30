import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const siteConfigPath = resolve(projectRoot, 'src/config/site.js')
const useSeo = readFileSync(resolve(projectRoot, 'src/composables/useSeo.js'), 'utf8')
const useProductInquiry = readFileSync(
  resolve(projectRoot, 'src/composables/useProductInquiry.js'),
  'utf8'
)
const useSchemaOrg = readFileSync(resolve(projectRoot, 'src/composables/useSchemaOrg.js'), 'utf8')
const sitemapGenerator = readFileSync(resolve(projectRoot, 'scripts/generate-sitemap.mjs'), 'utf8')

assert.ok(existsSync(siteConfigPath), 'shared site config should exist')

const siteConfig = readFileSync(siteConfigPath, 'utf8')
const site = await import(pathToFileURL(siteConfigPath).href)

assert.match(siteConfig, /export const SITE_ORIGIN = 'https:\/\/etalon-kovka\.kz'/)
assert.match(siteConfig, /export const SITE_NAME = /)
assert.match(siteConfig, /export const DEFAULT_SOCIAL_IMAGE = '\/images\/branding\/brand-mark-ornament\.png'/)
assert.match(siteConfig, /export function toSiteUrl/)
assert.match(siteConfig, /export function toAbsoluteSiteUrl/)

assert.equal(site.SITE_ORIGIN, 'https://etalon-kovka.kz')
assert.equal(site.DEFAULT_SOCIAL_IMAGE, '/images/branding/brand-mark-ornament.png')
assert.equal(site.toSiteUrl('/'), 'https://etalon-kovka.kz/')
assert.equal(site.toSiteUrl('/catalog'), 'https://etalon-kovka.kz/catalog')
assert.equal(site.toSiteUrl('catalog/uzory'), 'https://etalon-kovka.kz/catalog/uzory')
assert.equal(
  site.toAbsoluteSiteUrl('/images/branding/brand-mark-ornament.png'),
  'https://etalon-kovka.kz/images/branding/brand-mark-ornament.png'
)
assert.equal(site.toAbsoluteSiteUrl('https://cdn.example.com/image.png'), 'https://cdn.example.com/image.png')

assert.match(useSeo, /from '\.\.\/config\/site\.js'/)
assert.match(useProductInquiry, /from '\.\.\/config\/site\.js'/)
assert.match(useSchemaOrg, /from '\.\.\/config\/site\.js'/)
assert.match(sitemapGenerator, /from '\.\.\/src\/config\/site\.js'/)

for (const [name, content] of Object.entries({
  useSeo,
  useProductInquiry,
  useSchemaOrg,
  sitemapGenerator,
})) {
  assert.doesNotMatch(
    content,
    /https:\/\/etalon-kovka\.vercel\.app|https:\/\/etalon-kovka\.kz/,
    `${name} should read the public origin from shared site config`
  )
}
