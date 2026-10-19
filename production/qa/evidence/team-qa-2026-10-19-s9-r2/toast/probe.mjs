// /team-qa Sprint 9 re-run (r2) probe for case R4-d (pointer-open Settings, Escape close) and R8-c (Space with a tutorial toast), derived from extra/probe.mjs, whose rows are R2 (Space regression
// set), R5 (Tab reachability on the Menu from page start) and R9 (Settings
// persistence from the Menu). Strategy:
// production/qa/qa-strategy-sprint-009-2026-10-19-r2.md.
// Headless Chrome for Testing at 1280x720 against a vite dev server. Real
// keyboard and pointer input. State is read only, through missionStore,
// appStore and runtime. Harness assists, named: localStorage clear; the jump
// to a live mission through the app store (Team Deploy -> startMission,
// MISSIONS[0] = GLASS VEIL, Standard, fresh campaign); R2-b blurs the focused
// element with JS to reach "nothing focused while paused".
//
// Run: npm run dev -- --strictPort      (port 4200)
//      SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9-r2/extra/probe.mjs
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
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage()
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

const facts = () =>
  page.evaluate(async () => {
    const ms = (await import('/src/state/missionStore.ts')).useMissionStore.getState()
    const app = (await import('/src/state/appStore.ts')).useAppStore.getState()
    const rt = await import('/src/game/runtime.ts')
    const w = rt.getWorld()
    const a = document.activeElement
    const setDlg = document.querySelector('[role="dialog"][aria-label="Settings"]')
    return {
      phase: app.phase,
      outcome: app.outcome,
      paused: ms.paused,
      time: w ? +w.time.toFixed(3) : null,
      dialogs: [...document.querySelectorAll('[role="dialog"]')].map((d) => d.getAttribute('aria-label')),
      abort: document.querySelector('.hud-btn.abort')?.textContent ?? null,
      isBody: a === document.body,
      focused: a ? (a.getAttribute('aria-label') ?? (a.textContent || a.tagName).trim().slice(0, 40)) : null,
      focusInSettings: !!(setDlg && setDlg.contains(a)),
    }
  })
const opener = '[aria-label^="OPEN SETTINGS"]'
const toastTitle = () => page.evaluate(() => [...document.querySelectorAll('.hud-toast[role="status"] [aria-label^="Dismiss tutorial step"]')].map((b) => b.getAttribute('aria-label')))
try {
  // R4-d: pointer open, Escape close
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector(opener, { timeout: 30000 })
  await wait(800)
  await page.locator(opener).click()
  await wait(400)
  await page.keyboard.press('Escape')
  await wait(400)
  let f = await facts()
  check('R4-d pointer-open, Escape close: focus on SETTINGS', /^OPEN SETTINGS/.test(f.focused ?? '') && !f.isBody, f.focused)
  // R8-c: live mission with a tutorial toast
  await page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { MISSIONS, DEFAULT_SQUAD } = await import('/src/game/data.ts')
    useAppStore.setState({ phase: 'team', missionId: MISSIONS[0].id, squad: [...DEFAULT_SQUAD] })
    useAppStore.getState().startMission()
  })
  await page.waitForSelector('.hud-btn.pause', { timeout: 30000 })
  await wait(4000)
  await page.mouse.click(640, 400)
  await wait(200)
  const s0 = await toastTitle()
  f = await facts()
  note('R8-c step 1: ' + J({ toast: s0, paused: f.paused, t: f.time, focused: f.focused }))
  check('R8-c precondition: a tutorial toast is shown, not paused', s0.length > 0 && !f.paused, J(s0))
  await page.keyboard.press('Space')
  await wait(500)
  f = await facts()
  const s2 = await toastTitle()
  await shot('space-toast-01-paused')
  check('R8-c step 2: Space pauses, toast step unchanged', f.paused && f.dialogs.includes('Mission paused') && J(s2) === J(s0), J({ paused: f.paused, toast: s2 }))
  await page.locator('[role="dialog"][aria-label="Mission paused"] button', { hasText: 'RESUME' }).focus()
  await page.evaluate(() => { document.activeElement?.blur?.() })
  const t3 = f.time
  await page.keyboard.press('Space')
  await wait(1000)
  f = await facts()
  const s3 = await toastTitle()
  check('R8-c step 3: Space resumes, time advances, same toast step', !f.paused && f.time > t3 && J(s3) === J(s0), J({ paused: f.paused, t: [t3, f.time], toast: s3 }))
  // step 4: observation only
  let reached = false
  for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); await wait(30); const g = await facts(); if (/^Dismiss tutorial step/.test(g.focused ?? '')) { reached = true; break } }
  const b4 = await facts()
  await page.keyboard.press('Space')
  await wait(1000)
  const a4 = await facts()
  const s4 = await toastTitle()
  await shot('space-toast-02-step4')
  note('R8-c step 4 (observation): ' + J({ reachedDismissByTab: reached, before: { focused: b4.focused, paused: b4.paused, toast: s3 }, after: { paused: a4.paused, dialogs: a4.dialogs, focused: a4.focused, toast: s4 } }))
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
} finally {
  note(`errors: ${J(errs)}`)
  note(fails === 0 && errs.length === 0 ? 'ALL PASS' : `FAILS: ${fails}, errors ${errs.length}`)
  writeFileSync(OUT + 'probe-output.txt', log.join('\n') + '\n')
  await browser.close()
}
