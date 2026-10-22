// Path 10 hitch check: per-phase frame times and long tasks over one full
// loop (World Network 8X → Brief → Assembly → Mission → Debrief with the 2-day
// ETA catch-up → World Network 8X), measured with real rAF in headed Chrome.
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'

// r1-r3 variant: TAG names this run's files (before-1, after-2, ...); adds
// two World Network screenshots (first visit, after the Debrief return) and a
// per-phase count of frames over 1.5x p50 (dropped refreshes).
const TAG = process.env.TAG || 'run'

const { browser, page, errs } = await L.open()
await L.newOperation(page)
await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
await page.waitForTimeout(10000)
await page.screenshot({ path: L.OUT + TAG + '-world-first.png' })
await L.deploy(page, 'OPEN CONTRACT RUST HAVEN')
await L.armEtaProbe(page)
const play = await L.play(page, { god: true, clean: true, budgetMs: 480000 }) // no fast-forward: real-time mission frames
await L.waitDebrief(page)
await page.waitForTimeout(3000)
await L.leaveDebrief(page)
await page.locator('[aria-label="RESUME STRATEGIC CLOCK"]').click().catch(() => {})
await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
await page.waitForTimeout(10000)
await page.screenshot({ path: L.OUT + TAG + '-world-return.png' })
const stats = await page.evaluate(() => {
  const by = {}
  const start = window.__frames.find(([, , p]) => p === 'world')?.[0] ?? 0
  for (const [t, d, p] of window.__frames) if (t > start + 2000) (by[p] ||= []).push(d)
  const out = {}
  for (const [p, f] of Object.entries(by)) {
    f.sort((a, b) => a - b)
    const q = (x) => +f[Math.min(f.length - 1, Math.floor(x * f.length))].toFixed(1)
    out[p] = { n: f.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: +f[f.length - 1].toFixed(1), over50ms: f.filter((d) => d > 50).length, over100ms: f.filter((d) => d > 100).length, dropped: f.filter((d) => d > 1.5 * f[Math.floor(0.5 * f.length)]).length }
  }
  // The frame that contains the Mission → Debrief switch carries the ETA catch-up.
  const i = window.__frames.findIndex(([, , p]) => p === 'debrief')
  const around = window.__frames.slice(Math.max(0, i - 3), i + 6).map(([, d, p]) => [p, +d.toFixed(1)])
  const lt = window.__long.map(([t, d, p]) => [p, +d.toFixed(1)])
  return { perPhase: out, debriefEntryFrames: around, longTasks: lt }
})
const eta = await page.evaluate(() => window.__eta && { days: window.__eta.days })
const res = { play, eta, ...stats, errs }
console.log(JSON.stringify(res, null, 1))
writeFileSync(L.OUT + TAG + '.json', JSON.stringify(res, null, 1))
await browser.close()
