import { execFileSync } from 'node:child_process'

export function ensureSitemapHistory(projectRoot, { env = process.env } = {}) {
  const options = {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 90000,
    env: { ...env, GIT_TERMINAL_PROMPT: '0' },
  }
  const git = (...args) => execFileSync('git', args, options).trim()
  let shallow
  try {
    shallow = git('rev-parse', '--is-shallow-repository')
  } catch {
    throw new Error('Sitemap lastmod requires readable Git history. Run the build from a Git checkout.')
  }
  if (shallow === 'false') return

  if (!['1', 'true'].includes(env.WORKERS_CI)) {
    throw new Error('Sitemap lastmod requires complete Git history. Use checkout fetch-depth: 0 or run git fetch --unshallow before building.')
  }

  console.log('[sitemap] Shallow Workers Builds checkout: fetching source history for lastmod.')
  try {
    const revision = git('rev-parse', 'HEAD')
    git('fetch', '--unshallow', '--no-tags', 'origin', revision)
    if (git('rev-parse', '--is-shallow-repository') !== 'false') throw new Error('Incomplete history')
  } catch {
    // Git errors can contain credentials from a configured remote URL.
    throw new Error('Cannot fetch complete Git history for sitemap lastmod. Ensure origin is accessible or provide a full checkout; no sitemap was generated.')
  }
  console.log('[sitemap] Complete Git history ready.')
}
