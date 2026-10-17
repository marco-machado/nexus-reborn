// IF-007 capture: mission HUD minimap (Standard vs Hardened, three zoom levels,
// click steers the camera), the nine first-mission tutorial toasts (with a
// remap shown live), and the weather chip before/after GLASS VEIL's scripted
// front. Headless Chrome for Testing at 1280x720 against a vite dev server.
// Harness assists, named: localStorage clear; jump to a live mission through
// the app store (Team Deploy -> startMission, MISSIONS[0] = GLASS VEIL,
// default squad); difficulty set through settingsStore.setDifficulty; the
// holdGround remap through settingsStore.setBindingOverride (the action the
// Settings rebind calls); extra world.tick() calls to reach the front at
// sim 150 s. Toast dismissals and the minimap zoom/click are real pointer input.
//
// Run: npm run dev -- --strictPort --port 4217
//      SWEEP_URL=http://localhost:4217/ node production/qa/evidence/if-007/capture.mjs
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
const URL = process.env.SWEEP_URL || 'http://localhost:4217/'
const OUT = new globalThis.URL('.', import.meta.url).pathname

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const mmShot = (name) => page.locator('.minimap-canvas').screenshot({ path: `${OUT}${name}.png` })
const log = []
let fails = 0
const note = (s) => { log.push(s); console.log(s) }
const check = (name, ok, detail = '') => { if (!ok) fails++; note(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' // ' + detail : ''}`) }

const facts = () =>
  page.evaluate(async () => {
    const ms = (await import('/src/state/missionStore.ts')).useMissionStore.getState()
    const rt = await import('/src/game/runtime.ts')
    const P = await import('/src/game/missionParams.ts')
    const S = (await import('/src/state/settingsStore.ts')).useSettingsStore.getState()
    const w = rt.getWorld()
    const chips = [...document.querySelectorAll('.hud-top-left .chip')].map((c) => c.textContent)
    const toast = document.querySelector('.hud-toast:not(.hint) .hud-toast-head b')?.textContent ?? null
    const body = document.querySelector('.hud-toast:not(.hint) .hud-toast-body')?.textContent ?? null
    const f = rt.getCameraFocus()
    const enemies = w ? w.units.filter((u) => u.kind === 'enemy' && u.stance !== 'dead') : []
    return {
      difficulty: S.difficulty,
      paused: ms.paused,
      time: w ? +w.time.toFixed(2) : null,
      weather: w ? w.weather : null,
      weatherLabel: w ? P.WEATHER_LABEL[w.weather] : null,
      chips,
      toast,
      body,
      focus: f ? { x: +f.x.toFixed(2), z: +f.z.toFixed(2) } : null,
      selected: [...ms.selected],
      civilians: w ? w.units.filter((u) => u.kind === 'civilian' && u.stance !== 'dead').length : 0,
      enemies: enemies.length,
      patrolling: enemies.filter((u) => (u.patrol?.length ?? 0) > 0).length,
      frontLines: ms.log.filter((e) => e.msg.startsWith('WEATHER FRONT')).map((e) => e.t + ' ' + e.msg),
      commLog: [...document.querySelectorAll('.hud-comms-body .hud-log')].map((d) => d.textContent),
    }
  })

async function startMission(difficulty) {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1500)
  await page.evaluate(async (difficulty) => {
    ;(await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setDifficulty(difficulty)
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { MISSIONS, DEFAULT_SQUAD } = await import('/src/game/data.ts')
    useAppStore.setState({ phase: 'team', missionId: MISSIONS[0].id, squad: [...DEFAULT_SQUAD] })
    useAppStore.getState().startMission()
  }, difficulty)
  await page.waitForSelector('.minimap-canvas', { timeout: 30000 })
  await wait(4000)
}

try {
  // ---------------- Standard: minimap, toasts, weather ----------------
  await startMission('standard')
  let f = await facts()
  check('standard mission live', f.difficulty === 'standard' && f.time > 0 && !f.paused, JSON.stringify({ d: f.difficulty, t: f.time }))
  note('standard minimap contents ' + JSON.stringify({ civilians: f.civilians, enemies: f.enemies, patrolling: f.patrolling }))
  const std = f

  // Weather chip before the front.
  check('weather chip matches live weather before front', f.chips.includes(f.weatherLabel), `${f.weather} -> chips ${JSON.stringify(f.chips)}`)
  await shot('01-standard-hud-weather-before-front')

  // Three zoom levels: the HUD opens at max; step out twice.
  const zin = page.locator('[aria-label="Zoom minimap in"]')
  const zout = page.locator('[aria-label="Zoom minimap out"]')
  check('zoom starts at max (in disabled)', await zin.isDisabled())
  await mmShot('02-minimap-zoom-3-standard')
  await zout.click(); await wait(300)
  await mmShot('03-minimap-zoom-2-standard')
  await zout.click(); await wait(300)
  check('zoom bottoms out after two steps (out disabled)', await zout.isDisabled())
  await mmShot('04-minimap-zoom-1-standard')

  // Click on the minimap steers the camera.
  const box = await page.locator('.minimap-canvas').boundingBox()
  const before = (await facts()).focus
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.5)
  await wait(600)
  const afterClick = (await facts()).focus
  check('minimap click moves camera focus', JSON.stringify(before) !== JSON.stringify(afterClick), `${JSON.stringify(before)} -> ${JSON.stringify(afterClick)}`)
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.4, { steps: 8 })
  await page.mouse.up()
  await wait(600)
  const afterDrag = (await facts()).focus
  check('minimap drag moves camera focus', JSON.stringify(afterClick) !== JSON.stringify(afterDrag), `${JSON.stringify(afterClick)} -> ${JSON.stringify(afterDrag)}`)
  await zin.click(); await zin.click(); await wait(300)

  // Toasts: first step up on a fresh campaign; the sim runs under it and
  // keyboard input still lands.
  f = await facts()
  const t0 = f.time
  await wait(1200)
  const f1 = await facts()
  check('sim runs while a toast is up', f1.time > t0 && !f1.paused && f1.toast !== null, `t ${t0} -> ${f1.time}, toast ${f1.toast}`)
  await page.mouse.click(640, 300); await wait(150)
  await page.keyboard.press('Digit1'); await wait(300)
  const f2 = await facts()
  check('keyboard select lands under the toast', f2.selected.length === 1, JSON.stringify(f2.selected))
  // A pointer press on the card body (not its buttons) must reach the canvas,
  // which is the only target src/scene/Input.tsx accepts for select/marquee.
  const tb = await page.locator('.hud-toast:not(.hint) .hud-toast-body').boundingBox()
  const px = tb.x + tb.width / 2, py = tb.y + tb.height / 2
  const hitUnder = await page.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y)
    window.__canvasDowns = 0
    const cv = document.querySelector('canvas')
    cv.addEventListener('pointerdown', (e) => { if (e.target === cv) window.__canvasDowns++ })
    return el ? el.tagName : null
  }, [px, py])
  await page.mouse.click(px, py); await wait(200)
  const downs = await page.evaluate(() => window.__canvasDowns)
  const fUnder = await facts()
  check('world click under a toast reaches the canvas', hitUnder === 'CANVAS' && downs === 1 && fUnder.toast !== null, `elementFromPoint ${hitUnder}, canvas pointerdowns ${downs}, toast ${fUnder.toast}`)

  const want = ['SELECTION', 'MOVEMENT', 'ENGAGEMENT', 'STANCES', 'ROLE ABILITY', 'ITEMS', 'WEAPON SWAP', 'DIRECTIVES', 'EXTRACTION']
  // Whichever steps the select press already advanced are not reshown;
  // dismiss back to a fresh pointer via the store reset to show all nine.
  await page.evaluate(async () => (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().resetAll())
  await wait(300)
  for (let i = 0; i < want.length; i++) {
    f = await facts()
    check(`toast ${i + 1} ${want[i]}`, (f.toast ?? '').endsWith(want[i]), `${f.toast} // ${f.body}`)
    if (want[i] === 'STANCES') {
      await page.evaluate(async () =>
        (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setBindingOverride('holdGround', ['KeyJ']),
      )
      await wait(300)
      const r = await facts()
      check('stances toast names the remapped key', /^J holds position/.test(r.body ?? ''), r.body)
    }
    await shot(`${String(5 + i).padStart(2, '0')}-toast-${i + 1}-${want[i].toLowerCase().replace(/ /g, '-')}`)
    await page.locator('.hud-toast:not(.hint) [aria-label^="Dismiss tutorial step"]').click()
    await wait(300)
  }
  f = await facts()
  check('no tutorial toast after the ninth', f.toast === null)
  // Skip Tutorial from step 1 marks all seen.
  await page.evaluate(async () => (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().resetAll())
  await wait(300)
  await page.locator('[aria-label="Skip the whole tutorial"]').click()
  await wait(300)
  const seen = await page.evaluate(async () => {
    const T = await import('/src/game/tutorial.ts')
    const s = (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().seen
    return T.TUTORIAL_IDS.every((id) => s.includes(id))
  })
  f = await facts()
  check('SKIP TUTORIAL marks every step seen and clears the toast', seen && f.toast === null)

  // Weather front: fast-forward the sim to the scripted 150 s.
  await page.evaluate(async () => {
    const w = (await import('/src/game/runtime.ts')).getWorld()
    while (w.time < 151) w.tick(0.05)
  })
  await wait(800)
  f = await facts()
  check('front hit: weather changed', f.weather !== std.weather, `${std.weather} -> ${f.weather}`)
  check('weather chip matches live weather after front', f.chips.includes(f.weatherLabel), `${f.weather} -> chips ${JSON.stringify(f.chips)}`)
  check('comm log prints the front line', f.frontLines.length === 1 && f.commLog.some((l) => l.includes('WEATHER FRONT')), JSON.stringify(f.frontLines))
  await shot('14-standard-hud-weather-after-front')

  // ---------------- Hardened: same contract, same minimap content ----------------
  await startMission('hardened')
  f = await facts()
  check('hardened mission live', f.difficulty === 'hardened' && f.time > 0)
  note('hardened minimap contents ' + JSON.stringify({ civilians: f.civilians, enemies: f.enemies, patrolling: f.patrolling }))
  check('hardened keeps civilians and patrols on the same contract', f.civilians > 0 && f.patrolling > 0, '')
  // Pulse Scan paints every guard's cone on either difficulty.
  await page.mouse.click(640, 300); await wait(150)
  await page.keyboard.press('Digit2'); await wait(200)
  await page.keyboard.press('KeyQ'); await wait(800)
  await mmShot('15-minimap-hardened-scan-cones')
  await shot('16-hardened-hud')
  const src = await page.evaluate(async () => (await fetch('/src/ui/Minimap.tsx')).text())
  check('minimap draw code never reads difficulty', !/difficulty|hardened/i.test(src))
} finally {
  note(`errors: ${JSON.stringify(errs)}`)
  note(fails === 0 && errs.length === 0 ? 'ALL PASS' : `FAILS: ${fails}`)
  writeFileSync(OUT + 'capture-output.txt', log.join('\n') + '\n')
  await browser.close()
}
