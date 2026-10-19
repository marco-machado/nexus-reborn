// BUG-0001 fix re-run of the IF-008 /team-qa 2026-10-19 probe (copied from
// production/qa/evidence/team-qa-2026-10-19-s9/if-008/probe.mjs), cases TC-01,
// TC-04, TC-05 and TC-06 of
// production/qa/test-cases/if-008-pause-two-step-abort-cases.md. TC-06 now
// covers every Settings volume slider, then checks Space still toggles pause
// once Settings and the pause menu are closed.
// Headless Chrome for Testing at 1280x720 against a vite dev server. Real
// keyboard and pointer input throughout. State is read only, through
// missionStore, appStore and runtime (getWorld, getCameraFocus,
// getCameraFootprint). Harness assists, named: localStorage clear; the jump
// to a live mission through the app store (Team Deploy -> startMission,
// MISSIONS[0] = GLASS VEIL, Standard, fresh campaign).
//
// Run: npm run dev -- --strictPort      (port 4200)
//      SWEEP_URL=http://localhost:4200/ node production/qa/evidence/bug-0001-fix-2026-10-19/probe.mjs
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

const facts = () =>
  page.evaluate(async () => {
    const ms = (await import('/src/state/missionStore.ts')).useMissionStore.getState()
    const app = (await import('/src/state/appStore.ts')).useAppStore.getState()
    const rt = await import('/src/game/runtime.ts')
    const w = rt.getWorld()
    const f = rt.getCameraFocus()
    const fp = rt.getCameraFootprint()
    const a = document.activeElement
    const pauseDlg = document.querySelector('[role="dialog"][aria-label="Mission paused"]')
    const setDlg = document.querySelector('[role="dialog"][aria-label="Settings"]')
    return {
      phase: app.phase,
      outcome: app.outcome,
      paused: ms.paused,
      result: ms.result,
      time: w ? +w.time.toFixed(3) : null,
      focus: f ? [+f.x.toFixed(3), +f.z.toFixed(3)] : null,
      footprint: fp ? fp.map((p) => [+p.x.toFixed(2), +p.z.toFixed(2)]) : null,
      dialogs: [...document.querySelectorAll('[role="dialog"]')].map((d) => d.getAttribute('aria-label')),
      abort: document.querySelector('.hud-btn.abort')?.textContent ?? null,
      focused: a ? (a.getAttribute('aria-label') ?? (a.textContent || a.tagName).trim().slice(0, 40)) : null,
      focusedType: a && a.tagName === 'INPUT' ? a.type : a ? a.tagName : null,
      focusedValue: a && a.tagName === 'INPUT' ? a.value : null,
      focusInPause: !!(pauseDlg && pauseDlg.contains(a)),
      focusInSettings: !!(setDlg && setDlg.contains(a)),
    }
  })
const resume = () => page.locator('[role="dialog"][aria-label="Mission paused"] button', { hasText: 'RESUME' })

try {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1500)
  await page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { MISSIONS, DEFAULT_SQUAD } = await import('/src/game/data.ts')
    useAppStore.setState({ phase: 'team', missionId: MISSIONS[0].id, squad: [...DEFAULT_SQUAD] })
    useAppStore.getState().startMission()
  })
  await page.waitForSelector('.hud-btn.pause', { timeout: 30000 })
  await wait(4000)
  let f = await facts()
  check('fixture: live mission, no result', f.phase === 'mission' && f.result === 'none' && !f.paused && f.outcome === null, J(f))

  // ---------- TC-01: Space pauses; sim and camera freeze; Resume ----------
  await page.mouse.click(640, 400)
  await wait(200)
  await page.keyboard.press('Space')
  await wait(400)
  f = await facts()
  check('TC-01 Space opens pause', f.paused && f.dialogs.includes('Mission paused'), J({ paused: f.paused, dialogs: f.dialogs }))
  await shot('probe-01-space-pause')
  const c0 = await facts()
  // Pan keys held, then a drag on the main view outside the modal.
  for (const k of ['KeyW', 'KeyD', 'ArrowUp']) { await page.keyboard.down(k); await wait(400); await page.keyboard.up(k) }
  await page.mouse.move(120, 650)
  await page.mouse.down()
  await page.mouse.move(320, 560, { steps: 10 })
  await page.mouse.up()
  await wait(1000)
  const c1 = await facts()
  check('TC-01 sim time frozen while paused', c1.time === c0.time, `t ${c0.time} -> ${c1.time}`)
  check('TC-01 camera focus frozen while paused', J(c1.focus) === J(c0.focus), `${J(c0.focus)} -> ${J(c1.focus)}`)
  check('TC-01 camera footprint frozen while paused', J(c1.footprint) === J(c0.footprint))
  check('TC-01 still paused after pan keys and drag', c1.paused && c1.dialogs.includes('Mission paused'))
  await resume().click()
  await wait(1000)
  const c2 = await facts()
  check('TC-01 Resume unpauses and the sim advances', !c2.paused && c2.time > c1.time && c2.dialogs.length === 0, `paused ${c2.paused}, t ${c1.time} -> ${c2.time}`)
  // Control: the same pan key moves the camera when not paused.
  await page.keyboard.down('KeyW'); await wait(500); await page.keyboard.up('KeyW'); await wait(300)
  const c3 = await facts()
  check('TC-01 control: pan key moves the camera when live', J(c3.focus) !== J(c2.focus), `${J(c2.focus)} -> ${J(c3.focus)}`)

  // ---------- TC-04: lapse, then the next press only re-arms ----------
  await page.keyboard.press('Escape')
  await wait(400)
  await page.locator('.hud-btn.abort').click()
  await wait(300)
  f = await facts()
  check('TC-04 first press arms', f.abort === 'CONFIRM?' && f.phase === 'mission' && f.paused, J({ abort: f.abort, phase: f.phase }))
  await wait(3400)
  f = await facts()
  check('TC-04 lapse disarms, still paused', f.abort === 'ABORT' && f.paused && f.phase === 'mission', J({ abort: f.abort, paused: f.paused }))
  await page.locator('.hud-btn.abort').click()
  await wait(50)
  const r0 = await facts()
  await wait(500)
  const r1 = await facts()
  check('TC-04 next press after the lapse only re-arms', r0.abort === 'CONFIRM?' && r0.phase === 'mission' && r0.outcome === null && r1.phase === 'mission' && r1.abort === 'CONFIRM?', J({ at0: [r0.abort, r0.phase, r0.outcome], at500: [r1.abort, r1.phase, r1.outcome] }))
  await shot('probe-04-rearmed-after-lapse')
  await wait(3400) // let the re-arm lapse so nothing aborts below

  // ---------- TC-05: Settings from pause stays frozen; close focuses pause ----------
  const t5 = (await facts()).time
  await page.getByRole('button', { name: 'Open settings' }).click()
  await wait(600)
  f = await facts()
  check('TC-05 Settings open inside the freeze', f.paused && f.dialogs.includes('Settings') && f.time === t5, J({ paused: f.paused, dialogs: f.dialogs, t: [t5, f.time] }))
  await page.keyboard.press('Escape')
  await wait(400)
  f = await facts()
  check('TC-05 close returns to pause with focus inside it', f.dialogs.includes('Mission paused') && f.focusInPause && f.time === t5, J({ dialogs: f.dialogs, focused: f.focused, focusInPause: f.focusInPause }))

  // ---------- TC-06 PROBE: Space on a focused volume slider ----------
  await page.getByRole('button', { name: 'Open settings' }).click()
  await wait(600)
  const sliderCount = await page.locator('[role="dialog"][aria-label="Settings"] input[type="range"]').count()
  const seen = []
  for (let i = 0; i < 60 && seen.length < sliderCount; i++) {
    await page.keyboard.press('Tab')
    await wait(40)
    const found = await facts()
    if (found.focusedType !== 'range' || seen.includes(found.focused)) continue
    seen.push(found.focused)
    if (seen.length === 1) await shot('probe-06a-slider-focused')
    await page.keyboard.press('Space')
    await wait(1000)
    const g = await facts()
    note(`TC-06 ${found.focused} before Space: ` + J({ paused: found.paused, dialogs: found.dialogs, t: found.time, value: found.focusedValue }))
    note(`TC-06 ${found.focused} after Space:  ` + J({ paused: g.paused, dialogs: g.dialogs, t: g.time, focused: g.focused, value: g.focusedValue }))
    if (seen.length === 1) await shot('probe-06b-after-space')
    check(`TC-06 ${found.focused}: still paused`, g.paused === true)
    check(`TC-06 ${found.focused}: Settings still mounted`, g.dialogs.includes('Settings'), J(g.dialogs))
    check(`TC-06 ${found.focused}: sim time unchanged`, g.time === found.time, `t ${found.time} -> ${g.time}`)
    check(`TC-06 ${found.focused}: focus unchanged`, g.focusInSettings && g.focused === found.focused, g.focused)
  }
  check('TC-06 every volume slider reached by Tab', sliderCount === 5 && seen.length === sliderCount, `${seen.length} of ${sliderCount}: ${J(seen)}`)

  // ---------- TC-06 regression: Space with no dialog control still toggles ----------
  await page.keyboard.press('Escape')
  await wait(400)
  await resume().click()
  await wait(600)
  await page.mouse.click(640, 400)
  await wait(200)
  await page.keyboard.press('Space')
  await wait(400)
  f = await facts()
  check('TC-06 regression: Space on the live mission still pauses', f.paused && f.dialogs.includes('Mission paused'), J({ paused: f.paused, dialogs: f.dialogs }))
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
} finally {
  note(`errors: ${J(errs)}`)
  note(fails === 0 && errs.length === 0 ? 'ALL PASS' : `FAILS: ${fails}, errors ${errs.length}`)
  writeFileSync(OUT + 'probe-output.txt', log.join('\n') + '\n')
  await browser.close()
}
