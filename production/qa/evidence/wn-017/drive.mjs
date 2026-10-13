import { createRequire } from 'module'
const require = createRequire('/Users/machado/.hermes/hermes-agent/node_modules/')
const { chromium } = require('playwright-core')
const OUT = '/Users/machado/Projects/nexus-reborn/production/qa/evidence/wn-017/'
const KEY = 'nexus-save-v1'
const browser = await chromium.launch({ executablePath: process.env.CHROME })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
page.on('pageerror', (e) => errs.push(String(e)))
await page.goto('http://localhost:4200/')
await page.getByText('NEW OPERATION').first().click()
await page.waitForTimeout(1500)
await page.screenshot({ path: OUT + 'wn-017-01-opening-overlay-1280x720.png' })
await page.locator('[aria-label="Dismiss the orientation"]').click({ timeout: 3000 }).catch(() => {})
await page.waitForTimeout(300)
const clock = () => page.locator('.wm-clock').first().textContent()
const header = async () => (await page.locator('header, .wm-resource').allTextContents()).join(' | ')
const out = { header: await header() }
// Focus cycle
const focused = []
for (let i = 0; i < 7; i++) {
  focused.push(await page.locator('.wm-sector.on, .wm-sector[aria-pressed="true"], .wm-sector.sel').first().textContent().catch(() => '?'))
  await page.locator('[aria-label="FOCUS NEXT SECTOR"]').click()
  await page.waitForTimeout(150)
}
out.focusCycle = focused
await page.screenshot({ path: OUT + 'wn-017-02-opening-focus-1280x720.png' })
// Pause / speed
const c0 = await clock(); await page.waitForTimeout(1500); const c1 = await clock()
await page.locator('[aria-label="PAUSE STRATEGIC CLOCK"]').click()
const p0 = await clock(); await page.waitForTimeout(1500); const p1 = await clock()
await page.screenshot({ path: OUT + 'wn-017-03-opening-paused-1280x720.png' })
await page.locator('[aria-label="RESUME STRATEGIC CLOCK"]').click()
await page.locator('[aria-label="CLOCK SPEED 1X"]').click(); const s0 = await clock(); await page.waitForTimeout(2000); const s1 = await clock()
await page.locator('[aria-label="CLOCK SPEED 8X"]').click(); const f0 = await clock(); await page.waitForTimeout(2000); const f1 = await clock()
out.clock = { live: [c0, c1], paused: [p0, p1], x1: [s0, s1], x8: [f0, f1] }
out.sectorText = await page.locator('.wm-sector-panel, .wm-inset, .wm-focus').first().textContent().catch(() => null)
out.enabledButtons = await page.$$eval('button:not([disabled])', (b) => b.map((x) => x.getAttribute('aria-label') || x.textContent.trim()).slice(0, 40))
// Post-win header: seeded Influence 8 (state half proven by unit tests)
await page.evaluate(([KEY]) => { const s = JSON.parse(localStorage.getItem(KEY)); s.world.influence = 8; localStorage.setItem(KEY, JSON.stringify(s)) }, [KEY])
await page.reload(); await page.waitForTimeout(500)
await page.locator('[aria-label^="CONTINUE SAVED"]').click({ timeout: 15000 })
await page.waitForTimeout(1500)
await page.locator('[aria-label="Dismiss the orientation"]').click({ timeout: 3000 }).catch(() => {})
await page.waitForTimeout(300)
out.headerAfter = await header()
await page.screenshot({ path: OUT + 'wn-017-04-header-influence-8-1280x720.png' })
out.errs = errs
console.log(JSON.stringify(out, null, 1))
await browser.close()
