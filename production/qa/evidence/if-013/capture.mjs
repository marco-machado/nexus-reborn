// IF-013 capture: the four-row orientation card, the sector panel at Influence
// 0, the Influence moment after a clean-win fixture, and Antarctica focused,
// each at 1280x720 and text scales 90 / 100 / 110 / 125 (TR-interface-002).
// Headless Chrome for Testing against a vite dev server.
// Harness assists, named: localStorage clear; New Operation through
// save.startNewOperation; text scale through the settings store; Influence
// set to 8 through the world store (the owner-reported clean-win fixture,
// WN Opening desk AC: a first clean win reads 8); Antarctica focused through
// worldStore.select (the sector button is inert for a locked sector). The two
// UNDERSTOOD buttons are real clicks.
//
// Run: npm run dev -- --strictPort --port 4213
//      SWEEP_URL=http://localhost:4213/ node production/qa/evidence/if-013/capture.mjs
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
const URL = process.env.SWEEP_URL || 'http://localhost:4213/'
const OUT = new globalThis.URL('.', import.meta.url).pathname
const SCALES = [90, 100, 110, 125]

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu'] })
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

const setScale = (scale) =>
  page.evaluate(async (scale) => {
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setTextScale(scale)
  }, scale)

// Text clipped by its own box or by the viewport. A bordered <button> reports
// scrollWidth as its border-box width, so buttons compare their text range to
// their padding box instead.
const clippedSel = (sel) =>
  page.evaluate((sel) => {
    const out = []
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect()
      let overflow = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
      if (el.tagName === 'BUTTON') {
        const range = document.createRange()
        range.selectNodeContents(el)
        const t = range.getBoundingClientRect()
        overflow = t.left < r.left - 0.5 || t.right > r.right + 0.5 || t.top < r.top - 0.5 || t.bottom > r.bottom + 0.5
      }
      const clip =
        overflow ||
        r.right > innerWidth + 0.5 ||
        r.bottom > innerHeight + 0.5 ||
        r.left < -0.5 ||
        r.top < -0.5
      if (clip) out.push(sel + ' ' + (el.textContent || '').slice(0, 40) + ' sw' + el.scrollWidth + '/cw' + el.clientWidth + ' sh' + el.scrollHeight + '/ch' + el.clientHeight + ' b' + Math.round(r.bottom))
    }
    return out
  }, sel)

const card = () =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.wm-onboard-row')]
    return {
      up: !!document.querySelector('.wm-onboard'),
      titles: rows.map((r) => r.querySelector('b')?.textContent ?? ''),
      startHere: rows.find((r) => r.dataset.row === 'start')?.querySelector('span')?.textContent ?? '',
      numbers: rows.find((r) => r.dataset.row === 'numbers')?.querySelectorAll('.wm-onboard-lines > span').length ?? 0,
      text: document.querySelector('.wm-onboard')?.textContent ?? '',
    }
  })

const panel = () =>
  page.evaluate(async () => {
    const acts = [...document.querySelectorAll('.wm-act')].map((b) => ({
      name: b.querySelector('.wm-act-name')?.textContent?.trim(),
      status: b.querySelector('.wm-act-status')?.textContent,
      disabled: b.disabled,
    }))
    const m = document.querySelector('.wm-moment')
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const ops = document.querySelector('.wm-ops')?.getBoundingClientRect()
    return {
      acts,
      moment: m ? m.textContent : null,
      seen: useTutorialStore.getState().seen,
      influence: useWorldStore.getState().influence,
      selected: useWorldStore.getState().selected,
      opsBottom: ops ? Math.round(ops.bottom) : null,
      opsHeight: ops ? Math.round(ops.height) : null,
      inset: !!document.querySelector('.wm-inset'),
      rightOver: (() => { const c = document.querySelector('.wm-right'); return c ? c.scrollHeight - c.clientHeight : null })(),
    }
  })

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
  await wait(900)
}

try {
  // 1. The card, four scales.
  await fresh()
  for (const scale of SCALES) {
    await setScale(scale)
    await wait(350)
    const c = await card()
    check(`card@${scale}: up with four rows THE JOB / START HERE / STRATEGIC TIME / THE FOUR NUMBERS`, c.up && c.titles.join('|') === 'THE JOB|START HERE|STRATEGIC TIME|THE FOUR NUMBERS', c.titles.join('|'))
    check(`card@${scale}: no Influence or Research row`, !/INFLUENCE|RESEARCH/.test(c.titles.join('|')))
    check(`card@${scale}: START HERE names the highest-Chance open contract and its Chance`, /Start with [A-Z0-9 \-]+ in .+highest Chance \(\d+%\)/.test(c.startHere), c.startHere)
    check(`card@${scale}: Pause/Clock speed as control over strategic time; Nexus-held Tax`, c.text.includes('Pause and Clock speed control strategic time') && c.text.includes('Nexus-held'))
    check(`card@${scale}: four number lines`, c.numbers === 4, String(c.numbers))
    const clip = [
      ...(await clippedSel('.wm-onboard-row b')),
      ...(await clippedSel('.wm-onboard-row > span')),
      ...(await clippedSel('.wm-onboard-lines > span')),
      ...(await clippedSel('.wm-onboard')),
      ...(await clippedSel('.wm-onboard .hud-btn')),
    ]
    check(`card@${scale}: nothing clipped`, clip.length === 0, clip.join(' ; '))
    await shot(`01-card-${scale}`)
  }

  // 2. UNDERSTOOD: hint-worldmap seen once; the card does not return.
  await setScale(100)
  await page.click('button[aria-label="Dismiss the orientation"]')
  await wait(300)
  let p = await panel()
  check('UNDERSTOOD marks hint-worldmap seen exactly once', p.seen.filter((id) => id === 'hint-worldmap').length === 1 && !(await card()).up, JSON.stringify(p.seen))
  await page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('research')
    useAppStore.getState().goto('world')
  })
  await wait(500)
  check('card does not return after leaving and re-entering World Network', !(await card()).up)

  // 3. Sector panel at Influence 0, four scales: owner reasons, no moment.
  // Europe (default focus) holds the EC-023 seeded offer, so Expedite has a
  // target there and the owner reports UNAFFORDABLE (0 < 12 PTS); North
  // America lists no generated offer and reports NO TARGET. Both are the
  // owner's reasons (AC27); the no-target screen is captured at 100.
  for (const scale of SCALES) {
    await setScale(scale)
    await wait(350)
    p = await panel()
    check(`influence0@${scale}: Europe: Stabilize, Lobby and Expedite (seeded target) UNAFFORDABLE, all disabled`,
      p.influence === 0 && p.selected === 'eu' && p.acts.length === 3 && p.acts.every((a) => a.status === 'UNAFFORDABLE' && a.disabled),
      JSON.stringify(p.acts))
    check(`influence0@${scale}: no teaching panel, inset shown`, p.moment === null && p.inset)
    const clip = [...(await clippedSel('.wm-act-name')), ...(await clippedSel('.wm-act-status')), ...(await clippedSel('.wm-right'))]
    check(`influence0@${scale}: nothing clipped`, clip.length === 0 && p.rightOver <= 0, clip.join(' ; ') + ' over ' + p.rightOver)
    await shot(`02-sector-panel-influence-0-${scale}`)
  }
  await setScale(100)
  await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.getState().select('na')
  })
  await wait(350)
  p = await panel()
  check('influence0: North America (no generated offer): Stabilize and Lobby UNAFFORDABLE, Expedite NO TARGET, no teaching panel',
    p.selected === 'na' && p.acts[0].status === 'UNAFFORDABLE' && p.acts[1].status === 'UNAFFORDABLE' && p.acts[2].status === 'NO TARGET' && p.acts.every((a) => a.disabled) && p.moment === null,
    JSON.stringify(p.acts))
  await shot('02b-sector-panel-influence-0-no-target-na-100')
  await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.getState().select('eu')
  })
  await wait(350)

  // 4. Clean-win fixture: Influence 8, moment unseen -> one panel names Stabilize.
  await setScale(100)
  await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ influence: 8 })
  })
  await wait(400)
  for (const scale of SCALES) {
    await setScale(scale)
    await wait(350)
    p = await panel()
    check(`moment@${scale}: one note names STABILIZE, 8 PTS and the effect; inset yields its slot`,
      p.moment !== null && p.moment.includes('INFLUENCE // 1 STABILIZE') && p.moment.includes('Affordable now: 8 PTS') && p.moment.includes('-12 UNREST OVER 6H') && !p.inset,
      String(p.moment) + ' inset ' + p.inset)
    check(`moment@${scale}: Stabilize CLEAR and enabled, Lobby and Expedite UNAFFORDABLE`,
      p.acts[0].status === 'CLEAR' && !p.acts[0].disabled && p.acts[1].status === 'UNAFFORDABLE' && p.acts[2].status === 'UNAFFORDABLE', JSON.stringify(p.acts))
    check(`moment@${scale}: hint-influence marked seen once on firing`, p.seen.filter((id) => id === 'hint-influence').length === 1, JSON.stringify(p.seen))
    check(`moment@${scale}: OPEN CONTRACTS still on screen with its list`, p.opsBottom !== null && p.opsBottom <= 720 && p.opsHeight > 60, `bottom ${p.opsBottom} h ${p.opsHeight}`)
    const clip = [...(await clippedSel('.wm-moment-title')), ...(await clippedSel('.wm-moment-body')), ...(await clippedSel('.wm-moment-btn')), ...(await clippedSel('.wm-moment')), ...(await clippedSel('.wm-right'))]
    check(`moment@${scale}: nothing clipped`, clip.length === 0 && p.rightOver <= 0, clip.join(' ; ') + ' over ' + p.rightOver)
    await shot(`03-influence-moment-${scale}`)
  }
  const panels = await page.evaluate(() => document.querySelectorAll('.wm-moment').length)
  check('exactly one teaching panel', panels === 1, String(panels))

  // 5. Dismiss: seen once; spend then recover: never returns.
  await setScale(100)
  await page.click('button[aria-label="Dismiss the Influence note"]')
  await wait(300)
  p = await panel()
  check('dismiss closes the note, restores the inset and keeps hint-influence seen exactly once', p.moment === null && p.inset && p.seen.filter((id) => id === 'hint-influence').length === 1, JSON.stringify(p.seen))
  await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ influence: 0 })
  })
  await wait(300)
  await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ influence: 20 })
    useWorldStore.getState().select('na')
  })
  await wait(400)
  p = await panel()
  check('never returns after Influence is spent and recovers, on another sector too', p.moment === null && p.influence === 20 && p.selected === 'na', JSON.stringify({ moment: p.moment, influence: p.influence }))
  const seen = p.seen
  check('seen holds hint-worldmap and hint-influence exactly once each', seen.filter((id) => id === 'hint-worldmap').length === 1 && seen.filter((id) => id === 'hint-influence').length === 1, JSON.stringify(seen))
  await page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('research')
    useAppStore.getState().goto('world')
  })
  await wait(500)
  check('never returns after leaving and re-entering World Network', (await panel()).moment === null)

  // 6. Antarctica focused, moment unseen, Influence 8: no panel (locked-sector).
  await fresh()
  await page.click('button[aria-label="Dismiss the orientation"]')
  await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ influence: 8 })
    useWorldStore.getState().select('an')
  })
  await wait(400)
  for (const scale of SCALES) {
    await setScale(scale)
    await wait(350)
    p = await panel()
    check(`antarctica@${scale}: no actions offered, no teaching panel, moment unseen`, p.selected === 'an' && p.acts.length === 0 && p.moment === null && !p.seen.includes('hint-influence'), JSON.stringify({ acts: p.acts, moment: p.moment, seen: p.seen }))
    await shot(`04-antarctica-focused-${scale}`)
  }
  // Re-focusing an open sector fires it then, from the same state.
  await setScale(100)
  await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.getState().select('eu')
  })
  await wait(400)
  p = await panel()
  check('refocusing Europe at Influence 8 fires the moment once', p.moment !== null && p.seen.filter((id) => id === 'hint-influence').length === 1)
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
}

check('no console or page errors', errs.length === 0, errs.join(' | '))
note(fails === 0 ? 'ALL PASS' : `${fails} FAIL`)
writeFileSync(`${OUT}capture-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails === 0 ? 0 : 1)
