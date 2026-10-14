// Sprint 4 smoke, paths 1-6 and 8. Harness assists: advanceDays() fast-forwards World time;
// missions are played by the sim's order API (god = squad kept alive; wipe = lose).
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'
const R = { steps: [] }
const step = (name, data) => { R.steps.push({ name, ...data }); console.log('##', name, JSON.stringify(data)) }
const { browser, page, errs } = await L.open()
const shot = (n) => page.screenshot({ path: L.OUT + n + '-1280x720.png' })
const credits = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().credits)
const invoice = () => page.evaluate(() => document.querySelector('[aria-label="Mission invoice"]')?.innerText ?? null)
const market = () => page.evaluate(async () => {
  const w = (await import('/src/state/worldStore.ts')).useWorldStore.getState()
  return w.contracts.map((k) => ({ id: k.id, client: k.client ?? k.contract?.client, threat: k.threat ?? k.contract?.threat, reward: k.reward ?? k.contract?.reward, keys: Object.keys(k).slice(0, 14) }))
})
const adv = (d) => page.evaluate(async (d) => (await import('/src/state/worldStore.ts')).useWorldStore.getState().advanceDays(d), d)
const genLabels = async () => (await L.btns(page)).filter((b) => /^OPEN CONTRACT/.test(b) && !/GLASS VEIL/.test(b))

// 1-2 launch, New Operation, 128,450 CR
await L.newOperation(page)
step('p1-p2-launch', { credits: await credits(), header: /128,450/.test(await page.innerText('body')), phase: (await L.state(page)).phase })

// grow the market: advance world days
for (let i = 0; i < 12; i++) { await adv(1); if ((await market()).length >= 1) break }
await page.waitForTimeout(500)
const m1 = await market()
step('p6-market-rolled', { n: m1.length, market: m1, labels: await genLabels() })
await shot('p6-market')

// 3 accept authored: Credits flat, no deduction
const c0 = await credits()
await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().click(); await page.waitForTimeout(700)
const cSel = await credits()
const acc = page.locator('[aria-label^="ACCEPT CONTRACT"]')
await acc.click(); await page.waitForTimeout(800)
const cAcc = await credits()
step('p3-accept-authored', { c0, afterSelect: cSel, afterAccept: cAcc, flat: c0 === cSel && cSel === cAcc, phase: (await L.state(page)).phase })
await shot('p3-authored-assembly')

// 4 abort from Assembly->Deploy: fill team, deploy, pause, abort
for (;;) {
  const assign = page.locator('button[aria-label^="ASSIGN "]:not([disabled])')
  if (/4 \/ 4 ASSIGNED/.test(await page.innerText('body')) || (await assign.count()) === 0) break
  await assign.first().click(); await page.waitForTimeout(150)
}
await page.locator('[aria-label^="DEPLOY STRIKE TEAM"]').click()
await page.waitForFunction(() => window.__phase === 'mission', null, { timeout: 30000 }).catch(() => {})
await page.waitForTimeout(1500)
const cMission = await credits()
await page.locator('[aria-label="Pause and open the menu"]').click(); await page.waitForTimeout(500)
await page.locator('[aria-label="Abort mission"]').click(); await page.waitForTimeout(300)
await page.locator('[aria-label="Confirm abort mission"]').click(); await page.waitForTimeout(1500)
const s4 = await L.state(page)
step('p4-abort', { creditsAtLaunch: c0, creditsInMission: cMission, creditsAfterAbort: s4.credits, phase: s4.phase, outcomeSet: await L.outcome(page), contractsWon: s4.contractsWon, btnsGlass: (await L.btns(page)).filter((b) => /GLASS VEIL/.test(b)).slice(0, 3) })
await shot('p4-after-abort')
await L.dismiss(page)

// 3b generated accept free
const gl = await genLabels()
if (gl[0]) {
  await page.locator('[aria-label="WORLD NETWORK"]').click().catch(() => {}); await page.waitForTimeout(300); await L.dismiss(page)
  const g0 = await credits()
  await page.locator(`[aria-label="${gl[0]}"]`).first().click(); await page.waitForTimeout(700)
  const gSel = await credits()
  await page.locator('[aria-label^="ACCEPT CONTRACT"]').click(); await page.waitForTimeout(800)
  step('p3-accept-generated', { label: gl[0], g0, afterSelect: gSel, afterAccept: await credits(), phase: (await L.state(page)).phase })
  await shot('p3-generated-assembly')
  await page.locator('[aria-label="WORLD NETWORK"]').click().catch(() => {}); await page.waitForTimeout(500); await L.dismiss(page)
} else step('p3-accept-generated', { skipped: 'no generated contract button', labels: await L.btns(page) })

// 5 invoice: win, quiet replay, loss
async function mission(label, tag, opts) {
  const atLaunch = await credits()
  await L.deploy(page, label)
  const play = await L.play(page, { ff: 2, budgetMs: 480000, ...opts })
  await L.waitDebrief(page)
  const atDebrief = await credits()
  const outcome = await page.evaluate(async () => { const A = await import('/src/state/appStore.ts'); const o = A.useAppStore.getState().outcome; return o && { won: o.won, reward: o.reward, bonus: o.bonus, civ: o.civiliansHit, quiet: o.quietReplay, fine: A.collateralFine(o), net: A.netPayout(o) } })
  const inv = await invoice()
  await shot(tag + '-debrief')
  await L.leaveDebrief(page)
  return { atLaunch, atDebrief, delta: atDebrief - atLaunch, play: play.result, outcome, inv }
}
const win = await mission('OPEN CONTRACT GLASS VEIL', 'p5-win', { god: true, clean: true })
step('p5-win', win)
const quiet = await mission('OPEN CONTRACT GLASS VEIL', 'p5-quiet', { god: true, clean: true })
step('p5-quiet', quiet)
await L.newOperation(page)
const loss = await mission('OPEN CONTRACT GLASS VEIL', 'p5-loss', { wipe: true })
step('p5-loss', loss)

// 6 expiry: advance a long time, market refills toward 3, never Sable
await L.newOperation(page)
const trace = []
for (let i = 0; i < 40; i++) { await adv(1); const m = await market(); trace.push(m.length); }
const mEnd = await market()
const clients = [...new Set(mEnd.map((x) => x.client))]
step('p6-expiry-refill', { trace, endN: mEnd.length, clients, market: mEnd })
await shot('p6-market-late')

// 8 save and reload
await page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.setState({ credits: 97531 }))
await page.waitForTimeout(800)
const b4 = await credits()
await page.reload(); await page.waitForTimeout(900)
await page.locator('[aria-label^="CONTINUE SAVED"]').click(); await page.waitForTimeout(1200); await L.dismiss(page)
step('p8-reload', { before: b4, after: await credits(), phase: (await L.state(page)).phase })

step('console-errors', { errs })
writeFileSync(L.OUT + 'scenarioA.json', JSON.stringify(R, null, 1))
await browser.close()
