// Sprint 3 smoke, follow-up: (a) path 3 with the ETA probe, to split the payout from the
// Tax deposited while the ETA's days elapse; (b) path 5 research refusal when short and
// debit; (c) path 5 hire debit and refusal after a loss frees roster room.
// Harness assists: mission played by the sim's order API; refusal checks seed appStore.credits.
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'

const R = { steps: [] }
const step = (name, data) => { R.steps.push({ name, ...data }); console.log('##', name, JSON.stringify(data)) }
const { browser, page, errs } = await L.open()
const shot = (n) => page.screenshot({ path: L.OUT + n + '-1280x720.png' })
const credits = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().credits)
const setCredits = (n) => page.evaluate(async (n) => (await import('/src/state/appStore.ts')).useAppStore.setState({ credits: n }), n)
const outcome = () => page.evaluate(async () => {
  const A = await import('/src/state/appStore.ts')
  const o = A.useAppStore.getState().outcome
  return o && { won: o.won, reward: o.reward, bonus: o.bonus, civiliansHit: o.civiliansHit, quietReplay: o.quietReplay, net: A.netPayout(o) }
})
const auth = () => page.$$eval('button[aria-label^="AUTHORIZE "]', (b) => b.map((x) => ({ l: x.getAttribute('aria-label'), off: x.disabled })))

// (a) Win with the ETA probe.
let a
for (let attempt = 1; attempt <= 4; attempt++) {
  await L.newOperation(page)
  const atLaunch = await credits()
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL')
  await L.armEtaProbe(page)
  const play = await L.play(page, { god: true, clean: true, ff: 2, budgetMs: 480000 })
  await L.waitDebrief(page)
  const o = await outcome()
  const eta = await page.evaluate(() => window.__eta)
  const atDebrief = await credits()
  a = { attempt, atLaunch, atEtaStart: eta?.credits, atDebrief, outcome: o, etaDays: eta?.days, play: { result: play.result } }
  a.etaStartMinusLaunch = a.atEtaStart - atLaunch
  a.equalsNet = o ? a.atEtaStart - atLaunch === o.net : null
  a.taxDuringEta = atDebrief - a.atEtaStart
  step('p3-win-eta-split-' + attempt, a)
  if (o?.won && o.civiliansHit === 0) break
}
await shot('p3-eta-split-debrief')
await page.waitForTimeout(3000)
step('p3-apply-once', { atDebrief: a.atDebrief, after3s: await credits() })

// (b) Research: refuse when short, then debit.
await L.newOperation(page)
await page.locator('[aria-label="RESEARCH"]').click(); await page.waitForTimeout(700)
await L.dismiss(page)
await setCredits(100); await page.waitForTimeout(300)
const short = await auth()
const rsStateBefore = await page.evaluate(async () => JSON.stringify((await import('/src/state/researchStore.ts')).useResearchStore.getState().active ?? null))
if (short[0]) await page.locator(`button[aria-label="${short[0].l}"]`).click({ force: true, timeout: 2000 }).catch(() => {})
await page.waitForTimeout(500)
const rsStateAfter = await page.evaluate(async () => JSON.stringify((await import('/src/state/researchStore.ts')).useResearchStore.getState().active ?? null))
await shot('p5-research-short')
step('p5-research-refuse-short', { buttons: short, credits: await credits(), activeBefore: rsStateBefore, activeAfter: rsStateAfter })
await setCredits(128450); await page.waitForTimeout(300)
const ok = (await auth()).find((x) => !x.off)
const rc0 = await credits()
if (ok) await page.locator(`button[aria-label="${ok.l}"]`).click()
await page.waitForTimeout(600)
step('p5-research-debit', { button: ok?.l, before: rc0, after: await credits() })

// (c) Hire: lose a mission (4 killed) so the roster has room.
await L.newOperation(page)
await L.deploy(page, 'OPEN CONTRACT GLASS VEIL')
await L.play(page, { wipe: true, ff: 2, budgetMs: 300000 })
await L.waitDebrief(page)
await L.leaveDebrief(page)
step('p5-after-loss', { credits: await credits(), living: (await L.state(page)).living })
await page.locator('[aria-label^="EUROPE //"]').click().catch(() => {}); await page.waitForTimeout(300)
await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().click(); await page.waitForTimeout(600)
await page.locator('[aria-label^="ACCEPT CONTRACT"]').click(); await page.waitForTimeout(800)
await page.locator('[aria-label^="OPEN THE RECRUITMENT MARKET"]').first().click(); await page.waitForTimeout(500)
const hires = () => page.$$eval('button[aria-label^="HIRE "]', (b) => b.map((x) => ({ l: x.getAttribute('aria-label'), off: x.disabled, title: x.title })))
const h1 = await hires()
const ho = h1.find((x) => !x.off)
const hc0 = await credits(), live0 = (await L.state(page)).living
if (ho) await page.locator(`button[aria-label="${ho.l}"]`).click()
await page.waitForTimeout(600)
await shot('p5-hire-debit')
step('p5-hire-debit', { buttons: h1, hired: ho?.l, before: hc0, after: await credits(), livingBefore: live0, livingAfter: (await L.state(page)).living })
await setCredits(1000); await page.waitForTimeout(300)
const h2 = await hires()
const live1 = (await L.state(page)).living
if (h2[0]) await page.locator(`button[aria-label="${h2[0].l}"]`).click({ force: true, timeout: 2000 }).catch(() => {})
await page.waitForTimeout(400)
await shot('p5-hire-short')
step('p5-hire-refuse-short', { buttons: h2, credits: await credits(), livingBefore: live1, livingAfter: (await L.state(page)).living })

step('errors', { errs: errs.filter((e) => !/favicon/.test(e)), faviconOnly: errs.every((e) => /favicon/.test(e)) })
writeFileSync(L.OUT + 'scenario-s3b.json', JSON.stringify(R, null, 1))
await browser.close()
