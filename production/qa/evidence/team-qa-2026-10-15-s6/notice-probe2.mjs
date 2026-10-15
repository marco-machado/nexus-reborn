// Probe: which text on each strategy Screen a centered write-failure notice would cover
// at candidate vertical positions, at 1280x720. Harness assist: setItem throws for the save key.
import * as L from '../smoke-2026-10-15-s6/lib.mjs'
import { writeFileSync } from 'fs'
const HERE = '/Users/machado/Projects/nexus-reborn/production/qa/evidence/team-qa-2026-10-15-s6/'
const { browser, page } = await L.open()
const out = {}
try {
  await L.newOperation(page)
  await page.evaluate(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'nexus-save-v1') { const e = new Error('q'); e.name = 'QuotaExceededError'; throw e } return o.call(this, k, v) } })
  await page.evaluate(async () => { const A = (await import('/src/state/appStore.ts')).useAppStore; A.setState({ credits: A.getState().credits + 1 }) })
  await page.waitForTimeout(1200)
  for (let i = 0; i < 10 && !(await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().isVisible().catch(() => false)); i++) { await page.locator('[aria-label="FOCUS NEXT SECTOR"]').click().catch(() => {}); await page.waitForTimeout(1500) }
  await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().evaluate((el) => el.click()); await page.waitForTimeout(700)
  await page.setViewportSize({ width: +process.env.W, height: +process.env.H }); await page.evaluate(async (s) => (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setTextScale(s), +process.env.S); await page.waitForTimeout(500)
  for (const nav of ['WORLD NETWORK', 'RESEARCH', 'BRIEF', 'ASSEMBLY']) {
    await page.locator(`button:has-text("${nav}")`).last().click().catch(() => {})
    await page.waitForTimeout(900); await L.dismiss(page)
    out[nav] = await page.evaluate(() => {
      const n = document.querySelector('.write-fail-notice')
      if (!n) return { notice: false }
      const nb = n.getBoundingClientRect()
      const w = nb.width, h = nb.height, x = (innerWidth - w) / 2
      const texts = []
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let t; (t = walk.nextNode());) {
        if (!t.textContent.trim() || n.contains(t)) continue
        const r = document.createRange(); r.selectNodeContents(t)
        for (const b of r.getClientRects()) if (b.width && b.height) texts.push({ s: t.textContent.trim().slice(0, 30), x: b.x, y: b.y, w: b.width, h: b.height })
      }
      const hit = (y) => texts.filter((b) => b.y < y + h && b.y + b.h > y && b.x < x + w && b.x + b.w > x).map((b) => b.s)
      const res = { size: [Math.round(w), Math.round(h)], current: [Math.round(nb.y), hit(nb.y)] }
      for (let y = 0; y <= innerHeight - 30 - h; y += 4) { const c = hit(y); if (!c.length) (res.free ||= []).push(y) }
      return res
    })
    await page.screenshot({ path: HERE + 'probe2-' + nav.replace(/\W+/g, '-').toLowerCase() + '.png' })
  }
} finally { writeFileSync(HERE + 'notice-probe2.json', JSON.stringify(out, null, 1)); await browser.close() }
console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { size: v.size, current: v.current, freeRanges: (v.free || []).reduce((a, y) => { const l = a[a.length - 1]; if (l && y - l[1] === 4) l[1] = y; else a.push([y, y]); return a }, []) }]))))
