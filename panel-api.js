import { z } from 'zod'
import { scopeOf } from './memory.js'

const mutation = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save'), scope: z.enum(['project', 'global']), sessionId: z.string().optional(), content: z.string(), tags: z.array(z.string()).default([]), pinned: z.boolean().default(false), ttlDays: z.number().default(0) }),
  z.object({ action: z.literal('update'), id: z.string(), revision: z.number().int().positive(), content: z.string(), sessionId: z.string().optional() }),
  z.object({ action: z.literal('delete'), id: z.string(), revision: z.number().int().positive() }),
])

/** Only registered through DSH Connection's authenticated owner-only Fetch route. */
export function panelHandler(memory, sessionFor) {
  return async request => {
    const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store' } })
    try {
      if (request.method === 'GET') {
        const id = new URL(request.url).searchParams.get('sessionId')
        const session = id ? sessionFor(id) : undefined
        const cwd = session?.header.cwd
        const currentScope = cwd ? scopeOf(cwd) : null
        return json({ records: [...memory.table.entries()].map(([, value]) => value), currentScope, cwd: cwd ?? null,
          maxEntries: memory.config.maxEntries, maxContentChars: memory.config.maxContentChars })
      }
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
      const text = await request.text()
      if (Buffer.byteLength(text) > 32768) return json({ error: 'Request too large' }, 413)
      const args = mutation.parse(JSON.parse(text))
      const session = args.sessionId ? sessionFor(args.sessionId) : undefined
      const source = { session: session ? String(session.id) : 'manual-panel', seq: session ? Number(session.seq) : 0, kind: 'panel' }
      let result
      if (args.action === 'save') {
        const scope = args.scope === 'global' ? 'global' : scopeOf(session?.header.cwd)
        result = await memory.save({ ...args, scope, source, projectPath: session?.header.cwd })
      } else {
        const record = memory.table.get(args.id)
        if (!record) return json({ error: 'Memory not found' }, 404)
        result = args.action === 'update'
          ? await memory.change(record.scope, args.id, args.revision, args.content, source)
          : await memory.remove(record.scope, args.id, args.revision)
      }
      return json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return json({ error: message }, /revision|已变化/.test(message) ? 409 : 400)
    }
  }
}
