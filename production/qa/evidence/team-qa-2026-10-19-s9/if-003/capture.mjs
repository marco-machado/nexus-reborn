// IF-003 capture: contract navigation gates Brief, Assembly and Deploy, at
// 1280x720 in headless Chrome for Testing against the dev server (:4200).
// Real UI clicks drive the flow. Harness assists, named: the Debrief is reached
// by setOutcome with a hand-built won outcome (the sim is not played here;
// Debrief content is IF-009/IF-011); the Brief-vs-deployed table reads the
// live Brief DOM and the live world (getWorld) after the real Deploy click.
//
// Run: node production/qa/evidence/if-003/capture.mjs   (vite dev on :4200)
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME =
  process.env.SWEEP_CHROME ||
  process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.SWEEP_URL || 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
const renderer = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => {
  if (m.type() === 'error') errs.push('console ' + m.text())
  else if (/renderer backend/i.test(m.text())) renderer.push(m.text())
})
page.on('response', (r) => r.status() >= 400 && errs.push('HTTP ' + r.status() + ' ' + r.url()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const log = []
const note = (s) => { log.push(s); console.log(s) }
const phase = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
const missionId = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().missionId)
const navState = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.navtab')].map((b) => ({
      label: b.querySelector('.navtab-label')?.textContent,
      locked: b.classList.contains('locked'),
      ariaDisabled: b.getAttribute('aria-disabled'),
      aria: b.getAttribute('aria-label'),
    })),
  )
async function until(fn, ms) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (await page.evaluate(fn)) return; await wait(250) }
  throw new Error('timed out ' + fn.toString().slice(0, 80))
}
async function dismiss() {
  const d = page.locator('[aria-label="Dismiss the orientation"]')
  if (await d.count()) { await d.click(); await wait(300) }
}

await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await wait(1500)
await page.getByText('NEW OPERATION').first().click()
await wait(1500)
await dismiss()
await wait(400)

// AC4: no selected contract.
note('phase=' + (await phase()) + ' missionId=' + (await missionId()))
const nav0 = await navState()
note('nav, no contract: ' + JSON.stringify(nav0))
await shot('01-nav-no-contract-brief-locked')
await page.locator('[aria-label^="BRIEF // LOCKED"]').click({ force: true })
await wait(300)
note('click locked BRIEF -> phase=' + (await phase()))
await page.locator('[aria-label="ASSEMBLY"]').click()
await wait(900)
note('click ASSEMBLY -> phase=' + (await phase()))
await shot('02-assembly-reachable-no-contract')
const deployBtn = page.locator('[aria-label^="DEPLOY TEAM"]')
note('deploy button aria-label: ' + (await deployBtn.getAttribute('aria-label')))
note('deploy button text: ' + (await page.locator('.cta').filter({ hasText: 'DEPLOY' }).first().innerText()).replace(/\s+/g, ' '))
await deployBtn.click({ force: true })
await wait(800)
note('click DEPLOY (no contract) -> phase=' + (await phase()))
await shot('03-deploy-refusal-no-contract')

// AC5: select a contract, Brief opens.
await page.locator('[aria-label="WORLD NETWORK"]').click()
await wait(800)
await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().click()
await wait(900)
note('select Glass Veil -> phase=' + (await phase()) + ' missionId=' + (await missionId()))
const nav1 = await navState()
note('nav, with contract: ' + JSON.stringify(nav1))
await shot('04-nav-with-contract-brief-open')
const brief = await page.evaluate(() =>
  Object.fromEntries([...document.querySelectorAll('.mb-tac-stat')].map((s) => [s.querySelector('label').textContent, s.querySelector('b').textContent])),
)
note('brief stats: ' + JSON.stringify(brief))
await page.locator('[aria-label^="ACCEPT CONTRACT"]').click()
await wait(900)
note('Accept Contract -> phase=' + (await phase()))
await page.locator('[aria-label^="DEPLOY STRIKE TEAM"]').click()
await until(async () => !!(await import('/src/game/runtime.ts')).getWorld(), 60000)
await wait(2500)
note('Deploy -> phase=' + (await phase()))
const table = await page.evaluate(async (brief) => {
  const { getWorld } = await import('/src/game/runtime.ts')
  const { weatherBriefLabel } = await import('/src/game/missionParams.ts')
  const { buildTacticalMap } = await import('/src/ui/briefMap.ts')
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  const { missionMods, missionVariant } = await import('/src/game/missionParams.ts')
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const w = getWorld()
  const m = w.mission
  const mods = missionMods(m, useWorldStore.getState().sectors[m.sector], useSettingsStore.getState().difficulty)
  const tac = buildTacticalMap(m, missionVariant(m, false), { enemyExtra: mods.enemyExtra, civilianCount: mods.civilianCount, officerCount: mods.officerCount, heavyCount: mods.heavyCount })
  const pad2 = (n) => String(n).padStart(2, '0')
  const rows = [
    ['Seed (contract)', String(m.seed), String(w.mission.seed)],
    ['Difficulty', useSettingsStore.getState().difficulty, useSettingsStore.getState().difficulty],
    ['Insertion', JSON.stringify(tac.insertion), JSON.stringify(w.city.spawnAgents[0])],
    ['Extraction', JSON.stringify(tac.extraction), JSON.stringify({ x: w.city.extraction.x, z: w.city.extraction.z })],
    ['Objectives', m.objectives.map((o) => o.id).join(','), w.mission.objectives.map((o) => o.id).join(',')],
    ['Garrison (Brief stat GARRISON)', brief.GARRISON + ' / tac ' + pad2(tac.counts.garrison), pad2(w.city.enemies.filter((e) => e.tag === 'garrison').length)],
    ['Civilians (Brief stat CIVILIANS)', brief.CIVILIANS + ' / tac ' + pad2(tac.counts.civilians), pad2(w.units.filter((u) => u.kind === 'civilian').length)],
    ['Opening hour', String(m.openingHour), String(w.mission.openingHour)],
    ['Weather / front (Brief stat WEATHER)', brief.WEATHER, weatherBriefLabel(w.mission)],
  ]
  return rows
}, brief)
const md = ['| Field | Brief | Deployed mission |', '| --- | --- | --- |', ...table.map((r) => `| ${r[0]} | ${r[1]} | ${r[2]} |`)].join('\n')
writeFileSync(OUT + 'brief-vs-deployed.md', md + '\n')
note(md)
await shot('05-deployed-mission')

// AC6: Debrief -> World Network; Replay.
await page.evaluate(async () => {
  const A = (await import('/src/state/appStore.ts'))
  const { teardownMission } = await import('/src/state/missionLifecycle.ts')
  teardownMission()
  A.useAppStore.getState().setOutcome(A.settleOutcome({ applyKey: 99, won: true, kills: 1, casualties: 0, timeSec: 100, civiliansHit: 0, reward: 0, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: true }))
})
await wait(1200)
note('Debrief (authored, assist outcome) -> phase=' + (await phase()))
await shot('06-debrief-authored-replay-offered')
note('REPLAY button count: ' + (await page.getByText('REPLAY MISSION').count()))
await page.getByText('REPLAY MISSION').click()
await wait(900)
note('Replay -> phase=' + (await phase()) + ' missionId=' + (await missionId()))
await shot('07-replay-returns-to-brief')
await page.evaluate(async () => {
  const A = (await import('/src/state/appStore.ts'))
  A.useAppStore.getState().setOutcome(A.settleOutcome({ applyKey: 100, won: true, kills: 1, casualties: 0, timeSec: 100, civiliansHit: 0, reward: 0, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: true }))
})
await wait(1200)
await page.getByText('RETURN TO WORLD NETWORK').click()
await wait(900)
note('Return -> phase=' + (await phase()) + ' missionId=' + (await missionId()))
note('nav after return: ' + JSON.stringify(await navState()))
await shot('08-nav-after-debrief-return-brief-locked')

// Generated contract Debrief: no Replay control (assist: id minted by the owner).
const gen = await page.evaluate(async () => {
  const W = (await import('/src/state/worldStore.ts')).useWorldStore.getState()
  return W.contracts[0]?.id ?? null
})
note('generated offer on the board: ' + gen)
if (gen) {
  await page.evaluate(async (gen) => {
    const A = (await import('/src/state/appStore.ts'))
    A.useAppStore.setState({ missionId: gen })
    A.useAppStore.getState().setOutcome(A.settleOutcome({ applyKey: 101, won: true, kills: 1, casualties: 0, timeSec: 100, civiliansHit: 0, reward: 0, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false }))
  }, gen)
  await wait(1200)
  note('generated Debrief REPLAY button count: ' + (await page.getByText('REPLAY MISSION').count()))
  await shot('09-debrief-generated-no-replay')
}
note('errors: ' + JSON.stringify(errs))
note('renderer: ' + JSON.stringify(renderer))
writeFileSync(OUT + 'capture-output.txt', log.join('\n') + '\n')
await browser.close()
