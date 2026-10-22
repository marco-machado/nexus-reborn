// BUG-0009 capture: the Brief threat box at 1280x720 for each threat rating
// (Rust Haven = MODERATE, plus generated contracts injected at HIGH and
// SEVERE), each at text scales 90 / 100 / 110 / 125. Probe: the threat value
// (`.mb-threat-main b`), the label, and the side column (`.mb-threat-side`)
// must not intersect, and none may spill out of the `.mb-threat` box.
// Headless Chrome for Testing against a vite dev server.
// Harness assists, named: localStorage clear; New Operation through
// save.startNewOperation; intelLevel raised to 3; two generated records
// injected into useWorldStore.contracts; text scale through the settings
// store; Brief reached through selectMission.
//
// Run: npm run dev -- --strictPort --port 4215
//      SWEEP_URL=http://localhost:4215/ node production/qa/evidence/bug-0009-fix-2026-10-22/capture.mjs
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
const URL = process.env.SWEEP_URL || 'http://localhost:4215/'
const OUT = new globalThis.URL('.', import.meta.url).pathname
const SCALES = [90, 100, 110, 125]

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const log = []
let fails = 0
const note = (s) => { log.push(s); console.log(s) }
const check = (name, ok, detail = '') => { if (!ok) fails++; note(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' // ' + detail : ''}`) }

const setScale = (scale) =>
  page.evaluate(async (scale) => {
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setTextScale(scale)
  }, scale)

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.evaluate(async () => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    useCampaignStore.setState({ intelLevel: 3 })
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const rec = (threat, i) => ({
      id: 'gc-bug0009-' + threat.toLowerCase(),
      createdT: 1000,
      expiresAtT: 10 ** 9,
      sector: 'eu',
      cityId: 'nc',
      district: 7 + i,
      type: 'SABOTAGE',
      client: 'helix',
      threat,
      reward: 52000,
      seed: 1,
      priority: false,
      expedited: false,
    })
    const injected = ['HIGH', 'SEVERE'].map(rec)
    useWorldStore.setState({ contracts: [...useWorldStore.getState().contracts, ...injected] })
  })
  await wait(300)
}

async function openBrief(id) {
  await page.evaluate(async (id) => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().selectMission(id)
  }, id)
  await page.waitForSelector('.mb-threat', { timeout: 20000 })
  await wait(700)
}

const threatFacts = () =>
  page.evaluate(() => {
    const box = document.querySelector('.mb-threat')
    box.scrollIntoView({ block: 'nearest' })
    const r = (el) => el.getBoundingClientRect()
    const hit = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5
    const inside = (a, b) => a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5
    const value = box.querySelector('.mb-threat-main b')
    const label = box.querySelector('.mb-threat-main label')
    const eta = box.querySelector('.mb-threat-eta')
    const blocks = box.querySelector('.mb-threat-blocks')
    const bb = r(box)
    const problems = []
    for (const [n, el] of [['value', value], ['label', label]]) {
      for (const [m, side] of [['eta', eta], ['blocks', blocks]]) if (hit(r(el), r(side))) problems.push(`${n}x${m}`)
    }
    for (const [n, el] of [['value', value], ['label', label], ['eta', eta], ['blocks', blocks]]) {
      if (!inside(r(el), bb)) problems.push(`${n} outside box`)
    }
    if (bb.right > innerWidth + 0.5 || bb.bottom > innerHeight + 0.5) problems.push('box outside viewport')
    return {
      threat: value.textContent,
      wrapped: r(eta).top >= r(value).bottom - 0.5,
      problems,
      scale: getComputedStyle(document.documentElement).getPropertyValue('--text-scale').trim(),
    }
  })

try {
  await fresh()
  for (const [id, expect] of [['m03', 'MODERATE'], ['gc-bug0009-high', 'HIGH'], ['gc-bug0009-severe', 'SEVERE']]) {
    await openBrief(id)
    for (const scale of SCALES) {
      await setScale(scale)
      await wait(300)
      const f = await threatFacts()
      check(
        `${id} ${expect} scale ${scale}: threat value, label and side column do not overlap or spill`,
        f.threat === expect && f.problems.length === 0 && f.scale === String(scale / 100),
        JSON.stringify(f),
      )
      const box = await page.$('.mb-threat')
      await page.screenshot({ path: `${OUT}${expect.toLowerCase()}-brief-${scale}.png` })
      await box.screenshot({ path: `${OUT}${expect.toLowerCase()}-threat-box-${scale}.png` })
    }
    await setScale(100)
    await wait(200)
  }
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
}

check('no console or page errors', errs.length === 0, errs.join(' | '))
note(fails === 0 ? 'ALL PASS' : `${fails} FAIL`)
writeFileSync(`${OUT}capture-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails === 0 ? 0 : 1)
