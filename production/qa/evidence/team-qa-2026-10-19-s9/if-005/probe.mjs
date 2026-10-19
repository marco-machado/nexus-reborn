// IF-005 /team-qa 2026-10-19 probe for ruling 2 of
// production/qa/test-cases/if-005-research-authorize-focus-return-cases.md:
// Settings opened alone (outside pause) returns focus to its opening control
// when closed (AC19). The only Settings entry outside pause is the Menu
// SETTINGS button (rg: src/ui/index.tsx). Headless Chrome for Testing at
// 1280x720; real keyboard and pointer input; localStorage cleared first.
//
// Run: npm run dev -- --strictPort      (port 4200)
//      SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/if-005/probe.mjs
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
const log = []
let fails = 0
const note = (s) => { log.push(s); console.log(s) }
const check = (name, ok, detail = '') => { if (!ok) fails++; note(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' // ' + detail : ''}`) }
const focus = () =>
  page.evaluate(() => {
    const a = document.activeElement
    const dlg = document.querySelector('[role="dialog"][aria-label="Settings"]')
    return { tag: a ? a.tagName : null, isBody: a === document.body, label: a?.getAttribute('aria-label') ?? a?.textContent?.trim().slice(0, 40) ?? null, inSettings: !!(dlg && dlg.contains(a)), open: !!dlg }
  })
const opener = '[aria-label^="OPEN SETTINGS"]'

try {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForSelector(opener, { timeout: 30000 })
  await wait(800)
  for (const [how, close] of [['Escape', async () => page.keyboard.press('Escape')], ['CLOSE (Enter)', async () => { await page.locator('[role="dialog"][aria-label="Settings"] button', { hasText: /^CLOSE$/ }).focus(); await page.keyboard.press('Enter') }]]) {
    await page.locator(opener).focus()
    await page.keyboard.press('Enter')
    await wait(400)
    let f = await focus()
    check(`Menu Settings (${how}): opens with focus inside`, f.open && f.inSettings, JSON.stringify(f))
    let trapped = true
    for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); if (!(await focus()).inSettings) { trapped = false; break } }
    check(`Menu Settings (${how}): Tab stays trapped over 30 presses`, trapped)
    await close()
    await wait(400)
    f = await focus()
    check(`Menu Settings (${how}): closes and focus returns to the opening control`, !f.open && /^OPEN SETTINGS/.test(f.label ?? ''), JSON.stringify(f))
  }
  await page.screenshot({ path: `${OUT}probe-01-menu-after-settings-close.png` })
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
} finally {
  note(`errors: ${JSON.stringify(errs)}`)
  note(fails === 0 && errs.length === 0 ? 'ALL PASS' : `FAILS: ${fails}`)
  writeFileSync(OUT + 'probe-output.txt', log.join('\n') + '\n')
  await browser.close()
}
