import { createRequire } from 'module'
const require = createRequire('/Users/machado/.hermes/hermes-agent/node_modules/')
const { chromium } = require('playwright-core')
const OUT = '/Users/machado/Projects/nexus-reborn/production/qa/evidence/wn-014/'
const KEY = 'nexus-save-v1'
const mk = (id, threat, expedited) => ({ id, createdT: 0, expiresAtT: 9e8, sector: 'na', cityId: 'nb', district: 5,
  type: 'SEIZURE', client: 'helix', threat, reward: 50000, seed: 1234 + id.length, priority: false, expedited })
const seeded = [mk('gc-high', 'HIGH', false), mk('gc-severe', 'SEVERE', false), mk('gc-sev-exp', 'SEVERE', true)]
const browser = await chromium.launch({ executablePath: process.env.CHROME })
const log = []
for (const intel of [1, 2, 3]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.goto('http://localhost:4200/')
  await page.getByText('NEW OPERATION').first().click()
  await page.waitForTimeout(1500)
  await page.evaluate(([KEY, intel, seeded]) => {
    const s = JSON.parse(localStorage.getItem(KEY))
    s.campaign.intelLevel = intel
    s.world.contracts = seeded
    localStorage.setItem(KEY, JSON.stringify(s))
  }, [KEY, intel, seeded])
  await page.reload()
  await page.waitForTimeout(500)
  await page.locator('[aria-label^="CONTINUE SAVED"]').click({ timeout: 15000 })
  await page.waitForTimeout(1500)
  // pause so autosave from stale state cannot clobber; read store via save after seeded
  await page.locator('[aria-label="Dismiss the orientation"]').click({ timeout: 3000 }).catch(() => {}); await page.locator('.wm-sector', { hasText: 'NORTH AMERICA' }).first().click(); await page.waitForTimeout(500)
  const rows = await page.$$eval('.wm-ops-body .wm-op b', (els) => els.map((e) => e.textContent))
  const chances = await page.$$eval('.wm-ops-body .wm-op .chip', (els) => els.map((e) => e.textContent).filter((t) => t.startsWith('CHANCE')))
  const markers = await page.$$eval('.wm-marker', (els) => els.map((e) => e.getAttribute('aria-label')))
  const saved = await page.evaluate((KEY) => JSON.parse(localStorage.getItem(KEY)).world.contracts.map((c) => c.id), KEY)
  log.push({ intel, rows, chances, markers: markers.filter((m) => /GENERATED|wn014|\/\/ SEIZURE/.test(m) || true).length, savedContracts: saved, errs })
  console.log(JSON.stringify(log.at(-1)))
  await page.screenshot({ path: OUT + `wn-014-intel${intel}-na-1280x720.png` })
  await ctx.close()
}
await browser.close()
