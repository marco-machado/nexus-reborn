// Profiling driver: same loop as perf.mjs, plus CDP traces at four windows,
// raw rAF deltas, and React commit/render counts per phase.
import * as L from '/Users/machado/Projects/nexus-reborn/production/qa/evidence/frame-time-pass-2026-10-22/baseline/lib.mjs'
import { writeFileSync } from 'fs'
const OUT = process.env.OUT || new URL('.', import.meta.url).pathname
const TRACE = process.env.TRACE !== '0'
const { browser, ctx, page, errs } = await L.open()
// React commit hook: count commits and components that performed work, per phase.
await ctx.addInitScript(() => {
  const counts = {} // phase -> { commits, comps: {name: n} }
  window.__rc = counts
  const nameOf = (f) => {
    const t = f.type
    if (!t) return null
    if (typeof t === 'function') return t.displayName || t.name || 'anon'
    if (typeof t === 'object') { const i = t.render || t.type; return 'memo/fwd:' + ((i && (i.displayName || i.name)) || '?') }
    return null
  }
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true, renderers: new Map(), isDisabled: false,
    inject() { return 1 }, checkDCE() {}, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, onScheduleFiberRoot() {},
    onCommitFiberRoot(_id, root) {
      if (!window.__rcOn) return
      const p = window.__phase || '?'
      const c = (counts[p] ||= { commits: 0, comps: {} })
      c.commits++
      const stack = [root.current]
      while (stack.length) {
        const f = stack.pop()
        if ((f.tag === 0 || f.tag === 1 || f.tag === 11 || f.tag === 14 || f.tag === 15) && (f.flags & 1)) {
          const n = nameOf(f); if (n) c.comps[n] = (c.comps[n] || 0) + 1
        }
        if (f.child) stack.push(f.child)
        if (f.sibling) stack.push(f.sibling)
      }
    },
  }
})
const cdp = await ctx.newCDPSession(page)
const cats = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'v8.execute', 'disabled-by-default-v8.cpu_profiler', 'blink.user_timing', 'gpu', 'viz', 'toplevel', 'disabled-by-default-devtools.timeline.stack', 'v8', 'blink', 'cc', 'latencyInfo'].join(',')
async function trace(name, fn) {
  if (!TRACE) return fn()
  await cdp.send('Tracing.start', { transferMode: 'ReturnAsStream', traceConfig: { includedCategories: cats.split(','), enableSampling: true } })
  const r = await fn()
  const done = new Promise((res) => cdp.once('Tracing.tracingComplete', res))
  await cdp.send('Tracing.end')
  const { stream } = await done
  let data = ''
  for (;;) { const c = await cdp.send('IO.read', { handle: stream }); data += c.data; if (c.eof) break }
  await cdp.send('IO.close', { handle: stream })
  writeFileSync(OUT + name + '.trace.json', data)
  return r
}
const mark = (n) => page.evaluate((n) => performance.mark(n), n)
await L.newOperation(page)
await page.evaluate(() => (window.__rcOn = true))
await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
await page.waitForTimeout(3000)
await trace('world-steady', () => page.waitForTimeout(5000))
await page.waitForTimeout(2000)
await trace('deploy', async () => { await L.deploy(page, 'OPEN CONTRACT RUST HAVEN'); await page.waitForTimeout(3000) })
await L.armEtaProbe(page)
const playP = L.play(page, { god: true, clean: true, budgetMs: 480000 })
await page.waitForTimeout(15000)
await trace('mission-steady', () => page.waitForTimeout(5000))
const play = await playP
await L.waitDebrief(page)
await page.waitForTimeout(3000)
await trace('return', async () => {
  await L.leaveDebrief(page)
  await page.locator('[aria-label="RESUME STRATEGIC CLOCK"]').click().catch(() => {})
  await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
  await page.waitForTimeout(2000)
})
await page.waitForTimeout(8000)
const raw = await page.evaluate(() => ({ frames: window.__frames, long: window.__long, rc: window.__rc }))
writeFileSync(OUT + 'raw.json', JSON.stringify({ play: play.result, ...raw, errs }))
console.log(play.result, errs.length, JSON.stringify(Object.fromEntries(Object.entries(raw.rc).map(([p, c]) => [p, c.commits]))))
await browser.close()
