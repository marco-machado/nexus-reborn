// Reference: rAF delta stats on an empty page in the same browser/window.
import * as L from '/Users/machado/Projects/nexus-reborn/production/qa/evidence/frame-time-pass-2026-10-22/baseline/lib.mjs'
const { browser, page } = await L.open()
browser.on("disconnected", () => console.log("browser disconnected", Date.now()))
page.on("close", () => console.log("page close event", Date.now()))
await page.goto('data:text/html,<body style=background:black></body>')

for (let rep = 0; rep < 3; rep++) {
  await page.waitForTimeout(1500)
  const t0 = await L.now(page); await page.waitForTimeout(6000); const t1 = await L.now(page)
  console.log(JSON.stringify(await page.evaluate(([a, b]) => {
    const d = window.__frames.filter(([t]) => t > a && t <= b).map(([, x]) => x).sort((x, y) => x - y)
    const q = (p) => +d[Math.min(d.length - 1, Math.floor(p * d.length))].toFixed(2)
    const m = q(0.5)
    return { n: d.length, p50: m, p95: q(0.95), p99: q(0.99), tight: +(d.filter((x) => Math.abs(x - m) <= 0.35).length / d.length).toFixed(3), missed: d.filter((x) => x > 1.5 * m).length }
  }, [t0, t1])))
}
await browser.close()
