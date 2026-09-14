#!/usr/bin/env node

import { setTimeout as delay } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

export const GITHUB_CI = {
  repository: 'onesixeight/IronMarket',
  branch: 'main',
  workflow: 'test.yml',
  timeoutMs: 12 * 60_000,
  pollIntervalMs: 60_000,
}

class RetryableError extends Error {
  constructor(message, retryAfterMs = 0) {
    super(message)
    this.retryAfterMs = retryAfterMs
  }
}

function rateLimitDelay(response, now) {
  const retryAfter = response.headers.get('retry-after')
  if (retryAfter) {
    const seconds = Number(retryAfter)
    const milliseconds = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - now
    if (milliseconds > 0) return milliseconds
  }
  if (response.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000
    if (reset > now) return reset - now + 1000
  }
  return GITHUB_CI.pollIntervalMs
}

export async function verifyGithubCi({
  sha,
  branch,
  fetchImpl = fetch,
  sleep = delay,
  now = Date.now,
  log = console.log,
  timeoutMs = GITHUB_CI.timeoutMs,
} = {}) {
  if (!/^[a-f0-9]{40}$/i.test(sha || '')) {
    throw new Error('WORKERS_CI_COMMIT_SHA must contain the full 40-character commit SHA. Deployment blocked.')
  }
  if (branch !== GITHUB_CI.branch) {
    throw new Error(`Production deployment requires WORKERS_CI_BRANCH=${GITHUB_CI.branch}. Deployment blocked.`)
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > GITHUB_CI.timeoutMs) {
    throw new Error('CI wait timeout must be positive and no longer than 12 minutes.')
  }

  const commit = sha.toLowerCase()
  const apiBase = `https://api.github.com/repos/${GITHUB_CI.repository}`
  const runsUrl = new URL(`${apiBase}/actions/workflows/${GITHUB_CI.workflow}/runs`)
  runsUrl.search = new URLSearchParams({ head_sha: commit, branch, event: 'push', per_page: '100' })
  const deadline = now() + timeoutMs
  let transientFailures = 0
  let previousMessage = ''

  function report(message) {
    if (message !== previousMessage) log(message)
    previousMessage = message
  }

  async function readJson(url) {
    const remaining = deadline - now()
    if (remaining <= 0) throw new Error('Timed out waiting for successful GitHub CI. Deployment blocked.')
    let response
    try {
      response = await fetchImpl(url, {
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
        signal: AbortSignal.timeout(Math.min(15_000, remaining)),
      })
    } catch {
      throw new RetryableError('GitHub API network request failed')
    }
    if (response.status === 429 || (response.status === 403 && (
      response.headers.get('x-ratelimit-remaining') === '0' || response.headers.has('retry-after')
    ))) {
      throw new RetryableError('GitHub API rate limit reached', rateLimitDelay(response, now()))
    }
    if (response.status >= 500) throw new RetryableError(`GitHub API returned HTTP ${response.status}`)
    if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}. Deployment blocked.`)
    try {
      return await response.json()
    } catch {
      throw new Error('GitHub API returned invalid JSON. Deployment blocked.')
    }
  }

  while (now() < deadline) {
    let waitMs = GITHUB_CI.pollIntervalMs
    try {
      const result = await readJson(runsUrl)
      if (!Array.isArray(result.workflow_runs)) throw new Error('GitHub workflow response is invalid. Deployment blocked.')
      const run = result.workflow_runs
        .filter((candidate) => candidate.head_sha === commit && candidate.head_branch === branch &&
          candidate.event === 'push' && candidate.path === `.github/workflows/${GITHUB_CI.workflow}` &&
          candidate.head_repository?.full_name === GITHUB_CI.repository)
        .sort((a, b) => b.id - a.id)[0]

      if (run?.status === 'completed') {
        if (run.conclusion !== 'success') {
          throw new Error(`GitHub Tests run ${run.id} concluded ${run.conclusion || 'without success'}. Deployment blocked.`)
        }
        const currentMain = await readJson(`${apiBase}/git/ref/heads/${GITHUB_CI.branch}`)
        if (currentMain.object?.sha !== commit) {
          throw new Error('This commit is no longer the current main branch. Deployment blocked.')
        }
        report(`GitHub Tests passed for ${commit}: https://github.com/${GITHUB_CI.repository}/actions/runs/${run.id}`)
        return run
      }
      transientFailures = 0
      report(run ? `Waiting for GitHub Tests run ${run.id}: ${run.status}.` : `Waiting for GitHub Tests to start for ${commit}.`)
    } catch (error) {
      if (!(error instanceof RetryableError)) throw error
      transientFailures += 1
      if (transientFailures >= 3) {
        throw new Error(`${error.message}; three consecutive API failures. Deployment blocked.`, { cause: error })
      }
      waitMs = Math.max(waitMs, error.retryAfterMs)
      report(`${error.message}; retrying in ${Math.ceil(waitMs / 1000)} seconds.`)
    }
    if (waitMs >= deadline - now()) break
    await sleep(waitMs)
  }
  throw new Error('Timed out waiting for successful GitHub CI. Deployment blocked; retry the Cloudflare build after CI succeeds.')
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) {
  verifyGithubCi({ sha: process.env.WORKERS_CI_COMMIT_SHA, branch: process.env.WORKERS_CI_BRANCH }).catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
