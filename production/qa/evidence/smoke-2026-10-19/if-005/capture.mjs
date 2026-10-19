// IF-005 capture: Research Authorize gating, node activation vs Authorize by
// pointer / Enter / Space, Timeline keys, Pause + nested Settings focus trap and
// return, at 1280x720 in headless Chrome for Testing against a vite dev server.
// Real UI input drives every check. Harness assists, named: store setState to
// set up each fixture (Credits, empty labs) and to read results back; the
// mission is reached by the real Deploy click.
//
// Run: PORT=4201 npm run dev   then   SWEEP_URL=http://localhost:4201/ node production/qa/evidence/if-005/capture.mjs
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
async function until(fn, ms) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (await page.evaluate(fn)) return; await wait(250) }
  throw new Error('timed out ' + fn.toString().slice(0, 80))
}
async function dismiss() {
  const d = page.locator('[aria-label="Dismiss the orientation"]')
  if (await d.count()) { await d.click(); await wait(300) }
}
const snap = () =>
  page.evaluate(async () => {
    const A = (await import('/src/state/appStore.ts')).useAppStore.getState()
    const R = (await import('/src/state/researchStore.ts')).useResearchStore.getState()
    return { credits: A.credits, labs: JSON.stringify(R.labs), done: R.done.length }
  })
const setup = (credits) =>
  page.evaluate(async (credits) => {
    const A = (await import('/src/state/appStore.ts')).useAppStore
    const R = (await import('/src/state/researchStore.ts')).useResearchStore
    A.setState({ credits })
    R.setState({ done: [], labs: { ballistics: null, cybernetics: null, control: null }, lastSyncT: null })
  }, credits)
const focusedLabel = () => page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.className ?? document.activeElement?.tagName)
const title = () => page.locator('.rs-detail .panel-head, .rs-detail [class*="head"]').first().innerText().catch(() => '')

await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await wait(1500)
await page.getByText('NEW OPERATION').first().click()
await wait(1500)
await dismiss()
await page.locator('[aria-label="RESEARCH"]').click()
await wait(800)

const node = (i) => page.locator('.rs-node').nth(i)
const authBtn = page.locator('button.rs-auth')
// First root node of the first branch: AVAILABLE with no prerequisites.
const cost = await page.evaluate(async () => (await import('/src/game/research.ts')).NODES[0].cost)
const nodeId0 = await page.evaluate(async () => (await import('/src/game/research.ts')).NODES[0].id)
note('fixture node ' + nodeId0 + ' cost ' + cost)

// AC8 disabled fixture: Credits one short.
await setup(cost - 1)
await node(0).click()
await wait(300)
check('AC8 Authorize disabled when Credits below cost', await authBtn.isDisabled())
const reason = await page.locator('.rs-auth-sub').innerText()
check('AC8 unaffordable reason visible', /INSUFFICIENT CREDITS/.test(reason), reason)
await shot('01-authorize-disabled-unaffordable')

// AC19 node activation: pointer, Enter, Space select without starting anything.
for (const how of ['pointer', 'Enter', 'Space']) {
  await setup(cost)
  const other = (await page.locator('.rs-node').count()) > 1 ? 1 : 0
  const before = await snap()
  if (how === 'pointer') await node(other).click()
  else {
    await node(other).focus()
    await page.keyboard.press(how === 'Space' ? ' ' : 'Enter')
  }
  await wait(250)
  const after = await snap()
  const sel = await node(other).getAttribute('aria-pressed')
  check(`AC19 node ${how}: selects and shows details`, sel === 'true')
  check(`AC19 node ${how}: Credits and lab occupancy unchanged`, before.credits === after.credits && before.labs === after.labs && before.done === after.done)
  if (how === 'Enter') { await node(other).focus(); await shot('02-node-focus-ring-selected') }
}

// AC8 affordable twin + AC19 Authorize by pointer, Enter, Space.
for (const how of ['pointer', 'Enter', 'Space']) {
  await setup(cost)
  await node(0).click()
  await wait(250)
  check(`AC19 Authorize ${how}: control enabled`, !(await authBtn.isDisabled()))
  if (how === 'pointer') await authBtn.click()
  else {
    await authBtn.focus()
    await page.keyboard.press(how === 'Space' ? ' ' : 'Enter')
  }
  await wait(400)
  const s = await snap()
  const chip = await page.locator('.rs-detail .chip, .rs-detail [class*="chip"]').first().innerText().catch(() => '')
  const ariaNode = await node(0).getAttribute('aria-label')
  check(`AC19 Authorize ${how}: starts the project (lab occupied, debited)`, s.credits === 0 && /"id":"/.test(s.labs), JSON.stringify(s))
  check(`AC19 Authorize ${how}: Active state shown`, /IN PROGRESS/.test(ariaNode + ' ' + chip), ariaNode + ' | ' + chip)
  if (how === 'pointer') await shot('03-authorize-active')
}

// Timeline keys on the World Network.
await setup(cost)
await page.locator('[aria-label="WORLD NETWORK"]').click()
await wait(800)
await dismiss()
const tl = page.locator('[aria-label="TIMELINE REVIEW"]')
const tlState = () => page.evaluate(async () => {
  const W = (await import('/src/state/worldStore.ts')).useWorldStore.getState()
  return { t: W.t, review: W.review }
})
// Strategic clock held so Credits (tax yield) cannot move during the key checks.
await page.evaluate(async () => (await import('/src/state/worldStore.ts')).useWorldStore.setState({ review: null, paused: true }))
// Give the world a day of history so the window is full.
await page.evaluate(async () => { const W = (await import('/src/state/worldStore.ts')).useWorldStore; W.setState({ t: Math.max(W.getState().t, 3 * 86400) }) })
await tl.focus()
const s0 = await tlState()
const credits0 = (await snap()).credits
await page.keyboard.press('ArrowLeft')
const s1 = await tlState()
check('AC19 Left moves Review backward', s1.review !== null && s1.review < s0.t, `review=${s1.review} t=${s1.t}`)
await shot('04-timeline-review-left')
await page.keyboard.press('ArrowRight')
const s2 = await tlState()
check('AC19 Right moves Review forward (back to Live within a step)', s2.review === null || s2.review > s1.review)
await page.keyboard.press('Home')
const s3 = await tlState()
check('AC19 Home selects the oldest point', Math.abs(s3.review - (s3.t - 86400)) < 1e-6 || Math.abs(s3.t - s3.review) <= 86400 + 1 && s3.t - s3.review >= 86400 - 120, `t-review=${s3.t - s3.review}`)
await page.keyboard.press('End')
const s4 = await tlState()
check('AC19 End returns Live', s4.review === null)
check('AC19 Review keys do not mutate Credits', (await snap()).credits === credits0)
check('AC19 Review keys do not rewind the live clock', s4.t >= s0.t)

// Pause and nested Settings (mission).
await page.evaluate(async () => (await import('/src/state/worldStore.ts')).useWorldStore.setState({ paused: false }))
await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().click()
await wait(900)
await page.locator('[aria-label^="ACCEPT CONTRACT"]').click()
await wait(900)
await page.locator('[aria-label^="DEPLOY STRIKE TEAM"]').click()
await until(async () => !!(await import('/src/game/runtime.ts')).getWorld(), 60000)
await wait(2500)
const pauseBtn = page.locator('[aria-label="Pause and open the menu"]')
await pauseBtn.focus()
await pauseBtn.click()
await wait(500)
const pauseRoot = page.locator('[role="dialog"][aria-label="Mission paused"]')
check('AC18 pause modal open, focus inside', (await pauseRoot.count()) === 1 && (await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"][aria-label="Mission paused"]'))), await focusedLabel())
await shot('05-pause-focus')
// Tab / Shift+Tab trap.
let outside = false
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Tab')
  if (!(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"][aria-label="Mission paused"]')))) outside = true
}
check('AC19 Pause: Tab stays trapped over 8 presses', !outside)
outside = false
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Shift+Tab')
  if (!(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"][aria-label="Mission paused"]')))) outside = true
}
check('AC19 Pause: Shift+Tab stays trapped over 8 presses', !outside)
// Nested Settings.
await page.locator('[aria-label="Open settings"]').click()
await wait(400)
check('Settings open over pause', (await page.locator('[role="dialog"][aria-label="Settings"]').count()) === 1)
outside = false
for (let i = 0; i < 30; i++) {
  await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab')
  if (!(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"][aria-label="Settings"]')))) outside = true
}
check('AC19 Settings: Tab/Shift+Tab stay trapped', !outside)
await shot('06-settings-over-pause')
await page.keyboard.press('Escape')
await wait(400)
const inPause = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"][aria-label="Mission paused"]'))
check('AC18 nested Settings close: focus restored to the pause modal', inPause && (await page.locator('[role="dialog"][aria-label="Mission paused"]').count()) === 1, await focusedLabel())
await shot('07-pause-focus-after-settings')
await page.getByRole('button', { name: 'RESUME' }).click()
await wait(400)
check('AC19 Pause close: focus returns to the opening control', (await focusedLabel()) === 'Pause and open the menu', await focusedLabel())

check('no page or console errors', errs.length === 0, errs.join(' | '))
writeFileSync(OUT + 'capture-output.txt', log.join('\n') + `\n${fails === 0 ? 'ALL PASS' : fails + ' FAIL'}\n`)
await browser.close()
process.exit(fails === 0 ? 0 : 1)
