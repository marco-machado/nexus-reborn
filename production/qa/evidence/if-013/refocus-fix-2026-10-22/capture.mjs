// IF013-18 owner ruling (2026-10-22): the Influence note hides when the focused
// sector changes and does not come back. Headless Chrome for Testing via the
// playwright-core inside the global @playwright/cli, 1280x720, dev server :4200.
// Assists, named in the output: worldStore.setState({ influence: 8 }) (clean-win
// fixture) and worldStore.select('an') (Antarctica is not in the sector list).
import { createRequire } from 'module'
import { execSync } from 'child_process'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.SWEEP_URL || 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + e))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
let fails = 0
const check = (name, ok, detail) => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' ' + JSON.stringify(detail) : '')) }
const st = () => page.evaluate(async () => {
  const W = (await import('/src/state/worldStore.ts')).useWorldStore.getState()
  const T = (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState()
  return { selected: W.selected, moment: document.querySelectorAll('.wm-moment').length, inset: document.querySelectorAll('.wm-inset').length, seen: T.seen.filter((i) => i === 'hint-influence').length }
})
const sector = async (name) => {
  await page.locator('button.wm-sector', { has: page.locator('.wm-sector-name', { hasText: new RegExp('^' + name + '$') }) }).click({ timeout: 3000 })
  await wait(350)
}
const fire = async () => {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.click('button[aria-label="BEGIN NEW OPERATION"]')
  await wait(900)
  await page.click('button[aria-label="Dismiss the orientation"]')
  await wait(300)
  await page.evaluate(async () => (await import('/src/state/worldStore.ts')).useWorldStore.setState({ influence: 8 }))
  console.log('assist: worldStore.setState({ influence: 8 })')
  await wait(400)
}

console.log('viewport', await page.evaluate(() => [innerWidth, innerHeight]))
// A: fire on Europe, refocus North America by a real click, then back to Europe.
await fire()
let s = await st()
check('A fires on Europe', s.selected === 'eu' && s.moment === 1 && s.seen === 1, s)
await page.screenshot({ path: OUT + 'a1-fired-europe-100.png' })
await sector('NORTH AMERICA')
s = await st()
check('A hidden on North America, inset back', s.selected === 'na' && s.moment === 0 && s.inset === 1, s)
await page.screenshot({ path: OUT + 'a2-refocus-north-america-100.png' })
await sector('EUROPE')
s = await st()
check('A does not return on Europe', s.selected === 'eu' && s.moment === 0 && s.seen === 1, s)
await page.screenshot({ path: OUT + 'a3-back-to-europe-100.png' })

// B: fire on Europe, refocus Antarctica (the IF013-18 path).
await fire()
s = await st()
check('B fires on Europe', s.moment === 1, s)
await page.evaluate(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().select('an'))
console.log("assist: worldStore.select('an')")
await wait(400)
s = await st()
check('B hidden on Antarctica', s.selected === 'an' && s.moment === 0, s)
await page.screenshot({ path: OUT + 'b1-refocus-antarctica-100.png' })

// C: UNDERSTOOD still dismisses on the sector it fired on.
await fire()
await page.click('button[aria-label="Dismiss the Influence note"]')
await wait(300)
s = await st()
check('C UNDERSTOOD dismisses', s.moment === 0 && s.inset === 1 && s.seen === 1, s)

check('no console or page errors', errs.length === 0, errs)
await browser.close()
console.log(fails ? fails + ' FAIL' : 'ALL PASS')
process.exit(fails ? 1 : 0)
