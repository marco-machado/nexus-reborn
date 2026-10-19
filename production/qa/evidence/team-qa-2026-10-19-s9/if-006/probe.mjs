// IF-006 /team-qa 2026-10-19 probe, cases TC-06 to TC-09 of
// production/qa/test-cases/if-006-menu-continue-new-operation-cases.md.
// Headless Chrome for Testing at 1280x720 against a vite dev server.
// Real clicks: Menu NEW OPERATION (x2), OPEN SETTINGS, the TELEMETRY toggle,
// the Balance entry and CLEAR (x2), pause (Escape) and Abort (x2).
// Harness assists, named, every seeded value printed with a SEEDED: prefix:
// localStorage clear; nondefault Settings through settingsStore setters;
// a progressed campaign through appStore/campaignStore/researchStore/
// tutorialStore setState then writeSave; telemetry records through
// telemetry.saveRecords; the jump to a live mission through the app store
// (Team Deploy -> startMission, MISSIONS[0] = GLASS VEIL).
// Canonical fresh-operation fixture, read at run time (not copied):
//   credits      INITIAL_CREDITS            src/state/appStore.ts:146
//   intelLevel   initialCampaignData()      src/state/campaignStore.ts:150-170
//   contractsWon initialCampaignData()      src/state/campaignStore.ts:177
//   labs         startNewOperation reset    src/state/save.ts:975 (idleLabs, src/state/researchStore.ts:39)
//   tutorial     useTutorialStore.resetAll  src/state/save.ts:950
//
// Run: npm run dev -- --strictPort      (port 4200)
//      SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/if-006/probe.mjs
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

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const log = []
let fails = 0
const note = (s) => { log.push(s); console.log(s) }
const check = (name, ok, detail = '') => { if (!ok) fails++; note(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' // ' + detail : ''}`) }
const J = (v) => JSON.stringify(v)

const settings = () =>
  page.evaluate(async () => {
    const s = (await import('/src/state/settingsStore.ts')).useSettingsStore.getState()
    return { difficulty: s.difficulty, quality: s.quality, holdGround: s.overrides.holdGround ?? null, textScale: s.textScale, telemetry: s.telemetry }
  })
const campaign = () =>
  page.evaluate(async () => {
    const app = (await import('/src/state/appStore.ts')).useAppStore.getState()
    const c = (await import('/src/state/campaignStore.ts')).useCampaignStore.getState()
    const r = (await import('/src/state/researchStore.ts')).useResearchStore.getState()
    const t = (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState()
    return { credits: app.credits, intelLevel: c.intelLevel, contractsWon: c.contractsWon, labs: r.labs, tutorialSeen: t.seen }
  })
const canonical = () =>
  page.evaluate(async () => {
    const { INITIAL_CREDITS } = await import('/src/state/appStore.ts')
    const { initialCampaignData } = await import('/src/state/campaignStore.ts')
    const c = initialCampaignData()
    return { credits: INITIAL_CREDITS, intelLevel: c.intelLevel, contractsWon: c.contractsWon, labs: { ballistics: null, cybernetics: null, control: null }, tutorialSeen: [] }
  })
const records = () => page.evaluate(async () => (await import('/src/state/telemetry.ts')).loadRecords().map((r) => r.at))
const phase = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)

async function toMenu() {
  await page.reload()
  await wait(1500)
  check(`on Menu after reload`, (await phase()) === 'menu', await phase())
}
// BEGIN NEW OPERATION arms when a campaign is on file (two-step) and starts
// at once when none is; press again only when the confirm state shows.
async function newOperation() {
  await page.locator('[aria-label="BEGIN NEW OPERATION"]').click()
  await wait(300)
  const confirm = page.locator('[aria-label^="CONFIRM NEW OPERATION"]')
  const armed = (await confirm.count()) === 1
  if (armed) await confirm.click()
  await wait(800)
  return armed
}
const telemetryToggle = () => page.locator('button[aria-label^="TELEMETRY: LOCAL ONLY"]')
async function setTelemetryByClick(on) {
  const t = telemetryToggle()
  const label = await t.getAttribute('aria-label')
  if (label.endsWith(on ? '// OFF' : '// ON')) { await t.click(); await wait(300) }
  return await telemetryToggle().getAttribute('aria-label')
}
async function enterMissionAndAbort(withSettings) {
  await page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { MISSIONS, DEFAULT_SQUAD } = await import('/src/game/data.ts')
    useAppStore.setState({ phase: 'team', missionId: MISSIONS[0].id, squad: [...DEFAULT_SQUAD] })
    useAppStore.getState().startMission()
  })
  await page.waitForSelector('.hud-btn.pause', { timeout: 30000 })
  await wait(2500)
  await page.mouse.click(640, 400)
  await wait(150)
  await page.keyboard.press('Escape')
  await wait(400)
  if (withSettings) {
    await page.getByRole('button', { name: 'Open settings' }).click()
    await wait(400)
    const r = await withSettings()
    await page.keyboard.press('Escape')
    await wait(400)
    note('in-mission Settings: ' + r)
  }
  await page.locator('.hud-btn.abort').click()
  await wait(250)
  await page.locator('.hud-btn.abort').click()
  await wait(800)
  return await phase()
}
async function openBalanceFromMenu() {
  await page.getByRole('button', { name: /OPEN SETTINGS/ }).click()
  await wait(500)
  const entry = page.locator('[aria-label="Open the balance dashboard"]')
  const n = await entry.count()
  if (n === 1) { await entry.click(); await wait(600) }
  return n
}
const balanceCount = () =>
  page.evaluate(() => {
    const m = document.body.innerText.match(/LOCAL ONLY \/\/ (\d+)\/\d+ RECORDS/)
    return m ? Number(m[1]) : null
  })

try {
  // ---------- TC-06: confirmed New Operation keeps Settings, resets campaign ----------
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1500)
  const defaults = await settings()
  note('defaults (settingsStore): ' + J(defaults))
  await page.evaluate(async () => {
    const S = (await import('/src/state/settingsStore.ts')).useSettingsStore.getState()
    S.setDifficulty('hardened')
    S.setQuality('low')
    S.setBindingOverride('holdGround', ['KeyJ'])
    S.setTextScale(125)
    S.setTelemetry(true)
    ;(await import('/src/state/appStore.ts')).useAppStore.setState({ credits: 4321 })
    ;(await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: 3, contractsWon: ['m01', 'm02'] })
    ;(await import('/src/state/researchStore.ts')).useResearchStore.setState({ labs: { ballistics: { id: 'b-propellants', startedT: 0, endT: 99999 }, cybernetics: null, control: null } })
    ;(await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().skipTutorial()
    ;(await import('/src/state/save.ts')).writeSave(localStorage)
  })
  // The Menu does not hydrate the campaign (Continue does), so the seeded
  // campaign is read from the stores just before the write and the save's
  // validity from the Menu line.
  const c0 = await campaign()
  await toMenu()
  const s0 = await settings()
  const line = await page.locator('.menu-save-line').textContent().catch(() => null)
  check('TC-06 precondition: seeded campaign on file (Menu reads CAMPAIGN ON FILE)', line === 'CAMPAIGN ON FILE', line)
  note('SEEDED: settings ' + J(s0))
  note('SEEDED: campaign ' + J({ ...c0, tutorialSeen: c0.tutorialSeen.length + ' ids' }))
  check('TC-06 precondition: seeded settings differ from defaults on all 5', Object.keys(s0).every((k) => J(s0[k]) !== J(defaults[k])), J({ s0, defaults }))
  const fix = await canonical()
  note('canonical fixture (read at run time): ' + J(fix))
  check('TC-06 precondition: seeded campaign differs from the fixture on all 5', Object.keys(fix).every((k) => J(c0[k]) !== J(fix[k])))
  check('TC-06 New Operation was two-step (armed, then confirmed)', await newOperation())
  const s1 = await settings()
  const c1 = await campaign()
  note('after New Operation: settings ' + J(s1) + ' campaign ' + J(c1))
  await shot('probe-06-after-new-operation')
  for (const k of Object.keys(s0)) check(`TC-06 setting kept: ${k}`, J(s1[k]) === J(s0[k]), `${J(s0[k])} -> ${J(s1[k])}`)
  for (const k of Object.keys(fix)) check(`TC-06 campaign field = fixture: ${k}`, J(c1[k]) === J(fix[k]), `${J(c1[k])} vs ${J(fix[k])}`)

  // ---------- TC-07: recording off adds no record, keeps earlier ones ----------
  await page.evaluate(async () => {
    const T = await import('/src/state/telemetry.ts')
    T.saveRecords([
      { at: 1, missionId: 'm01', outcome: 'aborted', durationSec: 12, seed: 20870514, squadRoles: ['assault'] },
      { at: 2, missionId: 'm01', outcome: 'aborted', durationSec: 30, seed: 20870514, squadRoles: ['assault', 'recon'] },
    ], localStorage)
  })
  note('SEEDED: 2 telemetry records, at=[1,2]')
  const r0 = await records()
  const ph1 = await enterMissionAndAbort(null)
  const r1 = await records()
  check('TC-07 control: Abort with recording on adds exactly 1 record', r1.length === r0.length + 1, `${r0.length} -> ${r1.length}, phase ${ph1}`)
  const N = r1.length
  note(`TC-07 N=${N} ids=${J(r1)}`)
  const ph2 = await enterMissionAndAbort(async () => await setTelemetryByClick(false))
  const r2 = await records()
  check('TC-07 disabled interval: Abort with recording off adds none', r2.length === N && J(r2) === J(r1), `${J(r1)} -> ${J(r2)}, phase ${ph2}`)
  await toMenu()
  await page.getByRole('button', { name: /OPEN SETTINGS/ }).click()
  await wait(500)
  note('TC-07 toggle back on: ' + (await setTelemetryByClick(true)))
  await page.keyboard.press('Escape')
  await wait(300)
  const nEntry = await openBalanceFromMenu()
  const bc = await balanceCount()
  const r3 = await records()
  check('TC-07 Balance shows N records with the same ids', nEntry === 1 && bc === N && J(r3) === J(r1), `entry ${nEntry}, balance ${bc}, ids ${J(r3)}`)
  await shot('probe-07-balance-after-disabled-interval')

  // ---------- TC-08: New Operation keeps the log; Clear empties it ----------
  await toMenu()
  await newOperation()
  check('TC-08 New Operation keeps the log', (await records()).length === N, J(await records()))
  await toMenu()
  await openBalanceFromMenu()
  check('TC-08 Balance count after New Operation = N', (await balanceCount()) === N, String(await balanceCount()))
  const clear = page.locator('button[aria-label^="CLEAR the telemetry"], button[aria-label^="CONFIRM // ERASE RECORDS"]')
  await clear.click()
  await wait(300)
  await clear.click()
  await wait(600)
  const rc = await records()
  check('TC-08 Clear empties the log', rc.length === 0, J(rc))
  note('TC-08 Balance count after Clear: ' + (await balanceCount()))
  await shot('probe-08-balance-cleared')

  // ---------- TC-09: Balance reachable with recording off and a nonempty log ----------
  await page.evaluate(async () => {
    const T = await import('/src/state/telemetry.ts')
    T.saveRecords([{ at: 3, missionId: 'm01', outcome: 'aborted', durationSec: 9, seed: 20870514, squadRoles: ['assault'] }], localStorage)
  })
  note('SEEDED: 1 telemetry record, at=[3]')
  await toMenu()
  await page.getByRole('button', { name: /OPEN SETTINGS/ }).click()
  await wait(500)
  const offLabel = await setTelemetryByClick(false)
  const entryN = await page.locator('[aria-label="Open the balance dashboard"]').count()
  check('TC-09 recording off and Balance entry present', offLabel.endsWith('// OFF') && entryN === 1, `${offLabel}, entry ${entryN}`)
  await page.locator('[aria-label="Open the balance dashboard"]').scrollIntoViewIfNeeded()
  await shot('probe-09a-settings-recording-off-balance-entry')
  await page.locator('[aria-label="Open the balance dashboard"]').click()
  await wait(600)
  check('TC-09 Balance open with recording off', (await balanceCount()) === 1 && (await settings()).telemetry === false)
  await shot('probe-09b-balance-open-recording-off')
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
} finally {
  note(`errors: ${J(errs)}`)
  note(fails === 0 && errs.length === 0 ? 'ALL PASS' : `FAILS: ${fails}, errors ${errs.length}`)
  writeFileSync(OUT + 'probe-output.txt', log.join('\n') + '\n')
  await browser.close()
}
