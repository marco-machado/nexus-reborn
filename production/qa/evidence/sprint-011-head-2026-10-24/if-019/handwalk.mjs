// IF-019 hand-walks (IF019-06..13, plus the hand reads for IF019-09).
// Launch setup copied from production/qa/evidence/sprint-011/probe.mjs lines 22-60;
// fixture `opening-card` = probe.mjs fresh() + pause().
// Run: dev server on 4200, then node production/qa/evidence/sprint-011-head-2026-10-24/if-019/handwalk.mjs
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME =
  process.env.PROBE_CHROME ||
  process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.PROBE_URL || 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
let errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const log = []
const note = (s) => { log.push(s); console.log(s) }

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.evaluate(async () => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('world')
  })
  await wait(700)
}
const store = (fn, arg) => page.evaluate(fn, arg)
const pause = () => store(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  useWorldStore.setState({ paused: true })
})
const setClock = (patch) => store(async (patch) => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  useWorldStore.setState(patch)
}, patch)
const read = () => page.evaluate(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  // The dev server serves tutorialStore under an HMR stamp (?t=...); a bare
  // '/src/state/tutorialStore.ts' import is a second, empty store instance.
  // Read the instance the app actually loaded.
  const tUrl = performance.getEntriesByType('resource').map((e) => e.name)
    .find((n) => /\/src\/state\/tutorialStore\.ts\?/.test(n)) || '/src/state/tutorialStore.ts'
  const { useTutorialStore } = await import(tUrl)
  const { useAppStore } = await import('/src/state/appStore.ts')
  const w = useWorldStore.getState(), a = useAppStore.getState()
  return {
    paused: w.paused, speed: w.speed, selected: w.selected,
    card: !!document.querySelector('.wm-onboard-wrap'),
    seen: useTutorialStore.getState().seen.filter((id) => id === 'hint-worldmap').length,
    phase: a.phase, overlay: a.overlay ?? null,
    pauseLabel: document.querySelector('.wm-tbtn')?.getAttribute('aria-label') ?? null,
    tutorialUrl: tUrl.replace(location.origin, ''),
  }
})
const vp = () => page.evaluate(() => [innerWidth, innerHeight])
const S = (n) => page.locator(`button[aria-label="CLOCK SPEED ${n}X"]`)
const P = () => page.locator('.wm-tbtn').first()
async function openingCard(caseId) {
  errs = []
  await fresh(); await pause()
  await wait(600) // card fade
  const r = await read()
  note(`${caseId} fixture: ${JSON.stringify(r)} vp=${JSON.stringify(await vp())}`)
  return r
}
const endCase = (caseId) => note(`${caseId} errors: ${errs.length ? JSON.stringify(errs) : 'none'}`)
const J = JSON.stringify

// IF019-06
{
  const c = 'IF019-06'
  await openingCard(c)
  await setClock({ paused: false, speed: 2 }); await wait(150)
  note(`${c} step1 ${J(await read())}`); await shot(`${c}-before`)
  await S(4).click({ timeout: 3000 }); await wait(200); await wait(400)
  note(`${c} step2 ${J(await read())}`); await shot(`${c}-after`)
  await P().click({ timeout: 3000 }); await wait(200)
  note(`${c} step3 ${J(await read())}`)
  await P().click({ timeout: 3000 }); await wait(200)
  note(`${c} step4 ${J(await read())}`)
  for (const n of [1, 2, 8]) { await S(n).click({ timeout: 3000 }); await wait(200); note(`${c} step5 after ${n}X ${J(await read())}`) }
  endCase(c)
}
// IF019-07
{
  const c = 'IF019-07'
  await openingCard(c)
  await setClock({ paused: false, speed: 2 }); await wait(150)
  note(`${c} pre ${J(await read())} 2X aria-pressed=${await S(2).getAttribute('aria-pressed')}`)
  await S(2).click({ timeout: 3000 }); await wait(200)
  note(`${c} after ${J(await read())}`)
  endCase(c)
}
// IF019-08 then IF019-13 (chained, per IF019-13 precondition)
{
  const c = 'IF019-08'
  await openingCard(c)
  note(`${c} pre pauseLabel=${(await read()).pauseLabel}`)
  await P().click({ timeout: 3000 }); await wait(200)
  note(`${c} step1 ${J(await read())}`)
  await wait(1000)
  const blob = await page.evaluate(() => localStorage.getItem('nexus-save-v1'))
  let cnt = null
  try { cnt = JSON.parse(blob).tutorial.seen.filter((id) => id === 'hint-worldmap').length } catch (e) { cnt = 'parse error ' + e }
  note(`${c} step2 wait=1000ms blob tutorial.seen hint-worldmap count=${cnt} seen=${blob ? J(JSON.parse(blob).tutorial?.seen) : 'null blob'}`)
  await page.reload(); await wait(1200)
  note(`${c} step3 vp=${J(await vp())}`)
  await page.locator('button[aria-label="CONTINUE SAVED OPERATION // OPEN THE WORLD NETWORK"]').click({ timeout: 3000 })
  await wait(700)
  note(`${c} step4 ${J(await read())}`); await shot(`${c}-after`)
  endCase(c)

  const d = 'IF019-13'
  errs = []
  note(`${d} pre ${J(await read())}`)
  await page.reload(); await wait(1200)
  note(`${d} step1 vp=${J(await vp())}`)
  await page.locator('button[aria-label="BEGIN NEW OPERATION"]').click({ timeout: 3000 })
  await wait(150)
  await page.locator('button[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]').click({ timeout: 3000 })
  await wait(700)
  note(`${d} step2 ${J(await read())}`)
  await wait(500); await shot(`${d}-before`)
  await S(4).click({ timeout: 3000 }); await wait(200)
  note(`${d} step3 ${J(await read())}`)
  endCase(d)
}
// IF019-09 hand reads
{
  const c = 'IF019-09'
  await openingCard(c)
  const before = (await read()).selected
  const label = await page.locator('.wm-feed-line').nth(1).getAttribute('aria-label')
  const rows = await page.locator('.wm-feed-line').count()
  const name = label.split('// FOCUS ')[1]
  const want = await page.evaluate(async (name) => (await import('/src/game/atlas.ts')).SECTORS.find((s) => s.name === name)?.id, name)
  note(`${c} rows=${rows} before=${before} row2 label=${J(label)} -> sector ${name} id=${want}`)
  await page.locator('.wm-feed-line').nth(1).click({ timeout: 3000 }); await wait(200)
  const r = await read()
  note(`${c} after ${J(r)} match=${r.selected === want}`)
  endCase(c)
}
// IF019-10
{
  const c = 'IF019-10'
  const pre = await openingCard(c)
  const rows = await page.locator('.wm-sector').evaluateAll((els) => els.map((e) => ({ label: e.getAttribute('aria-label'), locked: e.classList.contains('locked'), pressed: e.getAttribute('aria-pressed') })))
  note(`${c} rows ${J(rows)}`)
  const cands = rows.map((r, i) => ({ ...r, i })).filter((r) => !r.locked && r.pressed === 'false')
  const intercepted = []
  let clicked = null
  for (const r of cands) {
    try { await page.locator('.wm-sector').nth(r.i).click({ timeout: 2000 }); clicked = r; break }
    catch (e) { intercepted.push(r.label + ' :: ' + String(e.message).split('\n').find((l) => /intercept/.test(l)) ) }
  }
  note(`${c} intercepted ${J(intercepted)} clicked ${J(clicked?.label)}`)
  await wait(200)
  const r = await read()
  const pressedNow = clicked ? await page.locator('.wm-sector').nth(clicked.i).getAttribute('aria-pressed') : null
  note(`${c} after ${J(r)} beforeSelected=${pre.selected} clickedRow aria-pressed=${pressedNow}`)
  await shot(`${c}-after`)
  endCase(c)
}
// IF019-11
{
  const c = 'IF019-11'
  await openingCard(c)
  const focus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
  note(`${c} pre focus=${J(focus)}`)
  await page.keyboard.press('Escape'); await wait(200)
  note(`${c} after ${J(await read())}`)
  endCase(c)
}
// IF019-12
{
  const c = 'IF019-12'
  const pre = await openingCard(c)
  note(`${c} pre paused=${pre.paused} speed=${pre.speed}`)
  await page.locator('button[aria-label="UNDERSTOOD // DISMISS THE ORIENTATION"]').click({ timeout: 3000 }); await wait(300)
  note(`${c} after ${J(await read())}`)
  endCase(c)
}

writeFileSync(`${OUT}run.log`, log.join('\n') + '\n')
await browser.close()
