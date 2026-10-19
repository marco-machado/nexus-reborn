// /team-qa Sprint 9 re-run (r2) probe for strategy rows R2 (Space regression
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
const pauseDlg = '[role="dialog"][aria-label="Mission paused"]'
const setDlg = '[role="dialog"][aria-label="Settings"]'
const opener = '[aria-label^="OPEN SETTINGS"]'
const muteToggle = () => page.locator(`${setDlg} [aria-label^="MUTE //"]`)

async function freshMenu() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector(opener, { timeout: 30000 })
  await wait(800)
}

async function liveMission() {
  await freshMenu()
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
}

try {
  // ================= R5: Tab reachability from page start =================
  await freshMenu()
  await page.evaluate(() => { document.activeElement?.blur?.() })
  const order = []
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    await wait(30)
    const f = await facts()
    if (f.isBody) continue
    if (order.includes(f.focused)) break
    order.push(f.focused)
  }
  note('R5 Tab order from page start: ' + J(order))
  check('R5 Menu SETTINGS reachable by Tab from page start', order.some((l) => /^OPEN SETTINGS/.test(l ?? '')), J(order))
  check('R5 more than one Menu control reachable', order.length >= 2, `${order.length}`)
  // After a close: open, Escape, then Tab onward still reaches the Menu controls.
  await page.locator(opener).focus()
  await page.keyboard.press('Enter')
  await wait(400)
  await page.keyboard.press('Escape')
  await wait(400)
  let f = await facts()
  check('R5 after close focus is on SETTINGS', /^OPEN SETTINGS/.test(f.focused ?? ''), f.focused)
  const after = []
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab')
    await wait(30)
    const g = await facts()
    if (g.isBody) continue
    if (after.includes(g.focused)) break
    after.push(g.focused)
  }
  note('R5 Tab order after close: ' + J(after))
  check('R5 Tab after close cycles back through Menu controls', after.length >= 2 && after.some((l) => /^OPEN SETTINGS/.test(l ?? '')), J(after))
  await shot('r5-menu-tab-after-close')

  // ================= R9: Settings persistence from the Menu =================
  await page.locator(opener).focus()
  await page.keyboard.press('Enter')
  await wait(400)
  const music = page.locator(`${setDlg} input[aria-label="MUSIC volume"]`)
  const music0 = await music.inputValue()
  await music.focus()
  await page.keyboard.press('Home')
  for (let i = 0; i < 100 && Number(await music.inputValue()) < 40; i++) await page.keyboard.press('ArrowRight')
  const musicSet = await music.inputValue()
  const mute0 = await muteToggle().getAttribute('aria-label')
  if (/OFF$/.test(mute0 ?? '')) { await muteToggle().focus(); await page.keyboard.press('Enter'); await wait(150) }
  const muteSet = await muteToggle().getAttribute('aria-label')
  note('R9 set: ' + J({ music0, musicSet, mute0, muteSet }))
  await shot('r9-settings-set')
  await page.keyboard.press('Escape')
  await wait(400)
  f = await facts()
  check('R9 close returns focus to SETTINGS', /^OPEN SETTINGS/.test(f.focused ?? ''), f.focused)
  await page.reload()
  await page.waitForSelector(opener, { timeout: 30000 })
  await wait(800)
  await page.locator(opener).focus()
  await page.keyboard.press('Enter')
  await wait(400)
  const musicAfter = await music.inputValue()
  const muteAfter = await muteToggle().getAttribute('aria-label')
  await shot('r9-settings-after-reload')
  check('R9 MUSIC value persists across reload', musicAfter === musicSet && musicSet !== music0, J({ music0, musicSet, musicAfter }))
  check('R9 MUTE ON persists across reload', /ON$/.test(muteAfter ?? ''), muteAfter)
  await page.keyboard.press('Escape')

  // ================= R2: Space regression set =================
  await liveMission()
  // R2-a: Space on a focused dialog button activates that button only.
  await page.keyboard.press('Space')
  await wait(400)
  await page.getByRole('button', { name: 'Open settings' }).click()
  await wait(600)
  const muteBefore = await muteToggle().getAttribute('aria-label')
  await muteToggle().focus()
  const t0 = (await facts()).time
  await page.keyboard.press('Space')
  await wait(800)
  const muteAfterSpace = await muteToggle().getAttribute('aria-label')
  f = await facts()
  check('R2-a Space on focused MUTE toggles MUTE', muteAfterSpace !== muteBefore, `${muteBefore} -> ${muteAfterSpace}`)
  check('R2-a Space on focused MUTE leaves the mission paused with Settings open', f.paused && f.dialogs.includes('Settings') && f.time === t0, J({ paused: f.paused, dialogs: f.dialogs, t: [t0, f.time] }))
  await muteToggle().focus()
  await page.keyboard.press('Space') // restore
  await wait(200)
  // R2-c: Escape from a focused slider closes Settings back to the pause modal.
  await page.locator(`${setDlg} input[aria-label="MASTER volume"]`).focus()
  await page.keyboard.press('Escape')
  await wait(400)
  f = await facts()
  check('R2-c Escape from focused slider returns to the pause modal, still paused', f.paused && !f.dialogs.includes('Settings') && f.dialogs.includes('Mission paused'), J({ paused: f.paused, dialogs: f.dialogs, focused: f.focused }))
  // R2-d: Abort arm, then Settings, Space on a slider: the arm is not confirmed.
  await page.locator('.hud-btn.abort').click()
  await wait(200)
  const armed = (await facts()).abort
  await page.getByRole('button', { name: 'Open settings' }).click()
  await wait(400)
  await page.locator(`${setDlg} input[aria-label="MASTER volume"]`).focus()
  await page.keyboard.press('Space')
  await wait(600)
  f = await facts()
  note('R2-d state: ' + J({ armed, after: f }))
  check('R2-d Space on a slider with Abort armed does not abort', armed === 'CONFIRM?' && f.phase === 'mission' && f.outcome === null && f.paused, J({ armed, phase: f.phase, outcome: f.outcome, paused: f.paused }))
  await page.keyboard.press('Escape')
  await wait(3600) // let any arm lapse
  // R2-a (RESUME): Space on a focused RESUME resumes once.
  await page.locator(`${pauseDlg} button`, { hasText: 'RESUME' }).focus()
  const t1 = (await facts()).time
  await page.keyboard.press('Space')
  await wait(1000)
  f = await facts()
  check('R2-a Space on focused RESUME resumes and does not re-pause', !f.paused && f.dialogs.length === 0 && f.time > t1, J({ paused: f.paused, dialogs: f.dialogs, t: [t1, f.time] }))
  // R2-b: Space with nothing focused, live -> pauses; paused with nothing focused -> resumes.
  await page.evaluate(() => { document.activeElement?.blur?.() })
  await page.keyboard.press('Space')
  await wait(400)
  f = await facts()
  check('R2-b Space with nothing focused on a live mission pauses', f.paused && f.dialogs.includes('Mission paused'), J({ paused: f.paused, dialogs: f.dialogs }))
  await page.evaluate(() => { document.activeElement?.blur?.() })
  await page.keyboard.press('Space')
  await wait(600)
  f = await facts()
  note('R2-b paused, nothing focused, after Space (observation): ' + J({ paused: f.paused, dialogs: f.dialogs, focused: f.focused }))
  check('R2-b Space with nothing focused while paused resumes', !f.paused && f.dialogs.length === 0, J({ paused: f.paused, dialogs: f.dialogs }))
  await shot('r2-final')
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
} finally {
  note(`errors: ${J(errs)}`)
  note(fails === 0 && errs.length === 0 ? 'ALL PASS' : `FAILS: ${fails}, errors ${errs.length}`)
  writeFileSync(OUT + 'probe-output.txt', log.join('\n') + '\n')
  await browser.close()
}
