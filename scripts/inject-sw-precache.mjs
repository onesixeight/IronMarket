#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(projectRoot, 'dist')
const assetsDir = join(distDir, 'assets')
const swPath = join(distDir, 'sw.js')
const precacheMarker = 'const PRECACHE_ASSETS = []'
const precacheExtensions = new Set(['.css', '.js'])

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function walkFiles(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkFiles(fullPath, acc)
    } else {
      acc.push(fullPath)
    }
  }

  return acc
}

function toPublicPath(filePath) {
  return '/' + relative(distDir, filePath).replace(/\\/g, '/')
}

function serializePrecacheAssets(assets) {
  return `const PRECACHE_ASSETS = ${JSON.stringify(assets, null, 2)}`
}

async function main() {
  if (!(await pathExists(swPath))) {
    throw new Error('dist/sw.js was not found. Run vite build before injecting the service worker precache list.')
  }

  const assetFiles = (await pathExists(assetsDir) ? await walkFiles(assetsDir) : [])
    .filter((filePath) => precacheExtensions.has(extname(filePath).toLowerCase()))
    .map(toPublicPath)
    .sort()

  const source = await readFile(swPath, 'utf8')
  if (!source.includes(precacheMarker)) {
    throw new Error('Unable to find the service worker precache marker.')
  }

  const output = source.replace(precacheMarker, serializePrecacheAssets(assetFiles))
  await writeFile(swPath, output, 'utf8')

  console.log(`Injected ${assetFiles.length} JS/CSS assets into dist/sw.js precache list`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
