// Scenario B (path 7, failed half; path 9 hydrate): lose missions until the
// living roster is 0 on an incomplete campaign → CAMPAIGN FAILED banner,
// contract select is a no-op, Focus / clock / Research still work, and a
// reload restores the stored flags.
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'

const R = { steps: [] }
const step = (name, data) => { R.steps.push({ name, ...data }); console.log('##', name, JSON.stringify(data)) }
const { browser, page, errs } = await L.open()
const shot = (n) => page.screenshot({ path: L.OUT + n + '-1280x720.png' })

await L.newOperation(page)
// Path 8, intel-2 half: Ashen Circuit (HIGH, needs Intel 2) is hidden at Intel 1
// and listed once the director's Intel is 2. Intel is seeded here; the real
// Intel climb is proven in scenario A.
{
  const rows = () => page.evaluate(() => [...document.querySelectorAll('button[aria-label^="OPEN CONTRACT"]')].map((b) => b.getAttribute('aria-label')))
  // Let the clock post the first generated offers (Ashen Circuit posts ~14:59).
  await page.locator('[aria-label="CLOCK SPEED 8X"]').click(); await page.waitForTimeout(15000)
  await page.locator('[aria-label="PAUSE STRATEGIC CLOCK"]').click()
  const store = await page.evaluate(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().contracts.map((c) => c.id + ':' + c.sector + ':' + c.threat))
  await page.locator('[aria-label^="SOUTH AMERICA //"]').click(); await page.waitForTimeout(300)
  const at1 = await rows()
  await page.evaluate(async () => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: 2 }))
  await page.waitForTimeout(400)
  const at2 = await rows()
  await page.screenshot({ path: L.OUT + 'p8-intel2-seeded-sa-1280x720.png' })
  await page.evaluate(async () => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: 1 }))
  step('p8-intel2-seeded', { store, southAmericaRowsIntel1: at1, southAmericaRowsIntel2: at2 })
}
for (let i = 1; i <= 4; i++) {
  const s = await L.state(page)
  if (s.living === 0) break
  if (!s.roster.some((r) => r.endsWith(':READY'))) {
    // Only injured operatives left: run the strategic clock until one recovers.
    await page.locator('[aria-label="WORLD NETWORK"]').click().catch(() => {})
    await L.dismiss(page)
    await page.locator('[aria-label="RESUME STRATEGIC CLOCK"]').click().catch(() => {})
    await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
    for (let k = 0; k < 120; k++) {
      await page.waitForTimeout(3000)
      if ((await L.state(page)).roster.some((r) => r.endsWith(':READY'))) break
    }
    await page.locator('[aria-label="PAUSE STRATEGIC CLOCK"]').click().catch(() => {})
    step('waited-for-recovery', { roster: (await L.state(page)).roster, t: (await L.state(page)).t })
  }
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL')
  const play = await L.play(page, { wipe: true, ff: 2, budgetMs: 300000 })
  await L.waitDebrief(page)
  const outcome = await L.outcome(page)
  await shot('p7-fail-debrief-' + i)
  await L.leaveDebrief(page)
  await page.waitForTimeout(1000)
  const after = await L.state(page)
  step('wipe-' + i, { play, outcome, after: { living: after.living, roster: after.roster, campaignFailed: after.campaignFailed, campaignWon: after.campaignWon, phase: after.phase } })
}

const banner = () => page.evaluate(() => ({ win: [...document.querySelectorAll('.wm-campaign-win')].map((e) => e.innerText), fail: [...document.querySelectorAll('.wm-campaign-fail')].map((e) => e.innerText) }))
await shot('p7-failed')
const s0 = await L.state(page)
await page.locator('[aria-label^="EUROPE //"]').click()
const failedRows = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => (b.disabled ? '[X] ' : '') + (b.getAttribute('aria-label') || '')).filter((l) => /GLASS VEIL|HOLLOW CROWN|RUST HAVEN/.test(l)))
step('failed-rows', { failedRows })
await page.locator('[aria-label*="GLASS VEIL //"]').first().click({ timeout: 3000, force: true }).catch((e) => step('select-click-error', { e: String(e).slice(0, 200) }))
await page.waitForTimeout(600)
const s1 = await L.state(page)
// Focus, clock and Research still respond.
await page.locator('[aria-label="FOCUS NEXT SECTOR"]').click()
const focused = await page.evaluate(() => document.querySelector('button.wm-sector[aria-pressed="true"]')?.getAttribute('aria-label'))
await page.locator('[aria-label="RESUME STRATEGIC CLOCK"]').click().catch(() => {})
await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
const ta = (await L.state(page)).t; await page.waitForTimeout(2000); const tb = (await L.state(page)).t
await page.locator('[aria-label="PAUSE STRATEGIC CLOCK"]').click().catch(() => {})
await page.locator('[aria-label="RESEARCH"]').click(); await page.waitForTimeout(500)
const researchPhase = (await L.state(page)).phase
await page.locator('[aria-label="WORLD NETWORK"]').click(); await page.waitForTimeout(500)
step('p7-campaign-failed', {
  banner: await banner(),
  flags: { failed: s0.campaignFailed, won: s0.campaignWon, living: s0.living },
  selectNoop: { before: { phase: s0.phase, missionId: s0.missionId }, after: { phase: s1.phase, missionId: s1.missionId } },
  focusAfter: focused, clockAdvanced: tb > ta, researchPhase,
})

// Path 9: reload → Continue restores the stored flags.
await page.reload(); await page.waitForTimeout(800)
await page.locator('[aria-label^="CONTINUE SAVED"]').click(); await page.waitForTimeout(1200)
await L.dismiss(page)
const h = await L.state(page)
step('p9-hydrate-failed', { flags: { failed: h.campaignFailed, won: h.campaignWon, living: h.living }, banner: await banner() })

step('errors', { errs })
writeFileSync(L.OUT + 'scenario-b.json', JSON.stringify(R, null, 1))
await browser.close()
