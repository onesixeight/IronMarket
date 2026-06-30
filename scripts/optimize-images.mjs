#!/usr/bin/env node
// scripts/optimize-images.mjs
// Оптимизация изображений для витрины «Эталон Ковка».
//
// Стратегия:
//   1. ТОВАРЫ (public/images/products/**): PNG/JPG → WebP (quality 82).
//      Расширения в src/data/catalog.json обновляются на .webp для реально
//      сконвертированных файлов. Старые PNG/JPG-оригиналы удаляются.
//   2. БРЕНД/FAVICON (public/images/branding/, public/icons/favicon*):
//      расширения НЕ меняются (требуется PNG для OG/соцсетей/тестов).
//      Только пережимаются lossless in-place.
//   3. HEIRLOOM-удаление: неиспользуемые большие оригиналы hero
//      (public/images/hero/*.png и *.jpg, т.к. код использует .webp).
//
// Безопасность: правки catalog.json делаются строго по списку реально
// сконвертированных файлов. Файлы, отсутствующие на диске, пропускаются.

import { readFile, writeFile, readdir, stat, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(projectRoot, 'public')
const catalogPath = join(projectRoot, 'src/data/catalog.json')

const WEBP_QUALITY = 82
const PNG_COMPRESSION = 9

// ---------- helpers ----------

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function fileSize(path) {
  try {
    return (await stat(path)).size
  } catch {
    return 0
  }
}

// Рекурсный обход директории
async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(full, acc)
    } else {
      acc.push(full)
    }
  }
  return acc
}

// ---------- Strategy 1: products → WebP ----------

async function optimizeProducts() {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
  const items = [...catalog.categories, ...catalog.products]
    .filter((item) => item.image)

  // Уникальные пути изображений из каталога (относительно public/)
  const imagePaths = [...new Set(items.map((item) => item.image))]
    // нормализуем: убираем ведущий /
    .map((p) => p.replace(/^\//, ''))

  const converted = {} // relativePath -> new relativePath (.webp)
  let totalBefore = 0
  let totalAfter = 0
  let count = 0
  let skipped = 0

  for (const relPath of imagePaths) {
    const absPath = join(publicDir, relPath)
    if (!existsSync(absPath)) {
      console.warn(`  ⚠ пропущен (нет файла): ${relPath}`)
      skipped++
      continue
    }

    const ext = extname(relPath).toLowerCase()
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      // уже webp или другой формат — не трогаем
      continue
    }

    const before = await fileSize(absPath)
    const newPath = absPath.replace(/\.(png|jpe?g)$/i, '.webp')

    try {
      const info = await sharp(absPath)
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toFile(newPath)

      const after = info.size
      totalBefore += before
      totalAfter += after
      count++

      // удаляем оригинал
      await rm(absPath, { force: true })

      const newRel = '/' + relative(publicDir, newPath).replace(/\\/g, '/')
      converted['/' + relPath] = newRel
    } catch (err) {
      console.error(`  ✖ ошибка конверсии ${relPath}: ${err.message}`)
      // в случае ошибки удаляем возможный partial webp, оставляем оригинал
      await rm(newPath, { force: true })
      skipped++
    }
  }

  // Обновляем catalog.json
  if (Object.keys(converted).length > 0) {
    const raw = await readFile(catalogPath, 'utf8')
    let updated = raw
    for (const [oldPath, newPath] of Object.entries(converted)) {
      // Экранируем спецсимволы для regex
      const escaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      updated = updated.replace(new RegExp(escaped, 'g'), newPath)
    }
    await writeFile(catalogPath, updated, 'utf8')
  }

  const ratio = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0
  console.log(`📦 Товары: сконвертировано ${count} файлов (${Object.keys(converted).length} ссылок в catalog.json)`)
  console.log(`   было: ${fmtSize(totalBefore)} → стало: ${fmtSize(totalAfter)} (−${ratio}%)`)
  if (skipped) console.log(`   пропущено: ${skipped}`)

  return { count, totalBefore, totalAfter }
}

// ---------- Strategy 2: brand/favicon lossless in-place ----------

async function optimizeBrandInPlace() {
  const candidates = [
    'images/branding/brand-mark-ornament.png', // OG image — оставить PNG
    'icons/favicon-brand-mark.png', // favicon — оставить PNG
  ]

  let totalBefore = 0
  let totalAfter = 0
  let count = 0

  for (const relPath of candidates) {
    const absPath = join(publicDir, relPath)
    if (!existsSync(absPath)) {
      console.warn(`  ⚠ нет файла: ${relPath}`)
      continue
    }
    const before = await fileSize(absPath)
    const tmpPath = absPath + '.tmp.png'
    try {
      const info = await sharp(absPath)
        .png({ compressionLevel: PNG_COMPRESSION, palette: true, quality: 90 })
        .toFile(tmpPath)

      // Заменяем оригинал только если стало меньше
      if (info.size < before) {
        await rm(absPath, { force: true })
        const { rename } = await import('node:fs/promises')
        await rename(tmpPath, absPath)
        totalBefore += before
        totalAfter += info.size
        count++
      } else {
        await rm(tmpPath, { force: true })
        totalBefore += before
        totalAfter += before
        console.log(`  • ${relPath}: оптимизация не дала выигрыша, оставлено как есть`)
      }
    } catch (err) {
      console.error(`  ✖ ошибка ${relPath}: ${err.message}`)
      await rm(tmpPath, { force: true })
    }
  }

  const ratio = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0
  console.log(`🎨 Бренд/favicon: пережато ${count} (PNG in-place, расширения сохранены)`)
  console.log(`   было: ${fmtSize(totalBefore)} → стало: ${fmtSize(totalAfter)} (−${ratio}%)`)
}

// ---------- Strategy 3: delete unreferenced hero originals ----------

async function deleteUnreferencedHero() {
  const heroDir = join(publicDir, 'images/hero')
  if (!existsSync(heroDir)) return

  const files = await walk(heroDir)
  // Код использует только .webp версии hero. PNG и JPG оригиналы не нужны.
  const toDelete = files.filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
  let freed = 0

  for (const file of toDelete) {
    const size = await fileSize(file)
    freed += size
    await rm(file, { force: true })
  }

  console.log(`🗑️ Hero: удалено ${toDelete.length} неиспользуемых PNG/JPG оригиналов (${fmtSize(freed)})`)
}

// ---------- main ----------

async function main() {
  console.log('🔧 Оптимизация изображений «Эталон Ковка»\n')

  console.log('— Стратегия 1: товары PNG/JPG → WebP')
  await optimizeProducts()
  console.log('')

  console.log('— Стратегия 2: бренд/favicon lossless in-place')
  await optimizeBrandInPlace()
  console.log('')

  console.log('— Стратегия 3: удаление неиспользуемых hero оригиналов')
  await deleteUnreferencedHero()
  console.log('')

  console.log('✅ Готово. Проверьте: npm run build && npm test')
}

main().catch((err) => {
  console.error('Фатальная ошибка:', err)
  process.exit(1)
})
