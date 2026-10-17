// IF-008 capture: mission pause modal, Abort armed, Abort lapsed (still paused),
// Settings opened from pause with a remap shown on return, and Abort confirm,
// at 1280x720 in headless Chrome for Testing against a vite dev server.
// Real keyboard/pointer input drives Escape/Space, the Abort presses, Settings
// and the rebind capture. Harness assists, named: localStorage clear, and the
// jump to a live mission through the app store (Team Deploy -> startMission).
//
// Run: PORT=4208 npm run dev -- --strictPort --port 4208
//      SWEEP_URL=http://localhost:4208/ node production/qa/evidence/if-008/capture.mjs
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

const facts = () =>
  page.evaluate(async () => {
    const ms = (await import('/src/state/missionStore.ts')).useMissionStore.getState()
    const app = (await import('/src/state/appStore.ts')).useAppStore.getState()
    const w = (await import('/src/game/runtime.ts')).getWorld()
    return {
      phase: app.phase,
      outcome: app.outcome,
      paused: ms.paused,
      result: ms.result,
      time: w ? w.time : null,
      dialog: document.querySelector('[role="dialog"]')?.getAttribute('aria-label') ?? null,
      abort: document.querySelector('.hud-btn.abort')?.textContent ?? null,
      hint: document.querySelector('.pause-arm-hint')?.textContent ?? null,
      saveKeys: Object.keys(localStorage),
    }
  })

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
check('live mission, no result', f.phase === 'mission' && f.result === 'none' && !f.paused, JSON.stringify(f))

// Escape opens the pause modal and freezes the sim.
await page.mouse.click(640, 400)
await wait(200)
await page.keyboard.press('Escape')
await wait(400)
f = await facts()
const t0 = f.time
await wait(1500)
const f2 = await facts()
check('Escape opens pause modal', f.paused && f.dialog === 'Mission paused', JSON.stringify(f))
check('sim frozen while paused', t0 === f2.time, `t=${t0} -> ${f2.time}`)
check('pause stays in mission phase', f2.phase === 'mission')
const rows = await page.locator('.hud-menu-row').count()
check('bindings table printed', rows > 10, `rows=${rows}`)
await shot('01-pause-open')

// Abort first press arms only.
await page.locator('.hud-btn.abort').click()
await wait(300)
f = await facts()
check('first Abort press arms, nothing discarded', f.abort === 'CONFIRM?' && f.phase === 'mission' && f.paused && f.hint.includes('3 S'), JSON.stringify(f))
await shot('02-abort-armed')

// Let 3 real seconds lapse.
await wait(3400)
f = await facts()
check('lapse disarms, still paused', f.abort === 'ABORT' && f.hint === '' && f.paused && f.phase === 'mission', JSON.stringify(f))
await shot('03-abort-lapsed-still-paused')

// Settings from pause: remap Stop (X) to Z, return, list shows Z.
await page.getByRole('button', { name: 'Open settings' }).click()
await wait(400)
f = await facts()
check('Settings opens inside the freeze', f.paused && f.dialog === 'Settings', JSON.stringify(f))
const btn = page.getByRole('button', { name: 'Rebind Stop and drop orders' })
let rebound = false
if ((await btn.count()) > 0) {
  await btn.click()
  await wait(200)
  await page.keyboard.press('KeyZ')
  await wait(300)
  rebound = true
}
const pauseFixed = await page.evaluate(() => document.body.innerText.includes('FIXED'))
check('Pause / slots shown FIXED in Settings', pauseFixed)
await shot('04-settings-from-pause')
await page.keyboard.press('Escape')
await wait(400)
f = await facts()
check('Settings returns to pause menu', f.paused && f.dialog === 'Mission paused', JSON.stringify(f))
const stopKeys = await page.evaluate(() => {
  const row = [...document.querySelectorAll('.hud-menu-row')].find((r) => r.textContent.includes('Stop and drop orders'))
  return row ? row.querySelector('dt').textContent : null
})
check('remap shows on return', rebound && stopKeys === 'Z', `rebound=${rebound} keys=${stopKeys}`)
await shot('05-pause-after-remap')

// Abort confirm: two presses within the window.
await page.locator('.hud-btn.abort').click()
await wait(300)
await page.locator('.hud-btn.abort').click()
await wait(200)
f = await facts()
check('confirm aborts to World Network, no outcome, no save write', f.phase === 'world' && f.outcome === null && !f.saveKeys.includes('nexus-save-v1'), JSON.stringify(f))
await shot('06-after-abort-confirm')

check('no console errors', errs.length === 0, errs.slice(0, 5).join(' | '))
note(fails === 0 ? 'ALL PASS' : `${fails} FAIL`)
writeFileSync(`${OUT}capture-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails ? 1 : 0)
