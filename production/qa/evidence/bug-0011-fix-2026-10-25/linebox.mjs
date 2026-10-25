// BUG-0011 fix verification, 2026-10-25 (IF-036 TC-036-22 re-walk).
// Launch, store helpers, fresh() and the Assembly route are copied from
// production/qa/evidence/screens-2026-10-23/sweep.mjs.
//
// At exactly 1280x720 in headless Chrome for Testing, for text scale
// 90 / 100 / 110 / 125, default and high contrast: every .ts-stats label's
// line boxes (Range.getClientRects() over its text node; 1 = one line),
// label width, tile inner width, font size, and whether the text overflows
// its tile. Captures the team screen (full viewport, stat tiles scrolled into
// view) at each scale and contrast as stats-<scale>.png / stats-hc-<scale>.png,
// and records whether the dossier list (.ts-detail-list) still scrolls (P-15).
//
// Harness assists, named: localStorage clear; New Operation through
// save.startNewOperation; Assembly through selectMission('m03') + goto('team');
// text scale and high contrast through the settings store.
//
// Run: npx vite --port 4312 --strictPort, then
//      PROBE_URL=http://localhost:4312/ node production/qa/evidence/bug-0011-fix-2026-10-25/linebox.mjs
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME =
  process.env.PROBE_CHROME ||
  process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.PROBE_URL || 'http://localhost:4312/'
const OUT = process.env.PROBE_OUT || new globalThis.URL('.', import.meta.url).pathname
const SCALES = [90, 100, 110, 125]

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
const wait = (ms) => page.waitForTimeout(ms)
const log = []
const note = (s) => { log.push(s); console.log(s) }
const store = (fn, arg) => page.evaluate(fn, arg)
const setScale = (scale) => store(async (scale) => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setTextScale(scale)
}, scale)
const setHC = (on) => store(async (on) => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setHighContrast(on)
}, on)

await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await wait(1200)
await store(async () => {
  (await import('/src/state/save.ts')).startNewOperation()
  const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
  for (const id of ['hint-worldmap', 'hint-influence', 'hint-debrief-research']) useTutorialStore.getState().markSeen(id)
  const { useAppStore } = await import('/src/state/appStore.ts')
  useAppStore.getState().selectMission('m03')
  useAppStore.getState().goto('team')
})
await page.waitForSelector('.ts-stats label', { timeout: 20000 })
await wait(800)

const measure = () => page.evaluate(() => {
  const grid = document.querySelector('.ts-stats')
  const cols = getComputedStyle(grid).gridTemplateColumns
  const list = document.querySelector('.ts-detail-list')
  return {
    cols,
    detailScrolls: list.scrollHeight > list.clientHeight + 1,
    detailOverflowY: getComputedStyle(list).overflowY,
    detail: list.clientHeight + ' of ' + list.scrollHeight,
    labels: [...document.querySelectorAll('.ts-stats label')].map((el) => {
      const r = document.createRange()
      r.selectNodeContents(el.firstChild)
      const tile = el.parentElement
      const tcs = getComputedStyle(tile)
      const inner = tile.clientWidth - parseFloat(tcs.paddingLeft) - parseFloat(tcs.paddingRight)
      const text = r.getBoundingClientRect()
      return {
        text: el.textContent,
        lines: r.getClientRects().length,
        textW: Math.round(text.width * 10) / 10,
        labelW: Math.round(el.getBoundingClientRect().width * 10) / 10,
        tileInnerW: Math.round(inner * 10) / 10,
        font: getComputedStyle(el).fontSize,
        overflowWrap: getComputedStyle(el).overflowWrap,
        overflows: el.scrollWidth > el.clientWidth + 1,
      }
    }),
  }
})

const results = {}
let allOne = true
for (const hc of [false, true]) {
  await setHC(hc)
  for (const s of SCALES) {
    await setScale(s); await wait(350)
    const m = await measure()
    const key = `${hc ? 'hc' : 'default'}-${s}`
    results[key] = m
    const bad = m.labels.filter((l) => l.lines !== 1 || l.overflows)
    if (bad.length) allOne = false
    note(`${key}: grid ${m.cols}; dossier ${m.detail} px, scrolls ${m.detailScrolls} (${m.detailOverflowY}) :: ` + m.labels.map((l) => `${l.text} ${l.lines} line (${l.textW}/${l.tileInnerW}px @${l.font}${l.overflows ? ' OVERFLOW' : ''})`).join(' | '))
    await page.evaluate(() => document.querySelector('.ts-stats').scrollIntoView({ block: 'center' }))
    await wait(200)
    await page.screenshot({ path: `${OUT}stats-${hc ? 'hc-' : ''}${s}.png` })
  }
}
await setHC(false); await setScale(100)
note(allOne ? 'RESULT every .ts-stats label is 1 line box, no overflow, at every scale and contrast' : 'RESULT FAIL: a label wraps or overflows')
note(errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' | ') : 'no page errors')
writeFileSync(OUT + 'linebox.json', JSON.stringify(results, null, 1))
writeFileSync(OUT + 'linebox-output.txt', log.join('\n') + '\n')
await browser.close()
