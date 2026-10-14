// Sprint 4 smoke path 7: win all three authored contracts through the real UI flow.
// Harness assists: god-mode bot play, ff:2 sim ticks.
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'
const R = { steps: [] }
const step = (name, data) => { R.steps.push({ name, ...data }); console.log('##', name, JSON.stringify(data)) }
const { browser, page, errs } = await L.open()
const shot = (n) => page.screenshot({ path: L.OUT + n + '-1280x720.png' })
const credits = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().credits)
await L.newOperation(page)
// Harness assist: Intel level 2 (the authored contracts m02/m03 need it; research is covered by earlier sprints).
await page.evaluate(async () => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: 2 }))
await page.waitForTimeout(500)
step('start', { labels: (await L.btns(page)).filter((b) => /CONTRACT/.test(b)) })
for (const name of ['GLASS VEIL', 'HOLLOW CROWN', 'RUST HAVEN']) {
  const label = 'OPEN CONTRACT ' + name
  await page.locator('[aria-label="WORLD NETWORK"]').click().catch(() => {}); await page.waitForTimeout(300)
  for (let i = 0; i < 10 && !(await page.locator(`[aria-label^="${label}"]`).first().isVisible().catch(() => false)); i++) { await page.locator('[aria-label="FOCUS NEXT SECTOR"]').click().catch(() => {}); await page.waitForTimeout(1500) }
  const labels = (await L.btns(page)).filter((b) => b.startsWith(label))
  if (!labels.length) { step('missing-' + name, { all: (await L.btns(page)).filter((b) => /CONTRACT/.test(b)) }); continue }
  let res
  for (let attempt = 1; attempt <= 3; attempt++) {
    const atLaunch = await credits()
    await L.deploy(page, label)
    const play = await L.play(page, { god: true, clean: true, ff: 2, budgetMs: 420000 })
    await L.waitDebrief(page)
    const s = await L.state(page)
    const banner = await page.evaluate(() => document.body.innerText.match(/CAMPAIGN[^\n]*/g))
    await shot('p7-' + name.replace(' ', '-') + '-debrief')
    res = { name, attempt, play: play.result, atLaunch, credits: s.credits, contractsWon: s.contractsWon, campaignWon: s.campaignWon, banner }
    await L.leaveDebrief(page)
    if (play.result === 'won') break
  }
  step('won-' + name, res)
}
const fin = await L.state(page)
await page.waitForTimeout(800)
await shot('p7-final-world')
const after = (await L.btns(page)).filter((b) => /CONTRACT/.test(b))
step('p7-final', { contractsWon: fin.contractsWon, campaignWon: fin.campaignWon, credits: fin.credits, selectable: after, body: (await page.innerText('body')).match(/CAMPAIGN[^\n]*/g) })
// all three still selectable: click each and see the brief
const sel = []
for (const name of ['GLASS VEIL', 'HOLLOW CROWN', 'RUST HAVEN']) {
  for (let i = 0; i < 10 && !(await page.locator(`[aria-label^="OPEN CONTRACT ${name}"]`).first().isVisible().catch(() => false)); i++) { await page.locator('[aria-label="FOCUS NEXT SECTOR"]').click().catch(() => {}); await page.waitForTimeout(400) }
  const b = page.locator(`[aria-label^="OPEN CONTRACT ${name}"]`).first()
  if (await b.count()) { await b.click(); await page.waitForTimeout(600); sel.push({ name, acceptEnabled: await page.locator('[aria-label^="ACCEPT CONTRACT"]:not([disabled])').count() }) } else sel.push({ name, present: false })
}
step('p7-selectable', { sel })
step('console-errors', { errs: errs.filter((e) => !/favicon/.test(e)) })
writeFileSync(L.OUT + 'scenarioB.json', JSON.stringify(R, null, 1))
await browser.close()
