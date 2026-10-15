// Debrief filing line after the always-mounted role="status" change (PV-017 review fix).
// Harness assist: the mission is played by the sim-order bot in god mode with ff 2.
import * as L from '../smoke-2026-10-15-s6/lib.mjs'
const EV = '/Users/machado/Projects/nexus-reborn/production/qa/evidence/'
const { browser, page, errs } = await L.open()
const region = () => page.evaluate(() => { const e = document.querySelector('.db-filing'); return e && { text: e.textContent, role: e.getAttribute('role'), h: Math.round(e.getBoundingClientRect().height) } })
try {
  await L.newOperation(page)
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL'); await page.waitForTimeout(1000)
  const p = await L.play(page, { god: true, ff: 2, budgetMs: 300000 })
  await L.waitDebrief(page)
  const atDebrief = await region()
  await page.screenshot({ path: EV + 'pv-017/fix-debrief-status-region-1280x720.png' })
  console.log(JSON.stringify({ play: p.result, atDebrief, pageErrors: errs.filter((e) => /pageerror/.test(e)).length }))
} finally { await browser.close() }
