// Sprint 3 smoke (Economy and contracts), paths 2-6 of the QA plan's Smoke Test Scope.
// Drives the real app through lib.mjs. Harness assists: the mission is played by the
// sim's order API (god mode keeps the squad alive for the win; wipe mode loses);
// path 5's "refuse when short" seeds appStore.credits directly.
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'

const R = { steps: [] }
const step = (name, data) => { R.steps.push({ name, ...data }); console.log('##', name, JSON.stringify(data)) }
const { browser, page, errs } = await L.open()
const shot = (n) => page.screenshot({ path: L.OUT + n + '-1280x720.png' })
const credits = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().credits)
const invoice = () => page.evaluate(() => document.querySelector('[aria-label="Mission invoice"]')?.innerText ?? null)
const net = () => page.evaluate(async () => {
  const A = await import('/src/state/appStore.ts')
  const o = A.useAppStore.getState().outcome
  return o && { won: o.won, reward: o.reward, bonus: o.bonus, civiliansHit: o.civiliansHit, quietReplay: o.quietReplay, fine: A.collateralFine(o), net: A.netPayout(o) }
})

async function mission(label, tag, opts) {
  const atLaunch = await credits()
  await L.deploy(page, label)
  const duringStart = await credits()
  const play = await L.play(page, { ff: 2, budgetMs: 480000, ...opts })
  const duringEnd = await credits()
  await L.waitDebrief(page)
  const atDebrief = await credits()
  const outcome = await net()
  const inv = await invoice()
  await shot(tag + '-debrief')
  await page.waitForTimeout(3000)
  const debrief3s = await credits()
  const ret = await L.leaveDebrief(page)
  const afterLeave = await credits()
  return { atLaunch, duringStart, duringEnd, play: { result: play.result, simTime: play.simTime }, atDebrief, debrief3s, afterLeave, outcome, inv, ret }
}

// Path 1 + 2: launch, New Operation, Credits 128,450.
await L.newOperation(page)
const body0 = await page.innerText('body')
step('p2-new-operation', { credits: await credits(), header128450: /128,450/.test(body0), phase: (await L.state(page)).phase })
await shot('p2-world')

// Path 3: clean non-quiet win -> invoice prints, Credits rise by netPayout once.
let win
for (let attempt = 1; attempt <= 4; attempt++) {
  win = await mission('OPEN CONTRACT GLASS VEIL', 'p3-win-' + attempt, { god: true, clean: true })
  const d = win.atDebrief - win.atLaunch
  step('p3-win-attempt-' + attempt, { ...win, delta: d, deltaEqualsNet: win.outcome ? d === win.outcome.net : null })
  if (win.outcome?.won && win.outcome.civiliansHit === 0) break
  if (attempt < 4) await L.newOperation(page)
}
await shot('p3-world-after-win')

// Path 4a: quiet replay of the same contract -> Credits unchanged by the mission.
const quiet = await mission('OPEN CONTRACT GLASS VEIL', 'p4-quiet', { god: true, clean: true })
step('p4-quiet-replay', { ...quiet, missionDelta: quiet.atDebrief - quiet.atLaunch, unchangedThroughDebrief: quiet.atDebrief === quiet.atLaunch })

// Path 4b: a loss on a fresh operation -> Credits unchanged by the mission.
await L.newOperation(page)
const loss = await mission('OPEN CONTRACT GLASS VEIL', 'p4-loss', { wipe: true })
step('p4-loss', { ...loss, missionDelta: loss.atDebrief - loss.atLaunch, unchangedThroughDebrief: loss.atDebrief === loss.atLaunch })

// Path 5: research authorize debits and refuses when short; candidate hire likewise.
await L.newOperation(page)
await page.locator('[aria-label="RESEARCH"]').click(); await page.waitForTimeout(700)
await L.dismiss(page)
const authBtns = () => page.$$eval('button[aria-label^="AUTHORIZE "]', (b) => b.map((x) => ({ l: x.getAttribute('aria-label'), off: x.disabled })))
const nodeBtns = () => page.$$eval('button[aria-label*=" // AVAILABLE"], button[aria-label*="AVAILABLE"]', (b) => b.map((x) => x.getAttribute('aria-label')))
const nodes = await nodeBtns()
step('p5-research-nodes', { nodes: nodes.slice(0, 8) })
if (nodes.length) { await page.locator(`button[aria-label="${nodes[0]}"]`).click(); await page.waitForTimeout(400) }
const cBefore = await credits()
const ab = await authBtns()
const target = ab.find((x) => !x.off)
let resAuth = null
if (target) {
  await page.locator(`button[aria-label="${target.l}"]`).click(); await page.waitForTimeout(600)
  resAuth = { label: target.l, before: cBefore, after: await credits() }
}
await shot('p5-research-authorized')
step('p5-research-authorize', { authButtons: ab, resAuth })
// Refusal when short: seed Credits to 0 (harness assist), then try the next node.
await page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.setState({ credits: 0 }))
await page.waitForTimeout(300)
const nodes2 = await nodeBtns()
if (nodes2.length) { await page.locator(`button[aria-label="${nodes2[0]}"]`).click(); await page.waitForTimeout(400) }
const ab2 = await authBtns()
const stateBefore = await page.evaluate(async () => { const R = (await import('/src/state/researchStore.ts')).useResearchStore.getState(); return JSON.stringify({ a: R.active ?? null, d: R.done ?? null }) })
const tgt2 = ab2[0]
let shortTry = null
if (tgt2) {
  await page.locator(`button[aria-label="${tgt2.l}"]`).click({ force: true, timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(500)
  shortTry = { label: tgt2.l, disabled: tgt2.off, credits: await credits(), stateUnchanged: stateBefore === (await page.evaluate(async () => { const R = (await import('/src/state/researchStore.ts')).useResearchStore.getState(); return JSON.stringify({ a: R.active ?? null, d: R.done ?? null }) })) }
}
await shot('p5-research-short')
step('p5-research-short', { ab2, shortTry })

// Hire: open the recruitment market from Assembly, hire with enough, refuse when short.
await page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.setState({ credits: 128450 }))
await page.locator('[aria-label="WORLD NETWORK"]').click(); await page.waitForTimeout(400)
await page.locator('[aria-label^="EUROPE //"]').click().catch(() => {}); await page.waitForTimeout(300)
await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().click(); await page.waitForTimeout(600)
await page.locator('[aria-label^="ACCEPT CONTRACT"]').click(); await page.waitForTimeout(800)
const mk = page.locator('[aria-label^="OPEN THE RECRUITMENT MARKET"]').first()
const mkCount = await mk.count()
let hire = { marketButton: mkCount }
if (mkCount) {
  await mk.click(); await page.waitForTimeout(500)
  const hb = await page.$$eval('button[aria-label^="HIRE "]', (b) => b.map((x) => ({ l: x.getAttribute('aria-label'), off: x.disabled })))
  hire.buttons = hb
  const ok = hb.find((x) => !x.off)
  if (ok) {
    const c0 = await credits()
    await page.locator(`button[aria-label="${ok.l}"]`).click(); await page.waitForTimeout(600)
    hire.debit = { label: ok.l, before: c0, after: await credits() }
  }
  await shot('p5-hire')
  await page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.setState({ credits: 0 }))
  await page.waitForTimeout(300)
  const hb2 = await page.$$eval('button[aria-label^="HIRE "]', (b) => b.map((x) => ({ l: x.getAttribute('aria-label'), off: x.disabled })))
  const rosterBefore = (await L.state(page)).living
  const t2 = hb2[0]
  if (t2) await page.locator(`button[aria-label="${t2.l}"]`).click({ force: true, timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(400)
  hire.short = { buttons: hb2, credits: await credits(), rosterBefore, rosterAfter: (await L.state(page)).living }
  await shot('p5-hire-short')
}
step('p5-hire', hire)

// Path 6: save / reload keeps Credits.
await page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.setState({ credits: 97531 }))
await page.waitForTimeout(800)
const beforeReload = await credits()
await page.reload(); await page.waitForTimeout(900)
await page.locator('[aria-label^="CONTINUE SAVED"]').click(); await page.waitForTimeout(1200)
await L.dismiss(page)
step('p6-reload', { before: beforeReload, after: await credits(), phase: (await L.state(page)).phase })

step('errors', { errs })
writeFileSync(L.OUT + 'scenario-s3.json', JSON.stringify(R, null, 1))
await browser.close()
