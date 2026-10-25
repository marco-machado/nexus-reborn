// IF-020 hand-walks (TC-05..TC-08, TC-10..TC-13) at HEAD, headless Chrome for
// Testing at 1280x720, against the already-running dev server on :4200.
// Harness setup copied from production/qa/evidence/sprint-011/probe.mjs l.22-60
// and its fresh/dismissCard/pause/sector fixtures. Assists, named: localStorage
// clear; save.startNewOperation; goto('world'); markSeen('hint-worldmap');
// worldStore.setState({paused}); worldStore.setState sector Control on 'eu'.
// Run: node production/qa/evidence/sprint-011-head-2026-10-24/if-020/handwalk.mjs
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, mkdirSync } from 'fs'

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

const TEAL = 'rgb(126, 240, 212)'
const PRINT_WHITE = 'rgb(226, 246, 238)'
const RED_HOT = 'rgb(255, 107, 85)'
const AMBER = 'rgb(255, 208, 117)'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
// Named harness assist: the dev server serves some modules twice (the app's
// copy carries an HMR ?t= stamp), so a bare import('/src/x.ts') can reach a
// second store instance the UI never reads. __imp imports the copy the app
// loaded first (first resource entry for that path).
await ctx.addInitScript(() => {
  window.__imp = (p) => {
    const hits = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => new URL(n).pathname === p)
    return import(hits.length ? hits[0] : p)
  }
})
const page = await ctx.newPage()
let errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const pngSize = (p) => { const b = readFileSync(p); return [b.readUInt32BE(16), b.readUInt32BE(20)] }
const shot = async (name) => { const p = `${OUT}${name}.png`; await page.screenshot({ path: p }); return { png: name + '.png', size: pngSize(p) } }
const log = []
let fails = 0
const note = (s) => { log.push(s); console.log(s) }
const check = (id, name, ok, detail = '') => {
  if (!ok) fails++
  note(`${ok ? 'PASS' : 'FAIL'} ${id} ${name}${detail ? ' // ' + detail : ''}`)
}
const takeErrs = () => { const e = errs; errs = []; return e }

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.evaluate(async () => {
    const save = await window.__imp('/src/state/save.ts')
    save.startNewOperation()
    const { useAppStore } = await window.__imp('/src/state/appStore.ts')
    useAppStore.getState().goto('world')
  })
  await wait(700)
}
const store = (fn, arg) => page.evaluate(fn, arg)
const dismissCard = () => store(async () => {
  const { useTutorialStore } = await window.__imp('/src/state/tutorialStore.ts')
  useTutorialStore.getState().markSeen('hint-worldmap')
})
const pause = () => store(async () => {
  const { useWorldStore } = await window.__imp('/src/state/worldStore.ts')
  useWorldStore.setState({ paused: true })
})
const opening = async () => {
  await fresh(); await dismissCard(); await pause()
  await wait(200)
  return page.evaluate(async () => ({ phase: (await window.__imp('/src/state/appStore.ts')).useAppStore.getState().phase, card: !!document.querySelector('.wm-onboard-wrap') }))
}
const setControl = (c) => store(async (c) => {
  const { useWorldStore } = await window.__imp('/src/state/worldStore.ts')
  const s = useWorldStore.getState()
  useWorldStore.setState({ selected: 'eu', sectors: { ...s.sectors, eu: { ...s.sectors.eu, control: c } }, crisis: s.crisis.filter((x) => x !== 'eu') })
  return [useWorldStore.getState().selected, useWorldStore.getState().sectors.eu.control]
}, c)
const READ_G = () => page.evaluate(() => {
  const kv = [...document.querySelectorAll('.wm-right .kv')].find((k) => k.querySelector('span')?.textContent === 'GARRISON CONDITION')
  const b = kv?.querySelector('b'); if (!b) return null
  b.scrollIntoView({ block: 'nearest' })
  const r = b.getBoundingClientRect()
  const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
  return { text: b.textContent, cls: b.className, color: getComputedStyle(b).color, amber: b.classList.contains('amber'), notice: b.classList.contains('notice'),
    rect: [r.x, r.y, r.width, r.height], inViewport: r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
    clipped: b.scrollWidth > b.clientWidth || kv.scrollWidth > kv.clientWidth, onTop: hit === b || b.contains(hit) }
})
const READ_C = () => page.evaluate(() => {
  const b = document.querySelector('.wm-resource b.amber')
  return b ? { text: b.textContent, color: getComputedStyle(b).color, filter: document.documentElement.style.filter } : null
})
const gray = (on) => page.evaluate((on) => { document.documentElement.style.filter = on ? 'grayscale(1)' : ''; return getComputedStyle(document.documentElement).filter }, on)
const control = () => page.evaluate(() => document.querySelector('.wm-cu b')?.textContent)

note('HEAD ' + execSync('git rev-parse --short HEAD').toString().trim())
note('git status --short src/: ' + JSON.stringify(execSync('git status --short src/').toString().trim()))
await page.goto(URL)
note('viewport ' + (await page.evaluate(() => innerWidth + 'x' + innerHeight)))

/* TC-05..TC-08: Control boundaries */
note('opening assist -> ' + JSON.stringify(await opening()))
takeErrs()
for (const [tc, c, word, color, clsWord, notice] of [
  ['IF020-TC-05', 55, 'SECURE', TEAL, 'teal', false],
  ['IF020-TC-06', 54, 'STRAINED', PRINT_WHITE, 'notice', true],
  ['IF020-TC-07', 35, 'STRAINED', PRINT_WHITE, 'notice', true],
  ['IF020-TC-08', 34, 'CRITICAL', RED_HOT, 'red', false],
]) {
  const set = await setControl(c)
  await wait(500)
  const g = await READ_G()
  const cu = await control()
  const s = await shot(`garrison-control-${c}`)
  const e = takeErrs()
  note(`${tc} set=${JSON.stringify(set)} READ-G=${JSON.stringify(g)} CONTROL=${cu} shot=${JSON.stringify(s)} errors=${JSON.stringify(e)}`)
  check(tc, `Control ${c} -> ${word} ${color}`,
    set[0] === 'eu' && set[1] === c && g && g.text === word && g.color === color && g.cls.split(' ').includes(clsWord) &&
    !g.amber && g.notice === notice && !g.clipped && cu === `${c}%` && s.size[0] === 1280 && s.size[1] === 720 && e.length === 0)
}

/* TC-10: Antarctica */
{
  note('opening assist -> ' + JSON.stringify(await opening())); takeErrs()
  const before = await page.evaluate(async () => (await window.__imp('/src/state/worldStore.ts')).useWorldStore.getState().selected)
  await page.getByRole('button', { name: 'SOUTH POLE', exact: true }).click()
  await wait(800)
  const r = await page.evaluate(async () => {
    const { useWorldStore } = await window.__imp('/src/state/worldStore.ts')
    const kv = [...document.querySelectorAll('.kv')].filter((k) => k.querySelector('span')?.textContent === 'GARRISON CONDITION')
    return { selected: useWorldStore.getState().selected, caption: document.querySelector('.globe-polar-caption')?.textContent ?? null,
      garrisonRows: kv.length, garrisonValues: kv.map((k) => k.querySelector('b')?.textContent),
      heading: document.querySelector('.wm-right .wm-sector-name')?.textContent ?? null,
      panelText: document.querySelector('.wm-right')?.innerText.slice(0, 200) }
  })
  const s = await shot('antarctica-south-pole')
  note(`IF020-TC-10 selectedBefore=${before} read=${JSON.stringify(r)} shot=${JSON.stringify(s)}`)
  const open = await page.evaluate(async () => (await window.__imp('/src/game/atlas.ts')).OPEN_SECTORS)
  const next = page.getByRole('button', { name: 'FOCUS NEXT SECTOR', exact: true })
  await next.focus()
  const seq = []
  for (let i = 0; i < open.length + 1; i++) {
    await page.keyboard.press('Enter')
    await wait(150)
    seq.push(await page.evaluate(async () => (await window.__imp('/src/state/worldStore.ts')).useWorldStore.getState().selected))
  }
  const e = takeErrs()
  note(`IF020-TC-10 OPEN_SECTORS=${JSON.stringify(open)} focusedOK=${await next.evaluate((b) => b === document.activeElement)} cycle=${JSON.stringify(seq)} errors=${JSON.stringify(e)}`)
  const noAnPanel = !/\b(SECURE|STRAINED|CRITICAL)\b/.test(r.panelText || '') || (r.selected !== 'an' && r.garrisonRows <= 1)
  check('IF020-TC-10', 'Antarctica prints no Garrison',
    r.selected !== 'an' && !seq.includes('an') && r.caption === 'ANTARCTICA UNSURVEYED SECTOR' && r.garrisonRows <= 1 && noAnPanel && e.length === 0)
}

/* TC-11..TC-13: grayscale */
const grayShots = {}
for (const [tc, c, word] of [['IF020-TC-11', 60, 'SECURE'], ['IF020-TC-12', 45, 'STRAINED'], ['IF020-TC-13', 20, 'CRITICAL']]) {
  note('opening assist -> ' + JSON.stringify(await opening())); takeErrs()
  const set = await setControl(c)
  await wait(500)
  const g1 = await READ_G()
  const f = await gray(true)
  const g2 = await READ_G()
  const s = await shot(`grayscale-${word.toLowerCase()}`)
  // crop of the Garrison slot for the side-by-side read
  const clip = { x: Math.max(0, g2.rect[0] - 200), y: Math.max(0, g2.rect[1] - 8), width: 320, height: g2.rect[3] + 16 }
  await page.screenshot({ path: `${OUT}grayscale-${word.toLowerCase()}-slot.png`, clip })
  grayShots[word] = s
  const off = await gray(false)
  const cr = await READ_C()
  const e = takeErrs()
  note(`${tc} set=${JSON.stringify(set)} READ-G(before)=${JSON.stringify(g1)} filterOn=${f} READ-G(gray)=${JSON.stringify(g2)} shot=${JSON.stringify(s)} filterOff=${JSON.stringify(off)} READ-C=${JSON.stringify(cr)} errors=${JSON.stringify(e)}`)
  check(tc, `grayscale ${word} legible by word`,
    set[1] === c && f === 'grayscale(1)' && g2 && g2.text === word && g2.inViewport && !g2.clipped && g2.onTop &&
    cr && cr.filter === '' && cr.color === AMBER && s.size[0] === 1280 && s.size[1] === 720 && e.length === 0)
}

note(fails ? `${fails} FAIL` : 'ALL PASS')
writeFileSync(`${OUT}handwalk-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails ? 1 : 0)
