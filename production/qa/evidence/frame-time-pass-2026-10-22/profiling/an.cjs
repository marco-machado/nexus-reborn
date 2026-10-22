// Trace analyzer: main-thread task stats, top self-time functions, and
// self time grouped by source file. Usage: node an.cjs trace.json [t0ms t1ms] (window relative to trace start)
const fs = require('fs')
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const ev = Array.isArray(raw) ? raw : raw.traceEvents
const names = {}
for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') names[e.pid + ':' + e.tid] = e.args.name
const mains = Object.entries(names).filter(([, n]) => n === 'CrRendererMain').map(([k]) => k)
const cnt = {}
for (const e of ev) { const k = e.pid + ':' + e.tid; if (mains.includes(k)) cnt[k] = (cnt[k] || 0) + 1 }
const main = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0]
const [mpid, mtid] = main.split(':').map(Number)
let ts0 = Infinity; for (const e of ev) if (e.pid === mpid && e.tid === mtid && e.ph === "X" && (e.name === "ThreadControllerImpl::RunTask" || e.name === "RunTask") && e.ts < ts0) ts0 = e.ts
const w0 = process.argv[3] ? ts0 + +process.argv[3] * 1000 : -Infinity
const w1 = process.argv[4] ? ts0 + +process.argv[4] * 1000 : Infinity
const mine = ev.filter((e) => e.pid === mpid && e.tid === mtid && e.ts >= w0 && e.ts <= w1)
const tasks = mine.filter((e) => e.ph === 'X' && (e.name === 'ThreadControllerImpl::RunTask' || e.name === 'RunTask')).sort((a, b) => a.ts - b.ts)
// de-nest tasks
const top = []; let end = -1
for (const t of tasks) { if (t.ts >= end) { top.push(t); end = t.ts + t.dur } }
let mx = -Infinity, mn = Infinity; for (const e of mine) { if (e.ts > mx) mx = e.ts; if (e.ts < mn) mn = e.ts }
const span = (mx - mn) / 1000
const busy = top.reduce((s, t) => s + t.dur, 0) / 1000
const d = top.map((t) => t.dur / 1000).sort((a, b) => a - b)
const q = (p) => d[Math.min(d.length - 1, Math.floor(p * d.length))]
console.log(`main ${main} span ${span.toFixed(0)}ms tasks ${top.length} busy ${busy.toFixed(0)}ms (${(100 * busy / span).toFixed(1)}%) p50 ${q(0.5)?.toFixed(2)} p95 ${q(0.95)?.toFixed(2)} p99 ${q(0.99)?.toFixed(2)} max ${d[d.length - 1]?.toFixed(1)}`)
// Big tasks with their direct child events by name
const big = top.filter((t) => t.dur > (+process.env.BIG || 20000))
for (const t of big.slice(0, 12)) {
  const ch = mine.filter((e) => e.ph === 'X' && e.ts >= t.ts && e.ts + (e.dur || 0) <= t.ts + t.dur && e !== t)
  const by = {}
  for (const c of ch) { const n = c.name + (c.args?.data?.functionName ? '(' + c.args.data.functionName + ')' : '') + (c.args?.data?.url ? ' ' + c.args.data.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 60) : ''); by[n] = (by[n] || 0) + c.dur / 1000 }
  console.log(`  big task @${((t.ts - ts0) / 1000).toFixed(0)}ms ${(t.dur / 1000).toFixed(1)}ms: ` + Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([n, v]) => n + '=' + v.toFixed(1)).join(' | '))
}
// Event-name totals on main thread (X only, top-level-ish)
const byName = {}
for (const e of mine) if (e.ph === 'X') byName[e.name] = (byName[e.name] || 0) + (e.dur || 0) / 1000
console.log('event totals: ' + Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([n, v]) => n + '=' + v.toFixed(0)).join(' | '))
// CPU profile
const prof = {}
for (const e of ev) {
  if (e.name !== 'ProfileChunk' && e.name !== 'Profile') continue
  if (e.pid !== mpid) continue
  const id = e.id
  const p = (prof[id] ||= { nodes: new Map(), samples: [], deltas: [], start: 0, tid: e.tid })
  if (e.name === 'Profile') p.start = e.args.data.startTime
  const cp = e.args.data.cpuProfile
  if (cp?.nodes) for (const n of cp.nodes) p.nodes.set(n.id, n)
  if (cp?.samples) for (const s of cp.samples) p.samples.push(s)
  if (e.args.data.timeDeltas) for (const s of e.args.data.timeDeltas) p.deltas.push(s)
}
const self = {}, file = {}, incl = {}
let total = 0
for (const p of Object.values(prof)) {
  if (p.tid !== mtid) continue
  const parent = new Map()
  for (const n of p.nodes.values()) if (n.parent) parent.set(n.id, n.parent); 
  for (const n of p.nodes.values()) for (const c of n.children || []) parent.set(c, n.id)
  let t = p.start
  for (let i = 0; i < p.samples.length; i++) {
    t += p.deltas[i] || 0
    const dt = (p.deltas[i + 1] || 0) / 1000
    if (t < w0 || t > w1) continue
    const n = p.nodes.get(p.samples[i]); if (!n) continue
    const cf = n.callFrame
    if (cf.functionName === '(idle)' || cf.functionName === '(program)') { self[cf.functionName] = (self[cf.functionName] || 0) + dt; continue }
    total += dt
    const url = (cf.url || '').replace(/^https?:\/\/[^/]+/, '').replace(/\?.*/, '')
    const k = cf.functionName + ' ' + url.split('/').slice(-1)[0] + ':' + (cf.lineNumber + 1)
    self[k] = (self[k] || 0) + dt
    const f = url.replace(/^\/node_modules\/\.vite\/deps\//, 'deps/') || '(native)'
    file[f] = (file[f] || 0) + dt
    // inclusive by src file (each file once per sample)
    const seen = new Set(); let x = n
    while (x) { const u = (x.callFrame.url || '').replace(/^https?:\/\/[^/]+/, '').replace(/\?.*/, ''); const kk = x.callFrame.functionName + ' ' + u.split('/').slice(-1)[0] + ':' + (x.callFrame.lineNumber + 1); if (u.startsWith('/src/') && !seen.has(kk)) { seen.add(kk); incl[kk] = (incl[kk] || 0) + dt } x = p.nodes.get(parent.get(x.id)) }
  }
}
const top20 = (o, k = 25) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k).map(([n, v]) => '    ' + v.toFixed(1).padStart(8) + ' ' + n).join('\n')
console.log(`cpu samples total (non-idle) ${total.toFixed(0)}ms; idle ${(self['(idle)'] || 0).toFixed(0)} program ${(self['(program)'] || 0).toFixed(0)}`)
console.log('self by file:\n' + top20(file, 20))
console.log('self by function:\n' + top20(self, 30))
console.log('inclusive /src functions:\n' + top20(incl, 30))
