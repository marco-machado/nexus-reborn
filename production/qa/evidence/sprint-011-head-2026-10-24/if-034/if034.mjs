// IF-034 hand-walk (cases 02-09, 11, 12) at HEAD 131a5c1. Launch/fixture copied from
// production/qa/evidence/sprint-011/probe.mjs lines 22-60 and its fresh()/
// dismissCard()/pause(). Headless Chrome for Testing, 1280x720.
// Harness assists, named: localStorage clear; save.startNewOperation; goto('world');
// markSeen('hint-worldmap'); worldStore.setState({paused|selected|influence});
// setTextScale(100); page.focus() on a stepper.
// Run: node production/qa/evidence/sprint-011-head-2026-10-24/if-034/if034.mjs
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
const URL = process.env.PROBE_URL || 'http://localhost:4200/'
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
const dismissCard = () => store(async () => {
  const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
  useTutorialStore.getState().markSeen('hint-worldmap')
})
const setScale = (scale) => store(async (scale) => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setTextScale(scale)
}, scale)
const pause = () => store(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  useWorldStore.setState({ paused: true })
})
const setWorld = (patch) => store(async (patch) => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  useWorldStore.setState(patch)
}, patch)

async function opening() {
  await fresh(); await dismissCard(); await pause(); await setScale(100)
  await wait(300)
  if (await page.evaluate(() => !!document.querySelector('.wm-onboard-wrap'))) {
    note('card still up -> clicking UNDERSTOOD')
    await page.getByRole('button', { name: /UNDERSTOOD/ }).first().click()
    await wait(300)
  }
  await page.waitForFunction(() => !document.querySelector('.wm-onboard-wrap'), null, { timeout: 5000 })
  note('fixture opening ' + JSON.stringify(await read()))
}
async function influenceNote() {
  await opening()
  await setWorld({ influence: 8, selected: 'na' })
  await wait(500)
  note('fixture influence-note ' + JSON.stringify(await read()) + ' note=' + await page.evaluate(() => document.querySelectorAll('.wm-moment[role="note"]').length))
}

const PREV = '[aria-label="FOCUS PREVIOUS SECTOR"]'
const NEXT = '[aria-label="FOCUS NEXT SECTOR"]'
const NAMES = { na: 'NORTH AMERICA', sa: 'SOUTH AMERICA', eu: 'EUROPE', af: 'AFRICA', as: 'ASIA', oc: 'OCEANIA', an: 'ANTARCTICA' }
const read = () => page.evaluate(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const a = document.activeElement
  return {
    sel: useWorldStore.getState().selected,
    tag: document.querySelector('.wm-inset-tag')?.textContent.trim() ?? null,
    focus: a?.getAttribute('aria-label') || a?.tagName,
    scrollY: window.scrollY,
  }
})
const boxOf = (sel) => page.evaluate((sel) => {
  const r = document.querySelector(sel)?.getBoundingClientRect()
  return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null
}, sel)
const tagOk = (r) => !!r.tag && r.tag.startsWith(NAMES[r.sel] + ' //')
const antarctica = (r) => r.sel === 'an' || /ANTARCTICA/.test(r.tag || '')

// Runs 6 activations, compares with expected; returns summary string.
async function walk(id, expected, act, keyOpts = {}) {
  const got = []; let ant = 0; let tagBad = 0; let scrollBad = 0; let focusLost = 0
  for (let i = 0; i < 6; i++) {
    await act(i)
    await wait(200)
    const r = await read()
    got.push(r.sel)
    if (antarctica(r)) ant++
    if (!tagOk(r)) tagBad++
    if (r.scrollY !== 0) scrollBad++
    if (keyOpts.target && r.focus !== keyOpts.target) { focusLost++; keyOpts.lost = true }
    note(`${id} step${i + 1} ${JSON.stringify(r)}`)
  }
  const ok = JSON.stringify(got) === JSON.stringify(expected) && ant === 0
  note(`${id} ${ok ? 'OK' : 'MISMATCH'} got ${JSON.stringify(got)} expected ${JSON.stringify(expected)} antarctica ${ant} tagMismatch ${tagBad} scrollNonZero ${scrollBad}${keyOpts.target ? ' focusLostReadings ' + focusLost : ''}`)
}
const clickCentre = async (sel) => {
  const b = await boxOf(sel)
  await page.mouse.click(b.x + b.w / 2, b.y + b.h / 2)
}
const FWD = ['af', 'as', 'oc', 'na', 'sa', 'eu']
const BACK = ['sa', 'na', 'oc', 'as', 'af', 'eu']

// ---------- IF-034-02 hit area per sector
await opening()
for (const s of ['eu', 'na', 'sa', 'af', 'as', 'oc']) {
  await setWorld({ selected: s }); await wait(250)
  const res = await page.evaluate(() => ['.wm-inset-chev.l', '.wm-inset-chev.r'].map((sel) => {
    const el = document.querySelector(sel)
    const r = el.getBoundingClientRect()
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2
    let hit = 0; const miss = {}
    // 24x24 square centred on the box centre, 1 px pitch, sample at pixel centres.
    for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) {
      const x = cx - 12 + i + 0.5, y = cy - 12 + j + 0.5
      const e = document.elementFromPoint(x, y)
      if (e?.closest('.wm-inset-chev') === el) hit++
      else { const k = e ? (e.tagName + '.' + (typeof e.className === 'string' ? e.className : e.className?.baseVal)) : 'null'; miss[k] = (miss[k] || 0) + 1 }
    }
    return { sel, box: { x: r.x, y: r.y, w: r.width, h: r.height }, hit, miss }
  }))
  const tag = await page.evaluate(() => document.querySelector('.wm-inset-tag')?.textContent.trim())
  note(`IF-034-02 ${s} tag "${tag}" // ${JSON.stringify(res)}`)
  if (s === 'na') await shot('if-034-hit-area-na')
  if (s === 'eu') await shot('if-034-hit-area-eu')
}

// ---------- IF-034-03 / 04 click
await opening()
await walk('IF-034-03', FWD, () => clickCentre(NEXT))
await opening()
await walk('IF-034-04', BACK, () => clickCentre(PREV))

// ---------- IF-034-05 edge clicks
await opening()
{
  const b = await boxOf(NEXT)
  await page.mouse.click(b.x + 1, b.y + 1); await wait(200)
  const r1 = await read()
  await setWorld({ selected: 'eu' }); await wait(200)
  const p = await boxOf(PREV)
  await page.mouse.click(p.x + p.w - 2, p.y + p.h - 2); await wait(200)
  const r2 = await read()
  note(`IF-034-05 next@(${b.x + 1},${b.y + 1}) box ${JSON.stringify(b)} -> ${JSON.stringify(r1)} (expect af); prev@(${p.x + p.w - 2},${p.y + p.h - 2}) box ${JSON.stringify(p)} -> ${JSON.stringify(r2)} (expect sa)`)
}

// ---------- IF-034-06..09 keyboard
for (const [id, sel, label, key, exp] of [
  ['IF-034-06', NEXT, 'FOCUS NEXT SECTOR', 'Enter', FWD],
  ['IF-034-07', PREV, 'FOCUS PREVIOUS SECTOR', 'Enter', BACK],
  ['IF-034-08', NEXT, 'FOCUS NEXT SECTOR', 'Space', FWD],
  ['IF-034-09', PREV, 'FOCUS PREVIOUS SECTOR', 'Space', BACK],
]) {
  await opening()
  await page.focus(sel)
  const start = await read()
  note(`${id} focused before press 1: ${start.focus} (${start.focus === label ? 'confirmed' : 'NOT confirmed'})`)
  const opts = { target: label, lost: false }
  await walk(id, exp, async () => {
    const f = await read()
    if (f.focus !== label) { note(`${id} focus was on ${f.focus} before press -> refocusing (case step 5)`); await page.focus(sel) }
    await page.keyboard.press(key)
  }, opts)
  if (id === 'IF-034-09') {
    await page.focus(sel); await wait(150)
    note(`IF-034-09 capture focus ${(await read()).focus} focusVisible ${await page.evaluate((s) => document.querySelector(s).matches(':focus-visible'), sel)}`)
    await shot('if-034-keyboard-focus')
  }
}

// ---------- IF-034-11 absence under the note
await influenceNote()
{
  const count = await page.evaluate(() => document.querySelectorAll('[aria-label="FOCUS PREVIOUS SECTOR"], [aria-label="FOCUS NEXT SECTOR"]').length)
  const stops = { tab: [], shift: [] }
  for (const [k, combo] of [['tab', 'Tab'], ['shift', 'Shift+Tab']]) {
    await page.focus('.wm-moment-btn')
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press(combo)
      stops[k].push(await page.evaluate(() => { const a = document.activeElement; return a?.getAttribute('aria-label') || a?.textContent.trim().slice(0, 24) || a?.tagName }))
    }
  }
  const stepperStops = [...stops.tab, ...stops.shift].filter((s) => /FOCUS (PREVIOUS|NEXT) SECTOR/.test(s || '')).length
  const r = await read()
  note(`IF-034-11 count ${count} stepperStops ${stepperStops}/80 selected ${r.sel} note ${await page.evaluate(() => document.querySelectorAll('.wm-moment[role="note"]').length)}`)
  note(`IF-034-11 tab stops ${JSON.stringify(stops.tab)}`)
  note(`IF-034-11 shift+tab stops ${JSON.stringify(stops.shift)}`)
}

// ---------- IF-034-12 after the note
await influenceNote()
{
  // Script fix (run 3): at 1280x720 the note sits in the sector panel's scroll body
  // below its visible area (OPEN CONTRACTS header is on top of the button box), so a
  // user scrolls the panel first. Hit-grid UNDERSTOOD, real wheel over the panel, re-grid.
  const hitGrid = (label) => page.evaluate(() => {
    const b = document.querySelector('.wm-moment-btn'); const r = b.getBoundingClientRect()
    let hit = 0, n = 0
    for (let x = r.left + 0.5; x < r.right; x += 2) for (let y = r.top + 0.5; y < r.bottom; y += 2) { n++; if (document.elementFromPoint(x, y)?.closest('.wm-moment-btn') === b) hit++ }
    let sc = null
    for (let e = b.parentElement; e; e = e.parentElement) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight) { const er = e.getBoundingClientRect(); sc = { cls: e.className, top: er.top, bottom: er.bottom, scrollTop: e.scrollTop, scrollHeight: e.scrollHeight, clientHeight: e.clientHeight }; break } }
    return { box: { x: r.x, y: r.y, w: r.width, h: r.height }, hit, n, scroller: sc }
  }).then((g) => { note(`IF-034-12 UNDERSTOOD hit-grid ${label} ${JSON.stringify(g)}`); return g })
  const g0 = await hitGrid('before-scroll')
  if (g0.hit === 0 && g0.scroller) {
    await page.mouse.move(1110, 300)
    await page.mouse.wheel(0, 600); await wait(500)
    await hitGrid('after-wheel')
  }
  const ub = await boxOf('.wm-moment-btn')
  // Diagnostics (run 2): what the note is and what sits under the click point.
  const diag = () => page.evaluate(async ([x, y]) => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const e = document.elementFromPoint(x, y)
    const m = document.querySelector('.wm-moment')
    return { under: e ? e.tagName + '.' + e.className + ' "' + (e.textContent || '').trim().slice(0, 30) + '"' : null, noteLabel: m?.getAttribute('aria-label') ?? null, noteText: m?.textContent.trim().slice(0, 90) ?? null, moment: JSON.stringify(useWorldStore.getState().moment ?? null)?.slice(0, 200) }
  }, [ub.x + ub.w / 2, ub.y + ub.h / 2])
  note(`IF-034-12 pre-click box ${JSON.stringify(ub)} ${JSON.stringify(await diag())}`)
  await page.mouse.click(ub.x + ub.w / 2, ub.y + ub.h / 2); await wait(500)
  note(`IF-034-12 post-click +500ms ${JSON.stringify(await diag())}`)
  await wait(1500)
  note(`IF-034-12 post-click +2000ms ${JSON.stringify(await diag())}`)
  const st = await page.evaluate(() => ({
    note: document.querySelectorAll('.wm-moment').length,
    steppers: [...document.querySelectorAll('[aria-label="FOCUS PREVIOUS SECTOR"], [aria-label="FOCUS NEXT SECTOR"]')].map((b) => { const r = b.getBoundingClientRect(); return { l: b.getAttribute('aria-label'), x: r.x, y: r.y, w: r.width, h: r.height } }),
  }))
  const before = await read()
  let after = null
  if (st.steppers.length) { await page.focus(NEXT); await page.keyboard.press('Enter'); await wait(200); after = await read() }
  note(`IF-034-12 after UNDERSTOOD ${JSON.stringify(st)} before ${JSON.stringify(before)} after-Enter ${JSON.stringify(after)} (expect sa)`)
  await shot('if-034-after-note')
}

note(errs.length ? 'ERRORS ' + JSON.stringify(errs) : 'no console or page errors')
writeFileSync(OUT + 'run.log', log.join('\n') + '\n')
await browser.close()
