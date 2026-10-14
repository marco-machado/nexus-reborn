import { createRequire } from 'module'
const require = createRequire('/Users/machado/.hermes/hermes-agent/node_modules/')
const { chromium } = require('playwright-core')
const OUT = '/Users/machado/Projects/nexus-reborn/production/qa/evidence/wn-019/'
const browser = await chromium.launch({ executablePath: process.env.CHROME })
const errs = []
const out = {}
async function capture(name, wins) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.goto('http://localhost:4200/')
  await page.getByText('NEW OPERATION').first().click()
  await page.waitForTimeout(1200)
  await page.locator('[aria-label="Dismiss the orientation"]').click({ timeout: 3000 }).catch(() => {})
  await page.evaluate(async (wins) => {
    const c = await import('/src/state/campaignStore.ts')
    const o = (over) => ({ applyKey: 1, won: true, kills: 0, casualties: 0, timeSec: 10, civiliansHit: 1, reward: 0, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false, ...over })
    for (const id of wins) c.useCampaignStore.getState().reportMission(id, o({}), 0)
    const ids = c.useCampaignStore.getState().operatives.map((x) => x.id)
    c.useCampaignStore.getState().reportMission('m01', o({ won: false, casualties: ids.length, deadIds: ids }), 0)
  }, wins)
  await page.waitForTimeout(500)
  out[name] = {
    win: await page.locator('.wm-campaign-win').allTextContents(),
    fail: await page.locator('.wm-campaign-fail').allTextContents(),
  }
  await page.screenshot({ path: OUT + `wn-019-${name}-1280x720.png` })
  await ctx.close()
}
await capture('complete-then-wipe', ['m01', 'm02', 'm03'])
await capture('incomplete-wipe-failed', [])
out.errors = errs
console.log(JSON.stringify(out, null, 1))
await browser.close()
