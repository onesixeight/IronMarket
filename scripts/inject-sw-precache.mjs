#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

export function injectPrecache(source, assets) {
  if (!source.includes(precacheMarker) || !source.includes('__BUILD_ID__')) {
    throw new Error('Unable to find the service worker precache or build version marker.')
  }
  // Optional voice SDK is downloaded only after the visitor opens the assistant.
  const sortedAssets = assets.filter((asset) => !/\/voice-assistant-sdk-[^/]+\.js$/.test(asset)).sort()
  const buildId = createHash('sha256').update(source).update(JSON.stringify(sortedAssets)).digest('hex').slice(0, 16)
  return source
    .replace('__BUILD_ID__', buildId)
    .replace(precacheMarker, serializePrecacheAssets(sortedAssets))
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
  const output = injectPrecache(source, assetFiles)
  await writeFile(swPath, output, 'utf8')

  console.log(`Injected ${assetFiles.length} JS/CSS assets into dist/sw.js precache list`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
