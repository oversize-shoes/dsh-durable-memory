import { mkdtemp, cp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const version = process.argv[2]
if (!['0.2.1-rc.2', '0.2.2-rc.5'].includes(version)) throw new Error('Specify a tested DSH version: 0.2.1-rc.2 or 0.2.2-rc.5')
const root = resolve(import.meta.dirname, '..')
const dir = await mkdtemp(join(tmpdir(), 'dsh-memory-compat-'))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const deps = { zod: pkg.dependencies.zod }
for (const name of Object.keys(pkg.devDependencies)) {
  if (name === '@deepseek-ai/dsh-tool-executor-native' && version === '0.2.1-rc.2') continue
  deps[name] = name === '@deepseek-ai/cordis' ? (version === '0.2.1-rc.2' ? '4.0.5' : '4.1.0')
    : name === '@deepseek-ai/schemastery' ? '3.18.5' : version
}
let status = 1
try {
  await writeFile(join(dir, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: deps }))
  for (const file of ['index.js', 'memory.js', 'panel-api.js', 'test']) await cp(join(root, file), join(dir, file), { recursive: true })
  // No user input is interpolated into this fixed Windows command.
  const installed = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', 'npm install --ignore-scripts --no-audit --no-fund'], { cwd: dir, stdio: 'inherit' })
    : spawnSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit' })
  if (installed.status !== 0) throw new Error('Compatibility dependency installation failed')
  const tests = spawnSync(process.execPath, ['--test'], { cwd: dir, stdio: 'inherit' })
  status = tests.status ?? 1
} finally {
  await rm(dir, { recursive: true, force: true })
}
process.exitCode = status
