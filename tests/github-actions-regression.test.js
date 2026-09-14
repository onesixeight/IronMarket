import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8')

assert.match(workflow, /actions\/checkout@v5/, 'CI should use the Node 24-compatible checkout action')
assert.match(workflow, /actions\/setup-node@v5/, 'CI should use the Node 24-compatible setup-node action')
assert.doesNotMatch(workflow, /actions\/checkout@v4|actions\/setup-node@v4/)
assert.match(workflow, /run: npm run lint/, 'CI should run ESLint on every push and PR')
assert.match(workflow, /run: npm test/, 'CI should run unit and regression tests')

const commands = [...workflow.matchAll(/^\s+run: (.+)$/gm)].map((match) => match[1].trim())
assert.equal(commands.filter((command) => command === 'npm run build').length, 1, 'CI should build once')
const buildIndex = commands.indexOf('npm run build')
for (const command of ['npm run verify:seo', 'npm run verify:perf', 'npm run test:e2e']) {
  assert.ok(commands.indexOf(command) > buildIndex, `${command} should verify the existing build`)
}
assert.ok(commands.includes('npm audit --audit-level=high'), 'CI should reject high-severity dependency advisories')
assert.ok(!commands.some((command) => /build:static|test:e2e:ci|verify:(seo|perf):ci/.test(command)), 'CI should not replace the verified build')
assert.match(workflow, /node-version: '24'/, 'CI should use supported Node 24 LTS')
assert.match(workflow, /permissions:\s+contents: read/, 'Checks should have read-only repository access')
assert.match(workflow, /if: failure\(\)[\s\S]*path: \|\s+playwright-report\/\s+test-results\//, 'Failed E2E runs should retain diagnostics')
assert.match(workflow, /name: site-dist-\$\{\{ github.sha \}\}/, 'Verified build artifacts should identify their commit')

console.log('ok github-actions: one build passes lint, tests, dependency audit, SEO, performance and E2E checks')
