// Scenario A: opening desk perf baseline → clean Glass Veil win (path 4) →
// quiet replay (path 5) → intel gating (path 8) → Intel 2 → Hollow Crown and
// Rust Haven → campaign complete, three authored contracts still selectable (path 7).
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'

const R = { steps: [] }
const step = (name, data) => { R.steps.push({ name, ...data }); console.log('##', name, JSON.stringify(data)) }
const { browser, page, errs } = await L.open()
const shot = (n) => page.screenshot({ path: L.OUT + n + '-1280x720.png' })
const scanText = () => page.evaluate(() => [...document.querySelectorAll('button[aria-label^="OPEN CONTRACT"], button[aria-label*="// LOCKED"]')].map((b) => b.getAttribute('aria-label')))

// Visible generated contracts and their buttons, read through the app's own helpers.
const genInfo = () =>
  page.evaluate(async () => {
    const W = (await import('/src/state/worldStore.ts')).useWorldStore.getState()
    const C = (await import('/src/state/campaignStore.ts')).useCampaignStore.getState()
    const K = await import('/src/game/contracts.ts')
    const vis = new Set(K.visibleContracts(W.contracts, C.intelLevel).map((c) => c.id))
    return W.contracts.map((c) => ({ id: c.id, sector: c.sector, threat: c.threat, req: K.contractIntelReq(c), visible: vis.has(c.id), name: K.contractMission(c).codename, expiresAtT: c.expiresAtT }))
  })
const SECTOR = { na: 'NORTH AMERICA', sa: 'SOUTH AMERICA', eu: 'EUROPE', af: 'AFRICA', as: 'ASIA', oc: 'OCEANIA' }
const focus = async (sec) => { await page.locator(`button[aria-label^="${SECTOR[sec]} //"]`).click(); await page.waitForTimeout(300) }
const buttonsFor = (name) => page.evaluate((n) => [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').filter((l) => l.includes(n)), name)

async function win(label, tag, opts = {}) {
  const before = await L.state(page)
  await L.deploy(page, label)
  // Strategic state at launch: the clock does not run on the Mission screen,
  // so this is the frozen t0 the write-back starts from.
  const atLaunch = await L.state(page)
  await L.armEtaProbe(page)
  const play = await L.play(page, { god: true, ff: 2, clean: true, budgetMs: 480000, ...opts })
  await L.waitDebrief(page)
  const outcome = await L.outcome(page)
  const eta = await page.evaluate(() => window.__eta)
  await shot(tag + '-debrief')
  const debriefText = (await page.innerText('body')).slice(0, 600)
  const t0 = await L.now(page)
  const ret = await L.leaveDebrief(page)
  await page.waitForTimeout(2500)
  const after = await L.state(page)
  const header = await page.evaluate(() => (document.body.innerText.match(/INFLUENCE\s*\n?\s*\d+\s*PTS/) || [''])[0].replace(/\s+/g, ' '))
  const perfReturn = await L.frames(page, t0, await L.now(page))
  await shot(tag + '-world')
  return { before, atLaunch, play, outcome, eta, after, header, debriefText, ret, perfReturn }
}

// 1. Opening desk + World Network 8X frame baseline.
await L.newOperation(page)
await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
let a = await L.now(page); await page.waitForTimeout(15000)
step('baseline-world-8x', { perf: await L.frames(page, a, await L.now(page)) })
await page.locator('[aria-label="PAUSE STRATEGIC CLOCK"]').click()

// Path 8 at intel 1: hidden generated contract, Chance on contract chrome.
const g1 = await genInfo()
for (const c of g1) if (!c.visible) await focus(c.sector)
const hidden1 = g1.filter((c) => !c.visible)
const hiddenButtons = {}
for (const c of hidden1) { await focus(c.sector); hiddenButtons[c.name] = await buttonsFor(c.name) }
await focus('eu')
const chance1 = await page.evaluate(() => (document.body.innerText.match(/CHANCE[^\n]*\n?[^\n]*/g) || []).slice(0, 4))
await shot('p8-intel1')
step('p8-intel1', { intel: (await L.state(page)).intelLevel, contracts: g1, hiddenStillOnScanButtons: hiddenButtons, chanceText: chance1, scanRows: await scanText() })

// 2. Path 4: clean non-quiet Glass Veil win (retry on a fresh operation if dirty).
let gv
for (let attempt = 1; attempt <= 4; attempt++) {
  gv = await win('OPEN CONTRACT GLASS VEIL', 'p4-gv-attempt' + attempt)
  step('p4-glass-veil-attempt-' + attempt, gv)
  if (gv.outcome?.won && gv.outcome.civiliansHit === 0) break
  if (attempt < 4) await L.newOperation(page)
}

// 3. Path 5: quiet replay of Glass Veil.
const qr = await win('OPEN CONTRACT GLASS VEIL', 'p5-quiet')
const unchanged = (k) => JSON.stringify(qr.atLaunch[k]) === JSON.stringify(qr.eta?.[k])
step('p5-quiet-replay', {
  ...qr,
  atBoundary: {
    tUnchanged: qr.atLaunch.t === qr.eta?.t, phaseAtLaunch: qr.atLaunch.phase,
    influence: unchanged('influence'), intelLevel: unchanged('intelLevel'), intelProgress: unchanged('intelProgress'),
    sectors: unchanged('sectors'), owner: unchanged('owner'),
  },
  etaRan: { dt: qr.after.t - qr.eta?.t, creditsDuringEta: qr.after.credits - qr.eta?.credits, eventsAfter: qr.after.events },
})

// 4. Intel to 2 through a visible non-quiet generated contract.
for (let i = 0; i < 4 && (await L.state(page)).intelLevel < 2; i++) {
  const vis = (await genInfo()).filter((c) => c.visible)
  if (!vis.length) {
    await page.locator('[aria-label="RESUME STRATEGIC CLOCK"]').click().catch(() => {})
    await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
    await page.waitForTimeout(20000)
    await page.locator('[aria-label="PAUSE STRATEGIC CLOCK"]').click().catch(() => {})
    step('wait-for-generated', { contracts: await genInfo() })
    continue
  }
  const c = vis[0]
  await focus(c.sector)
  const r = await win('OPEN CONTRACT ' + c.name, 'gen-' + i)
  step('generated-win-' + i, { contract: c, outcome: r.outcome, eta: r.eta && { influence: r.eta.influence, intelLevel: r.eta.intelLevel, intelProgress: r.eta.intelProgress }, after: { intelLevel: r.after.intelLevel, intelProgress: r.after.intelProgress, influence: r.after.influence } })
}

// Path 8 at intel 2: the formerly hidden contract shows (if not expired).
const g2 = await genInfo()
const shown2 = {}
for (const c of hidden1) { const now = g2.find((x) => x.id === c.id); if (now) { await focus(now.sector); shown2[c.name] = { record: now, buttons: await buttonsFor(c.name) } } else shown2[c.name] = 'expired/gone' }
await shot('p8-intel2')
step('p8-intel2', { intel: (await L.state(page)).intelLevel, formerlyHidden: shown2 })

// 5. Hollow Crown and Rust Haven → campaign complete.
await focus('eu')
for (const [label, tag] of [['OPEN CONTRACT HOLLOW CROWN', 'p7-hc'], ['OPEN CONTRACT RUST HAVEN', 'p7-rh']]) {
  let r
  for (let k = 1; k <= 3; k++) {
    r = await win(label, tag + '-try' + k)
    if (r.outcome?.won) break
    step(tag + '-lost-try' + k, { outcome: r.outcome, play: r.play })
  }
  step(tag, { outcome: r.outcome, play: r.play, after: { contractsWon: r.after.contractsWon, campaignWon: r.after.campaignWon, campaignFailed: r.after.campaignFailed } })
}
const banner = await page.evaluate(() => ({ win: [...document.querySelectorAll('.wm-campaign-win')].map((e) => e.innerText), fail: [...document.querySelectorAll('.wm-campaign-fail')].map((e) => e.innerText) }))
await shot('p7-complete')
const selectable = {}
for (const n of ['GLASS VEIL', 'HOLLOW CROWN', 'RUST HAVEN']) {
  await page.locator('[aria-label="WORLD NETWORK"]').click(); await page.waitForTimeout(300); await focus('eu')
  await page.locator(`[aria-label^="OPEN CONTRACT ${n}"]`).first().click(); await page.waitForTimeout(500)
  const s = await L.state(page)
  selectable[n] = { phase: s.phase, missionId: s.missionId }
}
step('p7-campaign-complete', { banner, selectable, flags: await L.state(page).then((s) => ({ won: s.campaignWon, failed: s.campaignFailed })) })

step('errors', { errs })
writeFileSync(L.OUT + 'scenario-a.json', JSON.stringify(R, null, 1))
await browser.close()
