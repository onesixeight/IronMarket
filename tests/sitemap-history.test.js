import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'

import { ensureSitemapHistory } from '../scripts/sitemap-history.mjs'

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'sitemap-history-'))
  t.after(() => {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()))
    assert.ok(basename(directory).startsWith('sitemap-history-'))
    rmSync(directory, { recursive: true, force: true })
  })
  const origin = join(directory, 'origin')
  const checkout = join(directory, 'checkout')
  mkdirSync(origin)
  const git = (cwd, ...args) => execFileSync('git', args, {
    cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
  git(origin, 'init')
  for (const [file, date] of [['home.html', '2026-09-01'], ['about.html', '2026-09-02'], ['README.md', '2026-09-03']]) {
    writeFileSync(join(origin, file), file)
    git(origin, 'add', file)
    execFileSync('git', ['-c', 'user.name=Sitemap Test', '-c', 'user.email=sitemap@example.test', '-c', 'commit.gpgsign=false', 'commit', '-m', file], {
      cwd: origin,
      stdio: 'ignore',
      env: { ...process.env, GIT_AUTHOR_DATE: `${date}T12:00:00Z`, GIT_COMMITTER_DATE: `${date}T12:00:00Z` },
    })
  }
  git(directory, 'clone', '--depth=1', pathToFileURL(origin).href, checkout)
  return { checkout, git: (...args) => git(checkout, ...args) }
}

test('Workers shallow checkout restores source dates without changing the checked-out commit', (t) => {
  const { checkout, git } = fixture(t)
  const revision = git('rev-parse', 'HEAD')
  assert.equal(git('rev-parse', '--is-shallow-repository'), 'true')
  assert.equal(git('log', '-1', '--format=%cs', '--', 'home.html'), '2026-09-03')

  ensureSitemapHistory(checkout, { env: { ...process.env, WORKERS_CI: '1' } })

  assert.equal(git('rev-parse', '--is-shallow-repository'), 'false')
  assert.equal(git('rev-parse', 'HEAD'), revision)
  assert.equal(git('log', '-1', '--format=%cs', '--', 'home.html'), '2026-09-01')
  assert.equal(git('log', '-1', '--format=%cs', '--', 'about.html'), '2026-09-02')

  git('remote', 'remove', 'origin')
  assert.doesNotThrow(() => ensureSitemapHistory(checkout, { env: { ...process.env, WORKERS_CI: '1' } }))
})

test('shallow local checkout fails with instructions instead of publishing false dates', (t) => {
  const { checkout, git } = fixture(t)
  assert.throws(() => ensureSitemapHistory(checkout, { env: { ...process.env, WORKERS_CI: '' } }), /fetch-depth: 0/)
  assert.equal(git('rev-parse', '--is-shallow-repository'), 'true')
})

test('Workers history fetch failure is explicit and does not expose the remote', (t) => {
  const { checkout, git } = fixture(t)
  git('remote', 'set-url', 'origin', join(checkout, 'private-remote-does-not-exist'))
  assert.throws(() => ensureSitemapHistory(checkout, { env: { ...process.env, WORKERS_CI: 'true' } }), (error) => {
    assert.match(error.message, /Cannot fetch complete Git history/)
    assert.doesNotMatch(error.message, /private-remote/)
    return true
  })
  assert.equal(git('rev-parse', '--is-shallow-repository'), 'true')
})
