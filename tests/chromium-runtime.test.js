import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'

import { getChromiumLaunchOptions, isWorkersBuild } from '../scripts/chromium-runtime.mjs'

test('portable Chromium is selected only for Linux Workers Builds', () => {
  assert.equal(isWorkersBuild({ WORKERS_CI: '1' }, 'linux'), true)
  assert.equal(isWorkersBuild({ WORKERS_CI: 'true' }, 'linux'), true)
  assert.equal(isWorkersBuild({ WORKERS_CI: 'false' }, 'linux'), false)
  assert.equal(isWorkersBuild({ CI: 'true' }, 'linux'), false)
  assert.equal(isWorkersBuild({ WORKERS_CI: '1' }, 'win32'), false)
})

test('ordinary local/CI runs keep Playwright defaults without loading the Linux package', async () => {
  const options = await getChromiumLaunchOptions({
    env: { CI: 'true' },
    platform: 'linux',
    loadPortableChromium: () => { throw new Error('Should not load portable Chromium') },
  })
  assert.deepEqual(options, {})
})

test('Workers launch uses bundled libraries and preserves the parent environment', async () => {
  const env = { WORKERS_CI: '1', LD_LIBRARY_PATH: '/existing/lib', FONTCONFIG_PATH: '/existing/fonts', PATH: '/usr/bin' }
  const archives = []
  const options = await getChromiumLaunchOptions({
    env,
    platform: 'linux',
    loadPortableChromium: async () => ({
      default: { executablePath: async () => '/tmp/chromium', args: ['--single-process', '--no-sandbox'] },
      inflate: async (archive) => { archives.push(archive); return '/tmp/al2023' },
    }),
  })
  assert.equal(options.executablePath, '/tmp/chromium')
  assert.deepEqual(options.args, ['--no-sandbox'])
  assert.equal(options.headless, true)
  assert.equal(options.env.LD_LIBRARY_PATH, `${join('/tmp/al2023', 'lib')}:/existing/lib`)
  assert.equal(options.env.FONTCONFIG_PATH, '/existing/fonts')
  assert.equal(options.env.PATH, '/usr/bin')
  assert.equal(env.LD_LIBRARY_PATH, '/existing/lib', 'Do not mutate the build process environment')
  assert.equal(archives.length, 1)
  assert.ok(archives[0].endsWith(join('bin', 'al2023.tar.br')))
})
