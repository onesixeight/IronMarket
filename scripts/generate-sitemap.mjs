import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SITE_ORIGIN, toSiteUrl } from '../src/config/site.js'
import { buildSiteRoutes } from './site-routes.mjs'
import { ensureSitemapHistory } from './sitemap-history.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(projectRoot, 'public')
const sitemapPath = resolve(publicDir, 'sitemap.xml')
ensureSitemapHistory(projectRoot)
const routes = buildSiteRoutes()
const existingLastmodByLoc = readExistingLastmodByLoc(sitemapPath)
const sourceLastmodCache = new Map()

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

function normalizeLastmod(value) {
  if (typeof value !== 'string') return null
  const date = value.trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

function readSourceLastmod(sourceFiles = []) {
  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) return null

  const key = sourceFiles.join('\0')
  if (sourceLastmodCache.has(key)) return sourceLastmodCache.get(key)

  try {
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', ...sourceFiles],
      {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    )
    const lastmod = normalizeLastmod(output)
    sourceLastmodCache.set(key, lastmod)
    return lastmod
  } catch {
    sourceLastmodCache.set(key, null)
    return null
  }
}

function getLastmod(route) {
  const loc = toSiteUrl(route.path)
  return normalizeLastmod(route.lastmod)
    || readSourceLastmod(route.sourceFiles)
    || normalizeLastmod(existingLastmodByLoc.get(loc))
}

function renderLastmod(route) {
  const lastmod = getLastmod(route)
  return lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${escapeXml(toSiteUrl(route.path))}</loc>${renderLastmod(route)}
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

const blockedAiCrawlers = [
  'Amazonbot',
  'Applebot-Extended',
  'Bytespider',
  'CCBot',
  'ClaudeBot',
  'CloudflareBrowserRenderingCrawler',
  'Google-Extended',
  'GPTBot',
  'meta-externalagent',
]

const robots = `# Content usage preferences are sent in the Content-Signal HTTP response header.
# Policy: https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/#content-signals-policy
# The current signals are search=yes, ai-train=no, use=reference.
# Access to this site is subject to these content usage conditions:
# A yes signal permits its corresponding use; a no signal prohibits that use.
# An omitted signal neither grants nor restricts permission for that use.
# Search covers indexing, links and short excerpts, but not AI-generated summaries.
# AI training includes training and fine-tuning models.
# Reference use permits indexing, excerpts and links back to the source.
# These restrictions expressly reserve rights under Article 4 of EU Directive
# 2019/790 on copyright and related rights in the Digital Single Market.
User-agent: *
Allow: /
Disallow: /cart
Disallow: /checkout
Disallow: /wishlist
Disallow: /thank-you

${blockedAiCrawlers.map((agent) => `User-agent: ${agent}\nDisallow: /`).join('\n\n')}

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`

mkdirSync(publicDir, { recursive: true })
writeFileSync(sitemapPath, sitemap, 'utf8')
writeFileSync(resolve(publicDir, 'robots.txt'), robots, 'utf8')

console.log(`Generated sitemap.xml with ${routes.length} URLs`)
