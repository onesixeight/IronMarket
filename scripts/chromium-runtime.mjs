import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function isWorkersBuild(env = process.env, platform = process.platform) {
  return platform === 'linux' && ['1', 'true'].includes(env.WORKERS_CI)
}

export async function getChromiumLaunchOptions({
  env = process.env,
  platform = process.platform,
  loadPortableChromium = () => import('@sparticuz/chromium'),
} = {}) {
  if (!isWorkersBuild(env, platform)) return {}

  const { default: portableChromium, inflate } = await loadPortableChromium()
  // Workers Builds cannot apt-install browser dependencies. Use the package's
  // bundled libraries explicitly: its automatic detection covers AWS, not Ubuntu.
  const libraryArchive = fileURLToPath(new URL('../bin/al2023.tar.br', import.meta.resolve('@sparticuz/chromium')))
  const [executablePath, libraryDirectory] = await Promise.all([
    portableChromium.executablePath(),
    inflate(libraryArchive),
  ])
  const libraryPaths = [join(libraryDirectory, 'lib'), ...(env.LD_LIBRARY_PATH || '').split(':').filter(Boolean)]

  return {
    executablePath,
    // The Lambda single-process workaround stalls concurrent page operations on
    // Workers Builds' Ubuntu host. Keep renderer processes separate there.
    args: portableChromium.args.filter((argument) => argument !== '--single-process'),
    headless: true,
    env: {
      ...env,
      LD_LIBRARY_PATH: [...new Set(libraryPaths)].join(':'),
      FONTCONFIG_PATH: env.FONTCONFIG_PATH || join(tmpdir(), 'fonts'),
    },
  }
}
