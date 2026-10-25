// IF-017 hand-walks (IF-017-03, -04, -06, -08) at HEAD, headless Chrome for
// Testing at 1280x720. Launch + fixtures copied from
// production/qa/evidence/sprint-011/probe.mjs lines 22-60 and its fresh /
// dismissCard / pause / sector helpers. Harness assists: localStorage clear,
// save.startNewOperation, store setState (paused, selected, campaignFailed).
// Run: node production/qa/evidence/sprint-011-head-2026-10-24/if-017/walk.mjs
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
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const log = []
const note = (s) => { log.push(s); console.log(s) }
const J = (x) => JSON.stringify(x)

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
// Script fix: the dev server serves tutorialStore.ts with an HMR ?t= query
// (seen in performance entries), so a bare import gets a second store
// instance the app never reads. Import the exact URL the app loaded.
const dismissCard = () => store(async () => {
  const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('/src/state/tutorialStore.ts')) || '/src/state/tutorialStore.ts'
  const { useTutorialStore } = await import(url)
  useTutorialStore.getState().markSeen('hint-worldmap')
})
const pause = () => store(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  useWorldStore.setState({ paused: true })
})
const focus = async (id) => {
  await store(async (id) => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ selected: id })
  }, id)
  await wait(150)
}
const failed = async () => {
  await fresh(); await dismissCard(); await pause()
  await store(async () => {
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    useCampaignStore.setState({ campaignFailed: true })
  })
  await wait(500)
}
const opening = async () => { await fresh(); await dismissCard(); await pause() }
const app = () => page.evaluate(async () => {
  const s = (await import('/src/state/appStore.ts')).useAppStore.getState()
  return { phase: s.phase, missionId: s.missionId }
})
const intel = () => page.evaluate(async () => (await import('/src/state/campaignStore.ts')).useCampaignStore.getState().intelLevel)
const card = () => page.evaluate(() => !!document.querySelector('.wm-onboard-wrap'))
const rows = () => page.evaluate(() => {
  const empty = document.querySelector('.wm-empty')?.textContent ?? null
  return {
    empty,
    rows: [...document.querySelectorAll('.wm-op')].map((b) => ({
      name: b.querySelector('.wm-op-main b')?.textContent,
      reason: b.querySelector('.wm-op-main i')?.textContent,
      label: b.getAttribute('aria-label'),
      disabled: b.getAttribute('aria-disabled'),
      chips: [...b.querySelectorAll('.wm-op-meta .chip')].map((c) => c.textContent),
    })),
  }
})
const markers = () => page.evaluate(() => [...document.querySelectorAll('.globe-marker.contract')].map((m) => ({
  label: m.getAttribute('aria-label'),
  disabled: m.getAttribute('aria-disabled'),
  hidden: m.hasAttribute('hidden'),
  tip: m.querySelector('.tip i')?.textContent ?? null,
})))
const badRow = (r) => r.reason !== 'CAMPAIGN LOST' || !r.label?.endsWith('// LOCKED // CAMPAIGN LOST') || /REQUIRES INTEL LVL/.test(r.label + r.reason)
const waitGlobe = async () => {
  for (let i = 0; i < 60; i++) {
    const s = await page.evaluate(() => document.querySelector('.globe-status')?.textContent ?? null)
    if (s === null) return null
    await wait(250)
  }
  return page.evaluate(() => document.querySelector('.globe-status')?.textContent ?? null)
}

/* ------------------------------ failed fixture ------------------------------ */
await failed()
note('== FAILED fixture; intel ' + J(await intel()) + '; campaignFailed set; orientation card up=' + J(await card()))
const byRow = {}
let total = 0, bad = 0, genSeen = []
for (const sec of ['eu', 'na', 'as', 'sa', 'af', 'oc']) {
  await focus(sec)
  const r = await rows()
  total += r.rows.length
  for (const x of r.rows) {
    byRow[x.name] = x
    if (badRow(x)) bad++
    if (x.chips.some((c) => /GENERATED|PRIORITY/.test(c))) genSeen.push({ sec, name: x.name })
  }
  note(`ROWS ${sec} count=${r.rows.length} empty=${J(r.empty)} ${J(r.rows)}`)
}
note(`IF-017-03 rows total=${total} breaking=${bad} generated/priority rows=${J(genSeen)}`)
if (genSeen.length) {
  await focus(genSeen[0].sec)
  // Script fix: the generated row sits below the list fold; scroll it in.
  await page.locator('.wm-op', { hasText: genSeen[0].name }).first().scrollIntoViewIfNeeded()
  await wait(200)
  await shot('if-017-failed-generated-row'); note('captured if-017-failed-generated-row.png in ' + genSeen[0].sec)
  await page.evaluate(() => { const l = document.querySelector('.wm-ops-list'); if (l) l.scrollTop = 0; document.querySelectorAll('.wm-ops-list *').forEach((e) => { if (e.scrollTop) e.scrollTop = 0 }) })
}
else note('no generated row in fixture; no generated-row capture')

// IF-017-04 markers
await focus('eu')
const gs = await waitGlobe()
note('globe-status after wait: ' + J(gs))
const mk = await markers()
note('MARKERS ' + J(mk))
const mBad = mk.filter((m) => !m.label?.endsWith('// LOCKED // CAMPAIGN LOST') || m.disabled !== 'true' || m.tip !== 'CAMPAIGN LOST')
const disagree = mk.filter((m) => {
  const code = m.label?.split(' // ')[0]
  const row = byRow[code]
  if (!row) return true
  return row.label.split(' // LOCKED // ')[1] !== m.label.split(' // LOCKED // ')[1]
}).map((m) => m.label)
note(`IF-017-04 markers=${mk.length} breaking=${mBad.length} ${J(mBad)} disagree/no-row=${J(disagree)}`)
const gv = page.locator('.globe-marker.contract:not([hidden])', { hasText: 'GLASS VEIL' }).first()
if (await gv.count()) {
  await gv.hover()
  await wait(500)
  const tipVis = await page.evaluate(() => {
    const m = [...document.querySelectorAll('.globe-marker.contract:not([hidden])')].find((x) => x.getAttribute('aria-label')?.startsWith('GLASS VEIL'))
    const t = m?.querySelector('.tip'); if (!t) return null
    const cs = getComputedStyle(t); const r = t.getBoundingClientRect()
    return { hover: m.matches(':hover'), ancestorWmMarker: !!m.closest('.wm-marker'), display: cs.display, visibility: cs.visibility, opacity: cs.opacity, w: r.width, h: r.height, text: t.textContent }
  })
  note('hover GLASS VEIL tip computed ' + J(tipVis))
  await shot('if-017-failed-marker-tip')
  note('captured if-017-failed-marker-tip.png')
} else note('GLASS VEIL marker not visible (hidden) in eu focus; no hover')

// IF-017-06 clicks on every row in eu, na, as
const before = await app()
note('IF-017-06 before ' + J(before))
let changed = 0, notDisabled = 0, clicks = 0
for (const sec of ['eu', 'na', 'as']) {
  await focus(sec)
  const n = await page.locator('.wm-op').count()
  for (let i = 0; i < n; i++) {
    const row = page.locator('.wm-op').nth(i)
    const d = await row.getAttribute('aria-disabled')
    if (d !== 'true') notDisabled++
    // Script fix: Playwright's locator.click refuses aria-disabled elements
    // ("element is not enabled"); a real pointer click at the row centre via
    // page.mouse is the normal user click the case asks for.
    await row.scrollIntoViewIfNeeded()
    const bb = await row.boundingBox()
    const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2
    const hit = await page.evaluate(({ cx, cy }) => {
      const e = document.elementFromPoint(cx, cy); return !!e?.closest('.wm-op')
    }, { cx, cy })
    if (!hit) note(`WARN ${sec}#${i} centre hit-test does not land on the row`)
    await page.mouse.click(cx, cy)
    clicks++
    await wait(200)
    const a = await app()
    if (a.phase !== before.phase || a.missionId !== before.missionId) changed++
    note(`click ${sec}#${i} ${await row.getAttribute('aria-label').catch(() => '?')} aria-disabled=${d} -> ${J(a)}`)
    if (a.phase !== 'world') { await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().goto('world')); await wait(300); await focus(sec) }
  }
}
// keyboard: tab to a locked row
await focus('eu')
await page.evaluate(() => document.activeElement?.blur())
let focusedRow = false, tabs = 0
for (; tabs < 80; tabs++) {
  await page.keyboard.press('Tab')
  focusedRow = await page.evaluate(() => document.activeElement?.classList.contains('wm-op') ?? false)
  if (focusedRow) break
}
const fLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
note(`tab to row: focused=${focusedRow} after ${tabs + 1} Tab presses, label=${J(fLabel)}`)
let keyChanged = 0
for (const k of ['Enter', 'Space']) {
  await page.keyboard.press(k)
  await wait(200)
  const a = await app()
  const still = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
  if (a.phase !== before.phase || a.missionId !== before.missionId) keyChanged++
  note(`key ${k} -> ${J(a)} focus=${J(still)}`)
}
note(`IF-017-06 clicks=${clicks} changed=${changed} notDisabled=${notDisabled} keyChanged=${keyChanged} focusedRow=${focusedRow}`)

/* ------------------------------ opening fixture ----------------------------- */
await opening()
note('== OPENING fixture; intel ' + J(await intel()) + '; orientation card up=' + J(await card()))
await focus('eu')
const eu = await rows(); note('ROWS eu ' + J(eu.rows))
await shot('if-017-not-failed-locked-row'); note('captured if-017-not-failed-locked-row.png')
await focus('as')
const as = await rows(); note('ROWS as ' + J(as.rows))
await focus('na')
const na = await rows(); note('ROWS na ' + J(na.rows))
note('globe-status after wait: ' + J(await waitGlobe()))
const mk2 = await markers(); note('MARKERS ' + J(mk2))
const lost = await page.evaluate(() => {
  const t = (document.querySelector('.screen')?.innerText.match(/CAMPAIGN LOST/g) || []).length
  const l = [...document.querySelectorAll('[aria-label]')].filter((e) => /CAMPAIGN LOST/.test(e.getAttribute('aria-label'))).length
  return { text: t, labels: l }
})
const gvR = eu.rows.find((r) => r.name === 'GLASS VEIL'), hcR = as.rows.find((r) => r.name === 'HOLLOW CROWN'), rhR = na.rows.find((r) => r.name === 'RUST HAVEN')
const r1 = gvR?.reason === 'REQUIRES INTEL LVL 2' && gvR?.label === 'GLASS VEIL // LOCKED // REQUIRES INTEL LVL 2'
const r2 = hcR?.reason === 'REQUIRES INTEL LVL 2' && hcR?.label === 'HOLLOW CROWN // LOCKED // REQUIRES INTEL LVL 2'
const r3 = !!rhR?.label?.startsWith('OPEN CONTRACT RUST HAVEN') && rhR?.disabled === null
const lockedMk = mk2.filter((m) => m.label?.includes('// LOCKED //'))
const r4 = lockedMk.length > 0 && lockedMk.every((m) => m.label.endsWith('// LOCKED // REQUIRES INTEL LVL 2'))
note(`IF-017-08 GV=${r1} ${J(gvR)} | HC=${r2} ${J(hcR)} | RH=${r3} ${J(rhR)} | lockedMarkers=${r4} ${J(lockedMk.map((m) => m.label))} | CAMPAIGN LOST ${J(lost)}`)

note(errs.length ? 'ERRORS ' + J(errs) : 'no console or page errors')
writeFileSync(OUT + 'walk-output.txt', log.join('\n') + '\n')
await browser.close()
