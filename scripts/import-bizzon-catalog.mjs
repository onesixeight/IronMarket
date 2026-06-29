import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const BASE_URL = 'https://bizzon.pro'
const OUTPUT_JSON = path.resolve('src/data/catalog.json')
const IMAGE_DIR = path.resolve('public/images/products/bizzon')

const CATEGORY_SLUG_OVERRIDES = new Map([
  ['uzory-iz-kvadrata-85x85-mm', 'uzory-iz-kvadrata-85x85'],
  ['uzory-iz-kvadratnoi-truby-15x15-mm', 'uzory-iz-kvadratnoi-truby-15x15'],
])

const HTML_ENTITIES = new Map([
  ['&quot;', '"'],
  ['&#34;', '"'],
  ['&#39;', "'"],
  ['&apos;', "'"],
  ['&amp;', '&'],
  ['&nbsp;', ' '],
  ['&laquo;', '«'],
  ['&raquo;', '»'],
  ['&ndash;', '–'],
  ['&mdash;', '—'],
  ['&#8211;', '–'],
  ['&#8212;', '—'],
])

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; Codex catalog importer/1.0)',
      accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return response.text()
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; Codex catalog importer/1.0)' },
  })

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`)
  }

  const bytes = await response.arrayBuffer()
  return Buffer.from(bytes)
}

function decodeHtml(value = '') {
  let decoded = value

  for (const [entity, replacement] of HTML_ENTITIES) {
    decoded = decoded.split(entity).join(replacement)
  }

  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))

  return decoded
}

function stripTags(value = '') {
  return value.replace(/<[^>]+>/g, ' ')
}

function normalizeText(value = '') {
  return decodeHtml(stripTags(value))
    .replace(/\r/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeMultiline(value = '') {
  return decodeHtml(stripTags(value))
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mapCategorySlug(remoteSlug) {
  return CATEGORY_SLUG_OVERRIDES.get(remoteSlug) ?? remoteSlug
}

function extractCategories(html) {
  const categories = []
  const seen = new Set()
  const categoryRegex = /href="\/catalog\/(?<slug>[^"]+)"[^>]*>\s*(?<name>[^<]+)\s*<\/a>/g

  for (const match of html.matchAll(categoryRegex)) {
    const remoteSlug = match.groups.slug.trim()
    if (seen.has(remoteSlug)) continue

    seen.add(remoteSlug)
    categories.push({
      remoteSlug,
      slug: mapCategorySlug(remoteSlug),
      name: normalizeText(match.groups.name),
      url: `${BASE_URL}/catalog/${remoteSlug}`,
    })
  }

  return categories
}

function extractProductCards(html) {
  const cards = []
  const cardRegex = /<div class="text-center m-1 mb-5 p-1 group border flex flex-col justify-end w-full"[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/g

  for (const cardHtml of html.match(cardRegex) ?? []) {
    const hrefMatch = cardHtml.match(/<a href="(?<href>\/[^"]+)" title="(?<title>[^"]+)"/)
    const imageMatch = cardHtml.match(/<img class="mx-auto" src="(?<src>[^"]+)"/)
    const productIdMatch = cardHtml.match(/:product-id="(?<id>\d+)"/)
    const mainPriceMatch = cardHtml.match(/:main-price="(?<price>[\d.]+)"/)
    const pricesMatch = cardHtml.match(/:prices='(?<prices>\{[^']+\})'/)

    if (!hrefMatch || !imageMatch || !productIdMatch) continue

    const href = hrefMatch.groups.href.trim()
    const slug = href.replace(/^\/+/, '').replace(/\/+$/, '')

    cards.push({
      id: Number(productIdMatch.groups.id),
      slug,
      href: `${BASE_URL}/${slug}`,
      name: normalizeText(hrefMatch.groups.title),
      previewImage: imageMatch.groups.src.trim(),
      mainPrice: Number(mainPriceMatch?.groups.price ?? 0),
      prices: pricesMatch ? JSON.parse(pricesMatch.groups.prices) : {},
    })
  }

  return cards
}

function extractField(html, label) {
  const labelPattern = escapeRegex(label)
  const regex = new RegExp(
    `<div[^>]*>${labelPattern}<\\/div>\\s*<h5[^>]*>(?<value>[\\s\\S]*?)<\\/h5>`,
    'i',
  )
  return normalizeText(html.match(regex)?.groups?.value ?? '')
}

function extractDescription(html) {
  const match = html.match(
    /<div class=['"]uppercase font-bold align-center['"]>Описание:<\/div>\s*<div class="pb-1 mb-2 border-gray-300 border-b">\s*(?<value>[\s\S]*?)\s*<\/div>/i,
  )
  return normalizeMultiline(match?.groups?.value ?? '')
}

function extractOriginalImage(html) {
  const anchorMatch = html.match(/<a class='block cursor-zoom-in' href='(?<href>\/image\/[^']+)' @click\.prevent="lb\.open">/i)
  if (anchorMatch?.groups?.href) return anchorMatch.groups.href

  const lightboxMatch = html.match(/image-src="(?<src>\/image\/[^"]+)"/i)
  return lightboxMatch?.groups?.src ?? ''
}

function extractMetaDescription(html) {
  return normalizeText(html.match(/<meta name="description" content="(?<value>[^"]*)"/i)?.groups?.value ?? '')
}

function extractDetail(html) {
  const title = normalizeText(html.match(/<h1[^>]*>(?<value>[\s\S]*?)<\/h1>/i)?.groups?.value ?? '')

  return {
    title,
    size: extractField(html, 'Размер'),
    weight: extractField(html, 'Вес'),
    material: extractField(html, 'Материал'),
    description: extractDescription(html) || extractMetaDescription(html),
    imageHref: extractOriginalImage(html),
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function main() {
  const currentCatalog = JSON.parse(await fs.readFile(OUTPUT_JSON, 'utf8'))
  const existingDescriptions = new Map(currentCatalog.categories.map((category) => [category.slug, category.description]))

  const catalogHtml = await fetchText(`${BASE_URL}/catalog`)
  const categories = extractCategories(catalogHtml)

  if (categories.length === 0) {
    throw new Error('No categories found on bizzon.pro/catalog')
  }

  await ensureDir(IMAGE_DIR)

  const outputCategories = []
  const outputProducts = []
  const downloadedImages = new Map()

  for (let index = 0; index < categories.length; index += 1) {
    const category = categories[index]
    console.log(`Importing category ${index + 1}/${categories.length}: ${category.name}`)

    const categoryHtml = await fetchText(category.url)
    const cards = extractProductCards(categoryHtml)

    if (cards.length === 0) {
      console.warn(`No product cards found for ${category.url}`)
      continue
    }

    const categoryProducts = []

    for (const card of cards) {
      console.log(`  -> ${card.name}`)

      const detailHtml = await fetchText(card.href)
      const detail = extractDetail(detailHtml)
      const imageHref = detail.imageHref || card.previewImage
      const imageUrl = new URL(imageHref, BASE_URL).toString()
      // Конвертируем в WebP при скачивании, чтобы реимпорт каталога
      // не откатывал оптимизацию изображений.
      const filename = `${card.slug}.webp`
      const imagePath = path.join(IMAGE_DIR, filename)
      const publicImagePath = `/images/products/bizzon/${filename}`

      let imageBuffer = downloadedImages.get(imageUrl)
      if (!imageBuffer) {
        imageBuffer = await fetchBuffer(imageUrl)
        downloadedImages.set(imageUrl, imageBuffer)
      }

      // Конверсия в WebP (quality 82) поверх исходного буфера.
      const webpBuffer = await sharp(imageBuffer)
        .webp({ quality: 82, effort: 4 })
        .toBuffer()

      await fs.writeFile(imagePath, webpBuffer)

      const kzPrice = Number(card.prices.kz ?? 0)
      const ruPrice = Number(card.prices.ru ?? card.mainPrice ?? 0)
      const displayPrice = kzPrice > 0 ? kzPrice : ruPrice
      const hidePrice = kzPrice <= 0

      categoryProducts.push({
        id: card.id,
        categorySlug: category.slug,
        slug: card.slug,
        name: detail.title || card.name,
        price: displayPrice,
        hidePrice,
        image: publicImagePath,
        material: detail.material || undefined,
        description: detail.description || undefined,
        size: detail.size || undefined,
        weight: detail.weight || undefined,
        sourceUrl: card.href,
      })
    }

    outputCategories.push({
      id: index + 1,
      slug: category.slug,
      name: category.name,
      description:
        existingDescriptions.get(category.slug) ??
        `${category.name}. Каталог кованых элементов Bizzon.`,
      image: categoryProducts[0]?.image ?? '',
    })

    outputProducts.push(...categoryProducts)
  }

  outputProducts.sort((a, b) => a.id - b.id)

  const nextCatalog = {
    categories: outputCategories,
    products: outputProducts,
  }

  await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(nextCatalog, null, 2)}\n`, 'utf8')

  console.log(`Imported ${outputCategories.length} categories and ${outputProducts.length} products.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
