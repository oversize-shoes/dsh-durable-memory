/* Prebuilt browser module: uses the host's React instance and slot registry. No build/install script. */
window.__ModuleLoader__.load({
  id: 'dsh-durable-memory',
  factory: require => {
    const React = require('react')
    const { createElement: h, useState, useEffect, useCallback } = React
    const css = `
      .dm-root{height:100%;min-height:420px;overflow:auto;padding:24px 24px 180px;color:var(--dsw-alias-label-primary,#eee);font:14px/1.6 system-ui,sans-serif;box-sizing:border-box}
      .dm-head,.dm-tools,.dm-row,.dm-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.dm-head{justify-content:space-between}.dm-root h2{font-size:21px;margin:0}.dm-muted{opacity:.62;font-size:12px}.dm-note{margin:12px 0 22px;padding:12px 16px;border:1px solid #8883;border-radius:10px;line-height:1.7}.dm-stats{display:flex;gap:12px;margin:18px 0}.dm-stat{border:1px solid #8883;border-radius:10px;padding:12px 20px;min-width:90px}.dm-stat b{font-size:24px;display:block}.dm-tools{margin:18px 0}.dm-root input,.dm-root select,.dm-root textarea{color:inherit;background:var(--dsw-alias-bg-layer-1,#202124);border:1px solid #8885;border-radius:7px;padding:8px 10px;font:inherit;box-sizing:border-box}.dm-search{flex:1;min-width:160px}.dm-root button{font:inherit;cursor:pointer;border:1px solid #8885;border-radius:7px;padding:7px 12px;background:transparent;color:inherit}.dm-root button:hover{background:#8882}.dm-root button:disabled{opacity:.4;cursor:not-allowed}.dm-root .dm-primary{background:#3779d6;color:white;border-color:#3779d6}.dm-root .dm-danger{color:#e68181}.dm-list{display:grid;gap:12px}.dm-card{padding:18px;border:1px solid #8883;border-radius:12px;background:var(--dsw-alias-bg-layer-1,#1b1c1f)}.dm-card p{white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0}.dm-row{justify-content:space-between}.dm-badge{display:inline-block;border:1px solid #8884;border-radius:20px;padding:1px 9px;font-size:12px;margin-right:6px}.dm-meta{font-size:12px;opacity:.65;overflow-wrap:anywhere}.dm-empty{padding:50px 20px;text-align:center;border:1px dashed #8885;border-radius:12px}.dm-error{color:#e99797;white-space:pre-wrap}.dm-toast{color:#8dccae;margin:8px 0}.dm-editor{margin:16px 0;border:1px solid #6096da80;border-radius:12px;padding:18px}.dm-editor textarea{display:block;width:100%;min-height:110px;margin:10px 0}.dm-editor label{display:flex;gap:8px;align-items:center}.dm-editor .dm-fields{display:flex;gap:14px;flex-wrap:wrap;margin:12px 0}.dm-pager{display:flex;justify-content:center;gap:15px;align-items:center;padding:20px}.dm-root code{font-size:12px;opacity:.75}.dm-root details{margin-top:10px}.dm-root summary{cursor:pointer;opacity:.65;font-size:12px}@media(max-width:650px){.dm-root{padding:14px}.dm-stats{gap:6px}.dm-stat{padding:8px 12px;min-width:55px}}`
    const zh = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')
    const labels = zh ? {
      title:'记忆',subtitle:'可查看、可维护的跨会话记忆', all:'全部记忆', project:'当前项目',global:'全局',active:'有效',expired:'已过期',any:'全部状态',
      search:'搜索内容、标签或来源…',add:'新增记忆',refresh:'刷新',save:'保存',cancel:'取消',edit:'编辑',remove:'删除',confirm:'确认删除',
      empty:'这里还没有记忆',emptyHint:'点击“新增记忆”手动保存，或在对话中要求模型调用 durable_memory。', noMatch:'没有符合筛选条件的记忆',
      note:'跨会话、跨重启有效。写入仅发生在你点击保存，或模型调用保存工具时；打开会话和每轮结束不会自动写入。自动召回只读取已有内容。',
      pinned:'固定',tags:'标签（逗号分隔）',ttl:'有效天数（0 为永久）',content:'记忆内容',source:'来源与详情',scope:'范围',created:'创建',updated:'更新',expires:'到期',never:'永久',
      manual:'面板手动保存',tool:'模型工具保存',old:'早期版本保存',next:'下一页',previous:'上一页',loading:'加载中…',saved:'已保存',deleted:'已删除',
      noProject:'当前会话工作目录尚未就绪；仍可管理全部/全局记忆。',current:'当前目录',write:'手动写入',read:'召回不写入',capacity:'容量',count:'条',details:'来源会话',
    } : {
      title:'Memory',subtitle:'Inspect and maintain memory across conversations',all:'All memories',project:'Current project',global:'Global',active:'Active',expired:'Expired',any:'All states',
      search:'Search content, tags or source…',add:'New memory',refresh:'Refresh',save:'Save',cancel:'Cancel',edit:'Edit',remove:'Delete',confirm:'Confirm deletion',
      empty:'No memories yet',emptyHint:'Add one here or ask the model to call durable_memory.',noMatch:'No memories match these filters',
      note:'Persistent across conversations and restarts. Writes happen only when you save here or the model calls a save tool. Opening a conversation or ending a turn does not save automatically. Recall only reads existing entries.',
      pinned:'Pinned',tags:'Tags (comma separated)',ttl:'Lifetime in days (0 = forever)',content:'Memory content',source:'Source and details',scope:'Scope',created:'Created',updated:'Updated',expires:'Expires',never:'Never',
      manual:'Saved from panel',tool:'Saved by model tool',old:'Saved by earlier version',next:'Next',previous:'Previous',loading:'Loading…',saved:'Saved',deleted:'Deleted',
      noProject:'Working directory is not ready. All/global memories remain available.',current:'Current directory',write:'Manual save',read:'Recall does not write',capacity:'Capacity',count:'entries',details:'Source session',
    }
    function Panel({ sessionId }) {
      const [data, setData] = useState({ records: [], currentScope: null, cwd: null, maxEntries: 2000, maxContentChars: 2000 })
      const [loaded, setLoaded] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('')
      const [filter, setFilter] = useState('all'), [status, setStatus] = useState('all'), [query, setQuery] = useState('')
      const [page, setPage] = useState(0), [editor, setEditor] = useState(null), [busy, setBusy] = useState(false), [deleting, setDeleting] = useState(null)
      const load = useCallback(async signal => {
        try {
          const response = await fetch('/api/durable-memory?sessionId=' + encodeURIComponent(sessionId ?? ''), { credentials:'same-origin', cache:'no-store', signal })
          const body = await response.json()
          if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`)
          setData(body); setLoaded(true); setError('')
        } catch (e) { if (e.name !== 'AbortError') { setError(e.message); setLoaded(true) } }
      }, [sessionId])
      useEffect(() => {
        const controller = new AbortController()
        setLoaded(false); setEditor(null); setDeleting(null); setData({records:[],currentScope:null,cwd:null,maxEntries:2000,maxContentChars:2000})
        load(controller.signal)
        const timer = setInterval(() => { if (!document.hidden) load(controller.signal) }, 5000)
        return () => { controller.abort(); clearInterval(timer) }
      }, [load])
      useEffect(() => { setPage(0); setDeleting(null) }, [filter, status, query])
      async function mutate(body) {
        setBusy(true); setError(''); setMessage('')
        try {
          const response = await fetch('/api/durable-memory', { method:'POST', credentials:'same-origin', headers:{'content-type':'application/json'}, body:JSON.stringify({...body,sessionId}) })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`)
          setEditor(null); setDeleting(null); setMessage(body.action === 'delete' ? labels.deleted : labels.saved); await load()
        } catch (e) { await load(); setError(e.message) }
        finally { setBusy(false) }
      }
      const now = Date.now(), expired = record => record.expiresAt !== null && record.expiresAt <= now
      const records = [...data.records].sort((a,b) => b.updatedAt-a.updatedAt)
      const filtered = records.filter(record => (filter === 'all' || (filter === 'global' ? record.scope === 'global' : record.scope === data.currentScope))
        && (status === 'all' || (status === 'expired' ? expired(record) : !expired(record)))
        && (record.content+' '+record.tags.join(' ')+' '+record.source.session).toLowerCase().includes(query.toLowerCase()))
      const pages = Math.max(1,Math.ceil(filtered.length/20)), currentPage = Math.min(page,pages-1)
      const date = timestamp => timestamp === null ? labels.never : new Date(timestamp).toLocaleString()
      const field = (key,value) => setEditor(current => ({...current,[key]:value}))
      return h('section',{className:'dm-root','aria-label':labels.title},
        h('style',null,css),
        h('header',{className:'dm-head'},h('div',null,h('h2',null,labels.title),h('span',{className:'dm-muted'},labels.subtitle)),
          h('div',{className:'dm-tools'},h('button',{onClick:()=>load(),disabled:busy},labels.refresh),h('button',{className:'dm-primary',disabled:!loaded||busy,onClick:()=>{setEditor({scope:data.currentScope?'project':'global',content:'',tags:'',pinned:false,ttlDays:0});setMessage('')}},labels.add))),
        h('div',{className:'dm-note'},labels.note),
        h('div',{className:'dm-muted'},data.cwd ? labels.current+': '+data.cwd : labels.noProject),
        h('div',{className:'dm-stats'}, ...[[records.length,labels.all],[records.filter(r=>!expired(r)).length,labels.active],[records.filter(r=>r.scope==='global').length,labels.global],[records.filter(expired).length,labels.expired]].map(([count,label])=>h('div',{className:'dm-stat',key:label},h('b',null,count),label))),
        h('div',{className:'dm-muted'},`${labels.capacity}: ${records.length} / ${data.maxEntries}`),
        error && h('p',{className:'dm-error',role:'alert'},error),message && h('p',{className:'dm-toast',role:'status'},message),
        editor && h('form',{className:'dm-editor',onSubmit:event=>{event.preventDefault(); mutate(editor.id?{action:'update',id:editor.id,revision:editor.revision,content:editor.content}:{action:'save',scope:editor.scope,content:editor.content,tags:editor.tags.split(/[,，]/).map(s=>s.trim()).filter(Boolean),pinned:editor.pinned,ttlDays:Number(editor.ttlDays)})}},
          h('b',null,editor.id?labels.edit:labels.add),h('textarea',{'aria-label':labels.content,required:true,maxLength:data.maxContentChars,value:editor.content,onChange:event=>field('content',event.target.value)}),
          !editor.id && h('div',{className:'dm-fields'},h('label',null,labels.scope,h('select',{'aria-label':labels.scope,value:editor.scope,onChange:event=>field('scope',event.target.value)},h('option',{value:'global'},labels.global),h('option',{value:'project',disabled:!data.currentScope},labels.project))),
            h('label',null,labels.ttl,h('input',{type:'number',min:0,max:36500,value:editor.ttlDays,onChange:event=>field('ttlDays',event.target.value)})),
            h('label',null,h('input',{type:'checkbox',checked:editor.pinned,onChange:event=>field('pinned',event.target.checked)}),labels.pinned),
            h('input',{'aria-label':labels.tags,placeholder:labels.tags,value:editor.tags,onChange:event=>field('tags',event.target.value)})),
          h('div',{className:'dm-tools'},h('button',{type:'submit',className:'dm-primary',disabled:busy},labels.save),h('button',{type:'button',disabled:busy,onClick:()=>setEditor(null)},labels.cancel))),
        h('div',{className:'dm-tools'},h('select',{'aria-label':labels.scope,value:filter,onChange:event=>setFilter(event.target.value)},h('option',{value:'all'},labels.all),h('option',{value:'project',disabled:!data.currentScope},labels.project),h('option',{value:'global'},labels.global)),
          h('select',{'aria-label':labels.any,value:status,onChange:event=>setStatus(event.target.value)},h('option',{value:'all'},labels.any),h('option',{value:'active'},labels.active),h('option',{value:'expired'},labels.expired)),
          h('input',{className:'dm-search','aria-label':labels.search,placeholder:labels.search,value:query,onChange:event=>setQuery(event.target.value)})),
        !loaded ? h('p',null,labels.loading) : filtered.length===0 ? h('div',{className:'dm-empty'},h('b',null,records.length?labels.noMatch:labels.empty),h('p',{className:'dm-muted'},labels.emptyHint)) :
          h('div',{className:'dm-list'},...filtered.slice(currentPage*20,currentPage*20+20).map(record=>h('article',{className:'dm-card',key:record.id},
            h('div',{className:'dm-row'},h('div',null,h('span',{className:'dm-badge'},record.scope==='global'?labels.global:record.scope===data.currentScope?labels.project:(record.projectPath ?? record.scope.slice(0,23)+'…')),h('span',{className:'dm-badge'},expired(record)?labels.expired:labels.active),record.pinned&&h('span',{className:'dm-badge'},labels.pinned)),
              h('div',null,h('button',{disabled:busy,onClick:()=>setEditor({...record})},labels.edit),' ',deleting===record.id?h(React.Fragment,null,h('button',{className:'dm-danger',disabled:busy,onClick:()=>mutate({action:'delete',id:record.id,revision:record.revision})},labels.confirm),' ',h('button',{onClick:()=>setDeleting(null)},labels.cancel)):h('button',{className:'dm-danger',disabled:busy,onClick:()=>setDeleting(record.id)},labels.remove))),
            h('p',null,record.content),record.tags.length>0&&h('div',null,...record.tags.map((tag,i)=>h('span',{className:'dm-badge',key:i},tag))),
            h('div',{className:'dm-meta'},h('span',null,labels.updated+': '+date(record.updatedAt)),h('span',null,labels.expires+': '+date(record.expiresAt))),
            h('details',null,h('summary',null,labels.source),h('div',{className:'dm-muted'},labels.details+': '+record.source.session+' · seq '+record.source.seq),h('div',{className:'dm-muted'},record.source.kind==='panel'?labels.manual:record.source.kind==='tool'?labels.tool:labels.old),h('div',{className:'dm-muted'},labels.created+': '+date(record.createdAt)),h('code',null,record.id+' · revision '+record.revision),h('div',null,h('code',null,record.scope)))))),
        filtered.length>20&&h('div',{className:'dm-pager'},h('button',{disabled:currentPage===0,onClick:()=>setPage(currentPage-1)},labels.previous),`${currentPage+1} / ${pages}`,h('button',{disabled:currentPage+1>=pages,onClick:()=>setPage(currentPage+1)},labels.next)))
    }
    return {
      inject:['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.view',()=>ctx.slots.register({name:'conversation.view',id:'durable-memory',order:20,label:labels.title},Panel))
      },
    }
  },
})
