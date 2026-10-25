// Full performance profile, 2026-10-23 (Production -> Polish gate): one full
// loop (World Network 8X -> Brief -> Assembly -> Mission -> Debrief with the
// ETA catch-up -> World Network 8X) in headed Chrome for Testing at 1280x720,
// real GPU and rAF. Per phase: frame-time p50/p95/p99/max and >50 ms frames;
// draw calls per frame (counted at the GPU API); JS heap (Chrome
// performance.memory); load times: navigation (DOMContentLoaded, load), menu
// ready, and mission entry (deploy -> first frame with the squad linked).
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'

const t0 = Date.now()
const { browser, page, errs } = await L.open()
await page.goto(L.URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await page.getByText('NEW OPERATION').first().waitFor({ timeout: 20000 })
const nav = await page.evaluate(() => {
  const n = performance.getEntriesByType('navigation')[0]
  return { domContentLoadedMs: Math.round(n.domContentLoadedEventEnd), loadMs: Math.round(n.loadEventEnd), menuReadyMs: Math.round(performance.now()) }
})
await L.newOperation(page)
await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
await page.waitForTimeout(10000)
const deployAt = await page.evaluate(() => performance.now())
await L.deploy(page, 'OPEN CONTRACT RUST HAVEN')
await page.waitForFunction(() => document.querySelector('.deploy-splash.out'), null, { timeout: 60000 })
const missionEntryMs = Math.round((await page.evaluate(() => performance.now())) - deployAt)
await L.armEtaProbe(page)
const play = await L.play(page, { god: true, clean: true, budgetMs: 480000 })
await L.waitDebrief(page)
await page.waitForTimeout(3000)
await L.leaveDebrief(page)
await page.locator('[aria-label="RESUME STRATEGIC CLOCK"]').click().catch(() => {})
await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
await page.waitForTimeout(10000)
const stats = await page.evaluate(() => {
  const qs = (f) => {
    f.sort((a, b) => a - b)
    const q = (x) => +f[Math.min(f.length - 1, Math.floor(x * f.length))].toFixed(1)
    return { n: f.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: +f[f.length - 1].toFixed(1) }
  }
  const by = {}
  const start = window.__frames.find(([, , p]) => p === 'world')?.[0] ?? 0
  for (const [t, d, p] of window.__frames) if (t > start + 2000) (by[p] ||= []).push(d)
  const frames = {}
  for (const [p, f] of Object.entries(by)) frames[p] = { ...qs([...f]), over50ms: f.filter((d) => d > 50).length }
  const dby = {}
  for (const [, n, p] of window.__drawFrames) if (n > 0) (dby[p] ||= []).push(n)
  const draws = {}
  for (const [p, f] of Object.entries(dby)) draws[p] = qs([...f])
  const hby = {}
  for (const [, b, p] of window.__heap) (hby[p] ||= []).push(b / 1048576)
  const heapMb = {}
  for (const [p, f] of Object.entries(hby)) heapMb[p] = { max: +Math.max(...f).toFixed(1), last: +f[f.length - 1].toFixed(1) }
  const lt = window.__long.map(([t, d, p]) => [p, +d.toFixed(1)])
  // Ported from perf-2026-10-19: where each >50 ms frame sits, and mission
  // frames after the first 2 s (live play, the hitch budget's window).
  const firstOf = {}; const idx = {}; const spikes = []
  for (const [t, d, p] of window.__frames) {
    firstOf[p] ??= t; idx[p] = (idx[p] ?? -1) + 1
    if (d > 50) spikes.push({ phase: p, msIntoPhase: +(t - firstOf[p]).toFixed(0), frameInPhase: idx[p], ms: +d.toFixed(1) })
  }
  const m = window.__frames.filter(([t, , p]) => p === 'mission' && t > firstOf.mission + 2000).map(([, d]) => d).sort((a, b) => a - b)
  const mq = (x) => +m[Math.min(m.length - 1, Math.floor(x * m.length))].toFixed(1)
  const missionLive = { n: m.length, p50: mq(0.5), p95: mq(0.95), max: +m[m.length - 1].toFixed(1), over50ms: m.filter((d) => d > 50).length }
  return { frames, missionLive, spikes, draws, heapMb, longTasks: lt }
})
const res = { at: new Date().toISOString(), wallSec: Math.round((Date.now() - t0) / 1000), nav, missionEntryMs, play, ...stats, errs }
console.log(JSON.stringify(res, null, 1))
writeFileSync(L.OUT + 'perf.json', JSON.stringify(res, null, 1))
await browser.close()
