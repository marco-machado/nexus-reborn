// World Network jitter experiment: rAF delta stats under in-page conditions.
import * as L from '/Users/machado/Projects/nexus-reborn/production/qa/evidence/frame-time-pass-2026-10-22/baseline/lib.mjs'
const { browser, page } = await L.open()
await L.newOperation(page)
const css = (rule) => page.evaluate((r) => { let s = document.getElementById('__x'); if (!s) { s = document.createElement('style'); s.id = '__x'; document.head.appendChild(s) } s.textContent = r }, rule)
const speed = () => page.locator('[aria-label="CLOCK SPEED 8X"]').click()
const pause = () => page.locator('[aria-label="PAUSE STRATEGIC CLOCK"]').click()
const conds = {
  'A 8X': async () => { await css(''); await speed() },
  'B paused': async () => { await css(''); await pause() },
  'C 8X canvas hidden': async () => { await css('.globe-view canvas{visibility:hidden}'); await speed() },
  'D 8X markers hidden': async () => { await css('.globe-marker-layer{display:none}'); await speed() },
  'E paused canvas hidden': async () => { await css('.globe-view canvas{visibility:hidden}'); await pause() },
}
const res = {}
for (let rep = 0; rep < 2; rep++) for (const [k, f] of Object.entries(conds)) {
  await f(); await page.waitForTimeout(1500)
  const t0 = await L.now(page); await page.waitForTimeout(6000); const t1 = await L.now(page)
  const s = await page.evaluate(([a, b]) => {
    const d = window.__frames.filter(([t]) => t > a && t <= b).map(([, x]) => x).sort((x, y) => x - y)
    const q = (p) => +d[Math.min(d.length - 1, Math.floor(p * d.length))].toFixed(2)
    const m = q(0.5)
    return { n: d.length, p50: m, p95: q(0.95), p99: q(0.99), tight: +(d.filter((x) => Math.abs(x - m) <= 0.35).length / d.length).toFixed(3), missed: d.filter((x) => x > 1.5 * m).length }
  }, [t0, t1])
  ;(res[k] ||= []).push(s)
}
for (const [k, v] of Object.entries(res)) console.log(k.padEnd(24), v.map((s) => `p95 ${s.p95} p99 ${s.p99} tight ${s.tight} missed ${s.missed} n ${s.n}`).join(' || '))
await browser.close()
