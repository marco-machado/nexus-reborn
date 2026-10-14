// /team-qa sprint-002 (2026-10-13) — UI walk for WN-012, WN-013, WN-014 and the
// WN-017 opening desk, against commit 41febe7 served on SMOKE_URL (4201).
// Intel and the WN-014 contracts are seeded through store setState (UI checks
// only); everything else is the real New Operation state.
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'

const EV = '/Users/machado/Projects/nexus-reborn/production/qa/evidence/'
const R = {}
const { browser, page, errs } = await L.open()
const shot = (dir, n) => page.screenshot({ path: `${EV}${dir}/${n}-41febe7-1280x720.png` })
const ev = (fn, arg) => page.evaluate(fn, arg)
const stores = `const W=(await import('/src/state/worldStore.ts'));const C=(await import('/src/state/campaignStore.ts')).useCampaignStore;`
const run = (body) => page.evaluate(new Function(`return (async()=>{${stores}${body}})()`))
const click = async (label) => { await page.locator(`button[aria-label^="${label}"]`).first().click(); await page.waitForTimeout(250) }
const panel = () => ev(() => { const t = document.body.innerText; const i = t.indexOf('FOCUS\n<\n>'); return i < 0 ? '' : t.slice(i, t.indexOf('OPEN CONTRACTS', i)) })
const enabled = () => ev(() => [...document.querySelectorAll('button')].filter((b) => !b.disabled).map((b) => b.getAttribute('aria-label') || b.textContent.trim()))
const clip = () => ev(() => ({ scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight,
  overflowing: [...document.querySelectorAll('.wm-panel *, .wm-ops-body *, .wm-fc *')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow === 'hidden').length }))
const selected = () => run(`return W.useWorldStore.getState().selected`)

await L.newOperation(page)
await click('PAUSE STRATEGIC CLOCK')

// WN-017-01..04: opening desk, first minute, no contract selected.
{
  const visits = []
  for (let i = 0; i < 7; i++) { await click('FOCUS NEXT SECTOR'); visits.push(await selected()) }
  await click('EUROPE //')
  const p = await panel()
  const four = ['CONTROL', 'UNREST', 'TAX YIELD', 'GARRISON CONDITION'].map((k) => [k, (p.match(new RegExp(k + '\\n([^\\n]+)')) || [])[1]])
  const tt = () => run(`return W.useWorldStore.getState().t`)
  const t0 = await tt(); await page.waitForTimeout(2000); const tPaused = (await tt()) - t0
  await click('CLOCK SPEED 1X'); const t1 = await tt(); await page.waitForTimeout(2000); const d1 = (await tt()) - t1
  await click('CLOCK SPEED 8X'); const t8 = await tt(); await page.waitForTimeout(2000); const d8 = (await tt()) - t8
  await click('PAUSE STRATEGIC CLOCK')
  R.wn017_opening = { focusNextVisits: visits, four, dtPaused2s: tPaused, dt1x2s: d1, dt8x2s: d8, enabledVerbs: await enabled(), clip: await clip() }
  await shot('wn-017', 'wn-017-opening-europe-paused')
}

// WN-013 at intel 1, 2, 3; WN-012 at intel 1, 2, 3 (Europe focused).
R.wn013 = {}; R.wn012 = {}
for (const intel of [1, 2, 3]) {
  await run(`C.setState({ intelLevel: ${intel} })`); await page.waitForTimeout(300)
  const before = await selected()
  const antDisabled = await page.locator('button[aria-label^="ANTARCTICA //"]').getAttribute('aria-disabled'); await page.locator('button[aria-label^="ANTARCTICA //"]').click({ force: true }); await page.waitForTimeout(250)
  const after = await selected()
  const antButton = await ev(() => [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').filter((l) => l.startsWith('ANTARCTICA')))
  const visits = []
  for (let i = 0; i < 7; i++) { await click('FOCUS NEXT SECTOR'); visits.push(await selected()) }
  for (let i = 0; i < 7; i++) { await click('FOCUS PREVIOUS SECTOR'); visits.push(await selected()) }
  await click('EUROPE //')
  const p = await panel()
  const scanAnt = await ev(() => { const t = document.body.innerText; const i = t.indexOf('ANTARCTICA'); return t.slice(i, i + 40) })
  R.wn013['intel' + intel] = { selectedBefore: before, antarcticaAriaDisabled: antDisabled, selectedAfterAntarcticaClick: after, antarcticaButton: antButton, focusCycle: [...new Set(visits)], scanAntarctica: scanAnt,
    europeTaxYield: (p.match(/TAX YIELD\n([^\n]+)/) || [])[1], verbs: (p.match(/\d (STABILIZE|LOBBY|EXPEDITE)/g) || []) }
  await shot('wn-013', `wn-013-intel${intel}-europe`)
  const fcText = await ev(() => document.querySelector('.wm-fc')?.innerText ?? null)
  const expected = await run(`const F=await import('/src/game/forecast.ts');const A=await import('/src/game/atlas.ts');const s=W.useWorldStore.getState();return F.eventForecast(A.OPEN_SECTORS.map(sec=>({sector:sec,unrest:s.sectors[sec].unrest,crisis:s.crisis.includes(sec)})),'eu')`)
  R.wn012['intel' + intel] = { forecastText: fcText, expectedFromForecastTs: expected, clip: await clip() }
  await shot('wn-012', `wn-012-intel${intel}-europe`)
}

// WN-013-05: Europe Tax figure prints and Europe does not pay. Advance to the
// next tax due through the store's own advanceDays and compare the deposit
// with the Tax yield of the Nexus-held sectors.
R.wn013_tax = await run(`
  const A = await import('/src/game/atlas.ts'); const App = (await import('/src/state/appStore.ts')).useAppStore
  const s = W.useWorldStore.getState()
  const rows = A.OPEN_SECTORS.map((id) => ({ id, holder: A.sectorCorp(id, s.owner), taxYield: W.sectorReadout(id, s.sectors[id]).taxYield }))
  const creditsBefore = App.getState().credits, t = s.t, due = s.nextTaxT
  s.advanceDays((due - t + 1) / 86400)
  const creditsAfter = App.getState().credits
  return { t, nextTaxT: due, rows, nexusSum: rows.filter((r) => r.holder === 'nexus').reduce((a, r) => a + r.taxYield, 0), deposit: creditsAfter - creditsBefore, events: W.useWorldStore.getState().events.filter((e) => e.t > t).map((e) => e.text) }`)

// WN-014: seeded generated contracts in North America.
const mk = (id, threat, expedited, t) => ({ id, createdT: t, expiresAtT: t + 48 * 3600, sector: 'na', cityId: 'nb', district: 5,
  type: 'SEIZURE', client: 'helix', threat, reward: 50000, seed: 1234 + id.length, priority: false, expedited })
R.wn014 = {}
for (const intel of [1, 2, 3]) {
  const t = await run(`return W.useWorldStore.getState().t`)
  await run(`C.setState({ intelLevel: ${intel} }); W.useWorldStore.setState({ contracts: ${JSON.stringify([mk('gc-high', 'HIGH', false, 0), mk('gc-severe', 'SEVERE', false, 0), mk('gc-sev-exp', 'SEVERE', true, 0)])}.map(c => ({...c, createdT: ${t}, expiresAtT: ${t} + 172800})) })`)
  await page.waitForTimeout(300)
  await click('NORTH AMERICA //')
  const rows = await ev(() => [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').filter((l) => /^OPEN CONTRACT|\/\/ LOCKED/.test(l)))
  const chance = await ev(() => document.body.innerText.match(/CHANCE\s*\n?\s*\d+%/g))
  const risk = await ev(() => /RISK INDEX|\bGUARDED\b/.test(document.body.innerText))
  const store = await run(`const K=await import('/src/game/contracts.ts');const s=W.useWorldStore.getState();const vis=new Set(K.visibleContracts(s.contracts,C.getState().intelLevel).map(c=>c.id));return s.contracts.map(c=>({id:c.id,req:K.contractIntelReq(c),expedited:c.expedited,expiresAtT:c.expiresAtT,t:s.t,held:true,visible:vis.has(c.id)}))`)
  R.wn014['intel' + intel] = { rows, chance, riskBandOnWorldChrome: risk, store, clip: await clip() }
  await shot('wn-014', `wn-014-intel${intel}-na`)
}

R.consoleErrors = errs.filter((e) => !/favicon/.test(e))
writeFileSync(L.OUT + 'ui.json', JSON.stringify(R, null, 1))
console.log(JSON.stringify(R, null, 1))
await browser.close()
