// BUG-0010 fix re-walk of IF-039 TC-02: the Rust Haven (m03) Brief and the
// seeded opening SABOTAGE contract's Brief at 1280x720, headless Chrome for
// Testing. Reads every rendered .mb-note and checks one carries
// `EVERY CIVILIAN HIT IS BILLED.`. Also checks each note for horizontal
// overrun at text scale 100 and 125 (TR-interface-002), with a 125 capture.
//
// Harness setup copied from production/qa/evidence/sprint-011/probe.mjs
// lines 22-60. Harness assists, named: localStorage clear; New Operation
// through save.startNewOperation; intel set through campaignStore.setState;
// Brief reached through appStore.selectMission; text scale through
// settingsStore.setTextScale.
//
// Run: npx vite --port 4311 --strictPort (worktree), then
//      PROBE_URL=http://localhost:4311/ node production/qa/evidence/bug-0010-fix-2026-10-25/walk.mjs
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
const URL = process.env.PROBE_URL || 'http://localhost:4311/'
const OUT = process.env.PROBE_OUT || new globalThis.URL('.', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const BILLED = 'EVERY CIVILIAN HIT IS BILLED.'

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
const check = (id, name, ok, detail = '') => {
  if (!ok) fails++
  note(`${ok ? 'PASS' : 'FAIL'} ${id} ${name}${detail ? ' // ' + detail : ''}`)
}
const store = (fn, arg) => page.evaluate(fn, arg)
const setScale = (s) => store(async (s) => { (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setTextScale(s) }, s)

await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await wait(1200)
const opening = await store(async () => {
  (await import('/src/state/save.ts')).startNewOperation()
  const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
  for (const id of ['hint-worldmap', 'hint-influence', 'hint-debrief-research']) useTutorialStore.getState().markSeen(id)
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  useCampaignStore.setState({ intelLevel: 5 })
  const cs = (await import('/src/state/worldStore.ts')).useWorldStore.getState().contracts
  return cs.map((c) => ({ id: c.id, type: c.type, seed: c.seed }))
})
note('seeded contracts ' + JSON.stringify(opening))
const sab = opening.find((c) => c.type === 'SABOTAGE')
check('IF039-TC02', 'fresh New Operation seeds a SABOTAGE contract', !!sab, sab ? sab.id : 'none')

const targets = [['m03', 'm03'], ...(sab ? [[sab.id, 'sabotage-' + sab.id]] : [])]
for (const [id, tag] of targets) {
  const phase = await store(async (id) => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('world')
    useAppStore.getState().selectMission(id)
    return useAppStore.getState().phase
  }, id)
  await wait(800)
  for (const scale of [100, 125]) {
    await setScale(scale)
    await wait(400)
    const notes = await page.evaluate(() => [...document.querySelectorAll('.mb-note')].map((n) => ({
      text: n.innerText.trim(),
      overrun: n.scrollWidth > n.clientWidth + 1,
    })))
    if (scale === 100) {
      note(`${tag} phase=${phase} notes:`)
      for (const n of notes) note(`  ${n.text}`)
      check('IF039-TC02', `${tag} Brief notes contain "${BILLED}"`, notes.some((n) => n.text.includes(BILLED)))
    }
    check('TR-interface-002', `${tag} notes do not overrun at text scale ${scale}`, notes.length > 0 && notes.every((n) => !n.overrun),
      notes.filter((n) => n.overrun).map((n) => n.text).join(' | '))
    await page.evaluate(() => { const e = document.querySelector('.mb-note'); if (e) e.scrollIntoView({ block: 'center' }) })
    await wait(200)
    await shot(`tc02-${tag}-${scale}`)
  }
  await setScale(100)
}

check('-', 'no page errors', errs.length === 0, errs.join(' | '))
note(`${fails === 0 ? 'ALL PASS' : fails + ' FAIL'}`)
writeFileSync(`${OUT}walk-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails ? 1 : 0)
