import assert from 'node:assert/strict'
import test from 'node:test'

import { GITHUB_CI, verifyGithubCi } from '../scripts/verify-github-ci.mjs'

const sha = 'a'.repeat(40)
const success = {
  id: 12,
  head_sha: sha,
  head_branch: 'main',
  event: 'push',
  path: '.github/workflows/test.yml',
  head_repository: { full_name: GITHUB_CI.repository },
  status: 'completed',
  conclusion: 'success',
}
const runs = (...workflowRuns) => Response.json({ workflow_runs: workflowRuns })
const main = () => Response.json({ object: { sha } })

function harness(responses, overrides = {}) {
  const requests = []
  const waits = []
  let time = 0
  return {
    requests,
    waits,
    verify: () => verifyGithubCi({
      sha,
      branch: 'main',
      fetchImpl: async (url, options) => {
        requests.push({ url: String(url), options })
        const response = responses.shift()
        if (response instanceof Error) throw response
        assert.ok(response, 'Test should supply each expected API response')
        return response
      },
      sleep: async (milliseconds) => { waits.push(milliseconds); time += milliseconds },
      now: () => time,
      log: () => {},
      ...overrides,
    }),
  }
}

test('passes only a successful push workflow for this commit and current main, without credentials', async () => {
  const check = harness([runs(success), main()])
  assert.equal((await check.verify()).id, success.id)
  const url = new URL(check.requests[0].url)
  assert.equal(url.pathname, '/repos/onesixeight/IronMarket/actions/workflows/test.yml/runs')
  assert.equal(url.searchParams.get('head_sha'), sha)
  assert.equal(url.searchParams.get('event'), 'push')
  assert.equal(check.requests[0].options.headers.Authorization, undefined)
  assert.deepEqual(check.waits, [])
})

test('waits for a new queued run, then checks the completed run', async () => {
  const check = harness([runs(), runs({ ...success, status: 'in_progress', conclusion: null }), runs(success), main()])
  await check.verify()
  assert.deepEqual(check.waits, [60_000, 60_000])
})

test('rejects missing or partial commit and non-production branch before any request', async () => {
  for (const overrides of [{ sha: undefined }, { sha: 'abcdef' }, { branch: 'feature' }, { branch: undefined }]) {
    const check = harness([], overrides)
    await assert.rejects(check.verify(), /Deployment blocked/)
    assert.equal(check.requests.length, 0)
  }
})

test('ignores another SHA, branch, event, workflow or fork instead of accepting its success', async () => {
  for (const overrides of [
    { head_sha: 'b'.repeat(40) }, { head_branch: 'feature' }, { event: 'pull_request' },
    { path: '.github/workflows/other.yml' }, { head_repository: { full_name: 'fork/IronMarket' } },
  ]) {
    const check = harness([runs({ ...success, ...overrides })], { timeoutMs: 60_000 })
    await assert.rejects(check.verify(), /Timed out/)
  }
})

test('blocks unsuccessful or cancelled CI, including a newer failed run after an older success', async () => {
  for (const conclusion of ['failure', 'cancelled', 'timed_out', 'skipped', null]) {
    const check = harness([runs(success, { ...success, id: 13, conclusion })])
    await assert.rejects(check.verify(), /run 13 concluded/)
    assert.deepEqual(check.waits, [])
  }
})

test('blocks an older build once another commit reaches main', async () => {
  const check = harness([runs(success), Response.json({ object: { sha: 'b'.repeat(40) } })])
  await assert.rejects(check.verify(), /no longer the current main/)
})

test('honors Retry-After and recovers without real waiting', async () => {
  const check = harness([new Response(null, { status: 429, headers: { 'Retry-After': '120' } }), runs(success), main()])
  await check.verify()
  assert.deepEqual(check.waits, [120_000])
})

test('fails within the deadline if the public GitHub rate limit resets too late', async () => {
  const check = harness([new Response(null, {
    status: 403,
    headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '3600' },
  })])
  await assert.rejects(check.verify(), /Timed out/)
  assert.deepEqual(check.waits, [])
})

test('retries temporary network and server errors but fails after three consecutive failures', async () => {
  const recovery = harness([new Error('offline'), new Response(null, { status: 503 }), runs(success), main()])
  await recovery.verify()
  assert.deepEqual(recovery.waits, [60_000, 60_000])
  const outage = harness([new Error('offline'), new Error('offline'), new Error('offline')])
  await assert.rejects(outage.verify(), /three consecutive API failures/)
  assert.equal(outage.requests.length, 3)
})

test('fails closed on permission errors, missing workflow or malformed API data', async () => {
  for (const response of [new Response(null, { status: 403 }), new Response(null, { status: 404 }),
    new Response('not json'), Response.json({ unexpected: true })]) {
    const check = harness([response])
    await assert.rejects(check.verify(), /Deployment blocked/)
    assert.deepEqual(check.waits, [])
  }
})
