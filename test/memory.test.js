import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import Tools from '@deepseek-ai/dsh-tools'
import { createScope, scopeTarget } from '@deepseek-ai/dsh-scope'
import { Memory, spec, scopeOf } from '../memory.js'
import { apply } from '../index.js'

const config = { enabled: true, maxEntries: 30, maxContentChars: 2000, recallChars: 6000, recallLimit: 8 }
const source = { session: 'test-session', seq: 1 }

async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-memory-test-'))
  const ctx = new Context()
  new Storage(ctx)
  const backend = new JsonStorageBackend(root)
  ctx.storage.backend.register('json', backend)
  const facility = new DomainFacility(ctx, { backend: 'json' })
  t.after(async () => { await facility.closeAll(); await backend.close(); await ctx.fiber.dispose(); await rm(root, { recursive: true, force: true }) })
  return { ctx, root, facility }
}

test('真实 JSON 存储重启后保留记忆、来源和版本', async t => {
  const { facility } = await setup(t)
  let domain = await facility.open(spec)
  let memory = new Memory(domain.table('memories'), config)
  const saved = await memory.save({ scope: 'project:a', content: '项目使用中文回答', source })
  await domain.close()
  domain = await facility.open(spec)
  memory = new Memory(domain.table('memories'), config)
  assert.equal(memory.search('project:a', '中文回答')[0].id, saved.memory.id)
  assert.deepEqual(memory.search('project:a')[0].source, source)
})

test('范围隔离、全局召回、过期过滤、重复保存并发去重', async t => {
  const { facility } = await setup(t)
  const memory = new Memory((await facility.open(spec)).table('memories'), config)
  const saves = await Promise.all(Array.from({ length: 5 }, () => memory.save({ scope: 'project:a', content: '部署使用容器', source })))
  assert.equal(saves.filter(s => s.action === 'created').length, 1)
  await memory.save({ scope: 'global', content: '偏好中文解释', source })
  await memory.save({ scope: 'project:b', content: 'B 的私有事实', source })
  const expired = await memory.save({ scope: 'project:a', content: '短期测试', source })
  await memory.table.put(expired.memory.id, { ...expired.memory, expiresAt: Date.now() - 1 })
  assert.equal(memory.visible('project:a').length, 2)
  assert.equal(memory.search('project:a', '中文解释')[0].scope, 'global')
  assert.equal(memory.visible('project:a').some(m => m.content.includes('私有')), false)
})

test('并发更新阻止旧版本覆盖；删除后召回消失', async t => {
  const { facility } = await setup(t)
  const memory = new Memory((await facility.open(spec)).table('memories'), config)
  const { memory: m } = await memory.save({ scope: 'project:a', content: '使用 npm', source })
  const changes = await Promise.allSettled(['改用 pnpm', '改用 yarn'].map(content => memory.change('project:a', m.id, 1, content, source)))
  assert.equal(changes.filter(x => x.status === 'fulfilled').length, 1)
  await assert.rejects(memory.remove('project:b', m.id, 2))
  await memory.remove('project:a', m.id, 2)
  assert.equal(memory.visible('project:a').length, 0)
})

test('中文检索、预算、敏感内容与容量校验', async t => {
  const { facility } = await setup(t)
  const memory = new Memory((await facility.open(spec)).table('memories'), { ...config, maxEntries: 2, recallChars: 180 })
  await memory.save({ scope: 'global', content: '部署使用容器', source })
  await memory.save({ scope: 'global', content: '爱喝咖啡', source })
  assert.equal(memory.search('project:a', '如何部署容器').length, 1)
  assert.ok(memory.render('project:a', '部署').length <= 180)
  await assert.rejects(memory.save({ scope: 'global', content: 'password=secret12345', source }))
  await assert.rejects(memory.save({ scope: 'global', content: '第三条', source }), /容量/)
})

test('损坏存储拒绝加载，不静默清空', async t => {
  const { root, facility } = await setup(t)
  const domain = await facility.open(spec)
  await new Memory(domain.table('memories'), config).save({ scope: 'global', content: '重要事实', source })
  await domain.close()
  const path = join(root, 'durable_memory.json')
  const original = await readFile(path, 'utf8')
  await writeFile(path, '{broken')
  await assert.rejects(facility.open(spec))
  assert.equal(await readFile(path, 'utf8'), '{broken')
  await writeFile(path, original)
})

test('真实 Cordis、工具与上下文服务挂载、跨范围召回和停用清理', async t => {
  const { ctx, root, facility } = await setup(t)
  new SystemPrompt(ctx, {})
  new Tools(ctx)
  if (typeof ctx.tools.setExecutor === 'function') {
    const { NativeToolExecutor } = await import('@deepseek-ai/dsh-tool-executor-native')
    ctx.tools.setExecutor(new NativeToolExecutor(ctx))
  }
  ctx.provide('storageDomain', facility)
  const aKey = {}, bKey = {}
  const aScope = createScope(ctx, aKey), bScope = createScope(ctx, bKey)
  const agent = { ctx: aScope.ctx, session: { id: 'a', seq: 2, header: { cwd: root } } }
  const other = { ctx: bScope.ctx, session: { id: 'b', seq: 0, header: {} } }
  ctx.provide('agents', { list: () => [agent, other] })
  // Plugin ownership is unscoped, while agent-owned registrations carry agent scopes.
  const plugin = ctx.plugin({ name: 'test-memory', apply: pluginCtx => apply(pluginCtx, config) })
  await plugin
  const table = facility.get('durable_memory').table('memories')
  await new Memory(table, config).save({ scope: scopeOf(root), content: '部署使用容器', source })
  const a = await ctx.systemPrompt.assemble({ scope: aKey })
  const b = await ctx.systemPrompt.assemble({ scope: bKey })
  assert.ok(a.contexts.some(c => c.text.includes('部署使用容器')))
  assert.equal(b.contexts.some(c => c.text.includes('部署使用容器')), false)
  assert.ok(ctx.tools.schemas().some(tool => tool.name === 'durable_memory'))
  const execution = {
    agent, signal: new AbortController().signal,
  }
  async function execute(args, id) {
    return typeof ctx.tools.setExecutor === 'function'
      ? (await ctx.tools.execute({ ...execution, calls: [{ type: 'tool_call', id, name: 'durable_memory', arguments: JSON.stringify(args) }] })).results[0].result
      : await ctx.tools.execute({ ...execution, callId: id, name: 'durable_memory', arguments: args })
  }
  const saved = await execute({ action: 'save', content: '持续集成使用 GitHub Actions' }, 'save-1')
  assert.equal(saved.isError, false)
  assert.ok(JSON.stringify(saved).includes(scopeOf(root)))
  const outcome = await execute({ action: 'search', query: '持续集成' }, 'search-1')
  assert.equal(outcome.isError, false)
  assert.ok(JSON.stringify(outcome).includes('GitHub Actions'))
  await ctx.serial(scopeTarget(agent, aKey), 'agent/pre-step', {
    agent, messages: [{ content: [{ type: 'text', text: '持续集成' }] }],
  }, async () => ({ kind: 'continue' }))
  assert.ok((await ctx.systemPrompt.assemble({ scope: aKey })).contexts.some(c => c.text.includes('GitHub Actions')))
  await plugin.dispose()
  assert.equal((await ctx.systemPrompt.assemble({ scope: aKey })).contexts.some(c => c.name === 'durable-memory'), false)
  assert.equal(ctx.tools.schemas().some(tool => tool.name === 'durable_memory'), false)
  const reloaded = ctx.plugin({ name: 'test-memory-reload', apply: pluginCtx => apply(pluginCtx, config) })
  await reloaded
  assert.ok((await ctx.systemPrompt.assemble({ scope: aKey })).contexts.some(c => c.text.includes('GitHub Actions')))
  await reloaded.dispose()
  await aScope.dispose(); await bScope.dispose()
})
