// IF-039 hand-walk, Sprint 11 Phase 5, build 131a5c1. Headless Chrome for
// Testing, 1280x720. Launch and fresh() copied from
// production/qa/evidence/playtest-fixes-2026-10-23/sweep.mjs.
// Run: node production/qa/evidence/sprint-011-head-2026-10-24/if-039/walk.mjs
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
const wait = (ms) => page.waitForTimeout(ms)
const R = {}
const note = (k, v) => { R[k] = v; console.log(k, JSON.stringify(v)) }
const store = (fn, arg) => page.evaluate(fn, arg)
const shot = (n) => page.screenshot({ path: OUT + n })
const setScale = (s) => store(async (s) => { (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setTextScale(s) }, s)

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await store(async () => {
    (await import('/src/state/save.ts')).startNewOperation()
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    for (const id of ['hint-worldmap', 'hint-influence', 'hint-debrief-research']) useTutorialStore.getState().markSeen(id)
  })
}
const intel = (n) => store(async (n) => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: n }), n)
const openBrief = async (id) => {
  const ph = await store(async (id) => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('world')
    useAppStore.getState().selectMission(id)
    return useAppStore.getState().phase
  }, id)
  await wait(800)
  return ph
}
// walk3: TC-08 follow-up. At 125% on the team fixture, is the loadout hint
// below the fold of a scroll pane, and does it fit once scrolled into view?
await fresh()
await store(async () => { const { useAppStore } = await import('/src/state/appStore.ts'); useAppStore.getState().selectMission('m03'); useAppStore.getState().goto('team') })
await wait(900)
await setScale(125); await wait(500)
const geo = () => page.evaluate(() => {
  const h = document.querySelector('.ts-loadout-hint'); const r = h.getBoundingClientRect()
  let sc = h.parentElement; while (sc && !(sc.scrollHeight > sc.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement
  const s = sc ? sc.getBoundingClientRect() : null
  return { text: h.innerText.replace(/\s+/g, ' ').trim(), top: r.top, bottom: r.bottom, left: r.left, right: r.right, scrollW: h.scrollWidth, clientW: h.clientWidth, scroller: sc ? { cls: String(sc.className), top: s.top, bottom: s.bottom, left: s.left, right: s.right } : null }
})
const g = { before: await geo() }
await page.evaluate(() => document.querySelector('.ts-loadout-hint').scrollIntoView({ block: 'center' })); await wait(300)
g.after = await geo()
await shot('if039-tc08-hint-125-scrolled.png')
note('tc08', g)
await browser.close()
