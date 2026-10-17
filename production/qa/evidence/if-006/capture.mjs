// IF-006 capture: Menu in three states (never-started, unreadable, valid), armed
// New Operation, and Balance reached with recording off, at 1280x720 and text
// scale 125 (the maximum), in headless Chrome for Testing against a vite dev server.
// Real UI input drives the Menu clicks, the arm, and the Settings -> Balance path.
// Harness assists, named: localStorage seeding (a bad blob, a valid save via
// writeSave, telemetry records via saveRecords, text scale / telemetry via
// the settings store) and reading results back.
//
// Run: PORT=4206 npm run dev   then   SWEEP_URL=http://localhost:4206/ node production/qa/evidence/if-006/capture.mjs
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
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const log = []
let fails = 0
const note = (s) => { log.push(s); console.log(s) }
const check = (name, ok, detail = '') => { if (!ok) fails++; note(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' // ' + detail : ''}`) }

async function fresh(seed) {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  if (seed) await page.evaluate(seed)
  await page.reload()
  await wait(1500)
}
const setScale = () =>
  page.evaluate(async () => {
    const S = (await import('/src/state/settingsStore.ts')).useSettingsStore.getState()
    S.setTextScale(125)
  })
const menuFacts = () =>
  page.evaluate(() => ({
    cont: !!document.querySelector('[aria-label^="CONTINUE SAVED"]'),
    line: document.querySelector('.menu-save-line')?.textContent ?? null,
    invalid: document.querySelector('.menu-save-line')?.hasAttribute('data-invalid') ?? false,
    status: document.querySelector('.screen.menu')?.getAttribute('data-save-status'),
  }))

// 1. never-started
await fresh()
await setScale()
await wait(300)
let f = await menuFacts()
check('never-started: Continue absent', !f.cont)
check('never-started: line', f.line === 'NO CAMPAIGN ON FILE', f.line)
await shot('01-menu-never-started-scale125')

// 2. unreadable blob
await fresh(async () => {
  const { SAVE_KEY } = await import('/src/state/save.ts')
  localStorage.setItem(SAVE_KEY, '{not json')
})
await setScale()
await wait(300)
f = await menuFacts()
check('unreadable: Continue absent', !f.cont)
check('unreadable: visible reason distinct', f.line === 'SAVE UNREADABLE // DROPPED' && f.invalid, f.line)
await shot('02-menu-unreadable-scale125')

// 3. valid save
await fresh(async () => {
  const S = await import('/src/state/save.ts');
  (await import('/src/state/appStore.ts')).useAppStore.setState({ credits: 12345 })
  S.writeSave(localStorage)
})
await setScale()
await wait(300)
f = await menuFacts()
check('valid: Continue present', f.cont)
check('valid: line', f.line === 'CAMPAIGN ON FILE', f.line)
await shot('03-menu-valid-scale125')

// 4. armed New Operation: first press arms, blob untouched
const before = await page.evaluate(async () => localStorage.getItem((await import('/src/state/save.ts')).SAVE_KEY))
await page.locator('button.menu-new').click()
await wait(300)
const after = await page.evaluate(async () => localStorage.getItem((await import('/src/state/save.ts')).SAVE_KEY))
const armedLabel = await page.locator('button.menu-new').innerText()
check('armed: first press arms, blob unchanged', before !== null && before === after, armedLabel)
check('armed: button says confirm', /CONFIRM/.test(armedLabel))
await shot('04-menu-new-operation-armed-scale125')
await wait(3300)
check('armed: window expiry disarms', !/CONFIRM/.test(await page.locator('button.menu-new').innerText()))

// 5. Balance reachable with recording off and a nonempty log
await fresh(async () => {
  const T = await import('/src/state/telemetry.ts')
  T.saveRecords([
    { at: 1, missionId: 'm01', outcome: 'aborted', durationSec: 12, seed: 20870514, squadRoles: ['assault'] },
    { at: 2, missionId: 'm01', outcome: 'aborted', durationSec: 30, seed: 20870514, squadRoles: ['assault', 'recon'] },
  ], localStorage)
})
await page.evaluate(async () => {
  const S = (await import('/src/state/settingsStore.ts')).useSettingsStore.getState()
  S.setTextScale(125)
  S.setTelemetry(false)
})
await wait(300)
await page.getByRole('button', { name: /OPEN SETTINGS/ }).click()
await wait(500)
const open = page.locator('[aria-label="Open the balance dashboard"]')
check('Balance entry reachable while recording off', (await open.count()) === 1)
await open.click()
await wait(600)
const rec = await page.evaluate(async () => (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().telemetry)
check('recording is off in Balance view', rec === false)
await shot('05-balance-recording-off-scale125')

check('no page or console errors', errs.length === 0, errs.join(' | '))
note(fails ? `${fails} FAILED` : 'ALL PASS')
writeFileSync(OUT + 'capture-output.txt', log.join('\n') + '\n')
await browser.close()
process.exit(fails ? 1 : 0)
