// Per-thread busy time (top-level X events) and frame reporter states.
const fs = require('fs')
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const ev = Array.isArray(raw) ? raw : raw.traceEvents
const names = {}, pnames = {}
for (const e of ev) { if (e.ph === 'M' && e.name === 'thread_name') names[e.pid + ':' + e.tid] = e.args.name; if (e.ph === 'M' && e.name === 'process_name') pnames[e.pid] = e.args.name }
const by = {}
let mn = Infinity, mx = -Infinity
for (const e of ev) { if (e.ts > 0) { if (e.ts < mn) mn = e.ts; if (e.ts > mx) mx = e.ts } }
const evs = {}
for (const e of ev) if (e.ph === 'X' && e.dur) (evs[e.pid + ':' + e.tid] ||= []).push(e)
for (const [k, list] of Object.entries(evs)) {
  list.sort((a, b) => a.ts - b.ts || b.dur - a.dur)
  let end = -1, busy = 0, n = 0
  for (const t of list) if (t.ts >= end) { busy += t.dur; end = t.ts + t.dur; n++ }
  by[k] = { busy: busy / 1000, n }
}
const span = (mx - mn) / 1000
console.log('span ms', span.toFixed(0))
for (const [k, v] of Object.entries(by).sort((a, b) => b[1].busy - a[1].busy).slice(0, 14)) console.log(`${(pnames[k.split(':')[0]] || '?').padEnd(10)} ${(names[k] || '?').padEnd(28)} busy ${v.busy.toFixed(0)}ms (${(100 * v.busy / span).toFixed(1)}%) tasks ${v.n}`)
const st = {}
for (const e of ev) if (e.name === 'PipelineReporter' && e.ph === 'b') { const s = e.args?.chrome_frame_reporter?.state; st[s] = (st[s] || 0) + 1 }
console.log('PipelineReporter', JSON.stringify(st))
const dr = {}
for (const e of ev) if (e.name === 'PipelineReporter' && e.ph === 'b') { const r = e.args?.chrome_frame_reporter; if (r?.state !== 'STATE_PRESENTED_ALL') { const k = (r?.frame_drop_reason || '') + '/' + (r?.scroll_state || '') + '/' + (r?.has_main_animation ? 'main' : '') + (r?.has_compositor_animation ? 'comp' : ''); dr[k] = (dr[k] || 0) + 1 } }
console.log('non-presented', JSON.stringify(dr))
