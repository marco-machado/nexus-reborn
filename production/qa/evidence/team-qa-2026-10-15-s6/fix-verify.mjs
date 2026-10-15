// Verifies the /team-qa review fixes in headed Chrome for Testing:
// (1) the write-failure notice covers no text on the four Screens at 1280x720,
//     1366x768 and 1920x1080, at text scale 100 and 125 (shot per size at 125);
// (2) Balance Clear prints the P-01 armed hint and clears it on disarm.
// Harness assists: setItem throws for the save key only; text scale through the
// store action setTextScale; telemetry on through setTelemetry and one thin
// abort row through recordAbort (records seeded, not played).
import * as L from '../smoke-2026-10-15-s6/lib.mjs'
import { writeFileSync } from 'fs'
const HERE = '/Users/machado/Projects/nexus-reborn/production/qa/evidence/team-qa-2026-10-15-s6/'
const EV = '/Users/machado/Projects/nexus-reborn/production/qa/evidence/'
const { browser, page } = await L.open()
const out = { notice: [], balance: null }
const settle = (ms = 800) => page.waitForTimeout(ms)
try {
  await L.newOperation(page)
  for (let i = 0; i < 10 && !(await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().isVisible().catch(() => false)); i++) { await page.locator('[aria-label="FOCUS NEXT SECTOR"]').click().catch(() => {}); await settle(1500) }
  await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().evaluate((el) => el.click()); await settle(700)
  await page.evaluate(() => { const o = Storage.prototype.setItem; window.__origSet = o; Storage.prototype.setItem = function (k, v) { if (k === 'nexus-save-v1') { const e = new Error('q'); e.name = 'QuotaExceededError'; throw e } return o.call(this, k, v) } })
  await page.evaluate(async () => { const A = (await import('/src/state/appStore.ts')).useAppStore; A.setState({ credits: A.getState().credits + 1 }) })
  await settle(1200)
  for (const [w, h] of [[1280, 720], [1366, 768], [1920, 1080]]) {
    await page.setViewportSize({ width: w, height: h })
    for (const scale of [100, 125]) {
      await page.evaluate(async (s) => (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setTextScale(s), scale)
      for (const nav of ['WORLD NETWORK', 'RESEARCH', 'BRIEF', 'ASSEMBLY']) {
        await page.locator(`button:has-text("${nav}")`).last().click().catch(() => {})
        await settle(700); await L.dismiss(page)
        const r = await page.evaluate(() => {
          const n = document.querySelector('.write-fail-notice')
          if (!n) return { notice: false }
          const a = n.getBoundingClientRect()
          const hits = []
          const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
          for (let t; (t = walk.nextNode());) {
            if (!t.textContent.trim() || n.contains(t)) continue
            const rg = document.createRange(); rg.selectNodeContents(t)
            for (const b of rg.getClientRects()) if (b.width && b.height && b.y < a.bottom && b.bottom > a.y && b.x < a.right && b.right > a.x) hits.push(t.textContent.trim().slice(0, 30))
          }
          return { y: Math.round(a.y), h: Math.round(a.height), covers: hits }
        })
        out.notice.push({ size: `${w}x${h}`, scale, screen: nav, ...r })
        if (scale === 125 && nav === 'WORLD NETWORK') await page.screenshot({ path: EV + `pv-018/fix-notice-world-network-${w}x${h}-scale125.png` })
      }
    }
  }
  await page.evaluate(() => { Storage.prototype.setItem = window.__origSet })
  await page.evaluate(async (s) => (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setTextScale(s), 100)
  await page.setViewportSize({ width: 1280, height: 720 })

  // Balance armed hint (PV-016 / P-01)
  await page.evaluate(async () => {
    ;(await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setTelemetry(true)
    ;(await import('/src/state/telemetry.ts')).recordAbort('m01', 12, 7, ['assault'])
  })
  await page.goto(L.URL); await settle(1200); await L.dismiss(page)
  await page.locator('[aria-label^="OPEN SETTINGS"]').click(); await settle(600)
  await page.locator('[aria-label="Open the balance dashboard"]').click(); await settle(600)
  const hint = () => page.evaluate(() => { const e = document.querySelector('.bal-arm-hint'); return e && { text: e.textContent, role: e.getAttribute('role'), live: e.getAttribute('aria-live') } })
  const idle = await hint()
  const clr = page.locator('button:has-text("CLEAR"), button:has-text("CONFIRM // ERASE RECORDS?")').first()
  await clr.click(); await settle(200)
  const armed = await hint(); const armedName = await clr.getAttribute('aria-label')
  await page.screenshot({ path: EV + 'pv-016/fix-clear-armed-hint-1280x720.png' })
  await settle(3600)
  const lapsed = await hint()
  out.balance = { idle, armed, armedName, lapsed }
} finally { writeFileSync(HERE + 'fix-verify.json', JSON.stringify(out, null, 1)); await browser.close() }
const bad = out.notice.filter((x) => x.notice === false || x.covers.length)
console.log('notice checks', out.notice.length, 'with coverage or missing:', JSON.stringify(bad))
console.log('balance', JSON.stringify(out.balance))
