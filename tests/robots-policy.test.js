import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8')
const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8')
const directives = robots.split(/\r?\n/)
  .map((line) => line.split('#')[0].trim())
  .filter(Boolean)
  .map((line) => {
    const separator = line.indexOf(':')
    return { name: line.slice(0, separator).toLowerCase(), value: line.slice(separator + 1).trim() }
  })
const groups = []
for (const directive of directives) {
  if (directive.name === 'user-agent') groups.push({ agent: directive.value.toLowerCase(), rules: [] })
  else if (['allow', 'disallow'].includes(directive.name)) groups.at(-1).rules.push(directive)
}

function isAllowed(agent, path) {
  const group = groups.filter((candidate) => candidate.agent === '*' || agent.toLowerCase().includes(candidate.agent))
    .sort((a, b) => b.agent.length - a.agent.length)[0]
  const matching = group.rules.filter((rule) => path.startsWith(rule.value))
    .sort((a, b) => b.value.length - a.value.length || (a.name === 'allow' ? -1 : 1))
  return !matching.length || matching[0].name === 'allow'
}

test('robots has one wildcard group and no directives unsupported by Yandex', () => {
  assert.equal(groups.filter((group) => group.agent === '*').length, 1)
  assert.equal(new Set(groups.map((group) => group.agent)).size, groups.length)
  assert.ok(directives.every(({ name }) => ['user-agent', 'allow', 'disallow', 'sitemap', 'clean-param'].includes(name)))
  assert.deepEqual(directives.filter(({ name }) => name === 'sitemap').map(({ value }) => value), ['https://etalon-kovka.kz/sitemap.xml'])
})

test('search bots can crawl public pages and assets while service pages stay excluded', () => {
  for (const agent of ['YandexBot', 'YandexWebmaster', 'YandexImages', 'Googlebot', 'Googlebot-Image', 'bingbot']) {
    for (const path of ['/', '/catalog', '/catalog/kovanye-balyasiny', '/product/6150', '/assets/index.js', '/images/product.webp']) {
      assert.equal(isAllowed(agent, path), true, `${agent}: ${path}`)
    }
    for (const path of ['/cart', '/checkout', '/wishlist', '/thank-you']) {
      assert.equal(isAllowed(agent, path), false, `${agent}: ${path}`)
    }
  }
})

test('all previously blocked AI crawlers remain excluded', () => {
  for (const agent of ['Amazonbot', 'Applebot-Extended', 'Bytespider', 'CCBot', 'ClaudeBot', 'CloudflareBrowserRenderingCrawler', 'Google-Extended', 'GPTBot', 'meta-externalagent']) {
    for (const path of ['/', '/catalog/kovanye-balyasiny', '/product/6150', '/images/product.webp']) {
      assert.equal(isAllowed(agent, path), false, `${agent}: ${path}`)
    }
  }
})

test('all responses retain the existing content usage preferences in an HTTP header', () => {
  const wildcardHeaders = headers.split(/\r?\n/).slice(headers.split(/\r?\n/).findIndex((line) => line.trim() === '/*') + 1)
    .map((line) => line.trim())
  assert.ok(wildcardHeaders.includes('Content-Signal: search=yes, ai-train=no, use=reference'))
})
