// IF-002 capture: each critical state once in colour and once under
// `filter: grayscale(1)`, plus the Menu and Mission HUD style captures.
//
// Drives the real app on the dev server (port 4200) in headless Chrome for
// Testing at 1280x720. For each state it retains <nn>-<state>-colour.png and
// <nn>-<state>-grey.png and prints the non-colour cue it found in the DOM
// (word, mark, frame). It also scans the Mission HUD for any element painted
// Nominal Green (#7de08a), which must not be a tactical-feed cue.
//
// Harness assists, named where applied:
//  - Focus is reached with the Tab key (keyboard focus, :focus-visible).
//  - Injury/KIA, Alert and result: the sim is frozen (missionStore.live =
//    false, so tickIfLive stops ticking) and the HUD store is written with
//    the same setters the sim calls (setSquad / setAlert / setResult). This
//    shows each state on demand; it does not exercise the sim's rules.
//
// Run: node production/qa/evidence/if-002/capture.mjs   (dev server on :4200)
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
async function until(fn, timeoutMs) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    if (await page.evaluate(fn)) return
    await wait(250)
  }
  throw new Error('timed out: ' + fn.toString().slice(0, 80))
}

const report = { states: {}, styles: {}, greenInHud: null, errors: errs }
let fails = 0
function check(name, ok, detail) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' -- ' + detail : ''))
  if (!ok) fails++
}

// One state: colour shot, greyscale shot, and the cue read from the DOM.
async function shoot(n, state, cue) {
  const base = `${OUT}${n}-${state}`
  await page.screenshot({ path: base + '-colour.png' })
  await page.evaluate(() => (document.documentElement.style.filter = 'grayscale(1)'))
  await wait(120)
  await page.screenshot({ path: base + '-grey.png' })
  await page.evaluate(() => (document.documentElement.style.filter = ''))
  const found = await page.evaluate(cue)
  report.states[state] = found
  check(`${n} ${state}: non-colour cue`, !!found.ok, found.cue)
}

// Computed style facts for AC3.
async function styles(surface) {
  report.styles[surface] = await page.evaluate(() => {
    const cs = (el) => (el ? getComputedStyle(el) : null)
    const body = cs(document.body)
    const labels = [...document.querySelectorAll('.hud-panel-head span, .wm-resource small, .menu-sub, .menu-btn, button')]
      .filter((el) => el.offsetParent && el.textContent.trim())
      .slice(0, 40)
    const lowerCase = labels.filter((el) => {
      const t = el.textContent.trim()
      return getComputedStyle(el).textTransform !== 'uppercase' && t !== t.toUpperCase()
    }).map((el) => el.textContent.trim().slice(0, 30))
    return {
      ground: body.backgroundColor,
      font: body.fontFamily,
      labelsChecked: labels.length,
      labelsNotUppercase: lowerCase,
    }
  })
}

// ---------------------------------------------------------------- Menu
await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await wait(1500)
await styles('menu')
await page.screenshot({ path: OUT + '01-menu-colour.png' })
await page.evaluate(() => (document.documentElement.style.filter = 'grayscale(1)'))
await page.screenshot({ path: OUT + '01-menu-grey.png' })
await page.evaluate(() => (document.documentElement.style.filter = ''))

// Focus: Tab onto the first Menu control.
await page.keyboard.press('Tab')
await wait(200)
await shoot('02', 'focus', () => {
  const el = document.activeElement
  // A clip-path CTA draws the frame inset on its face; anything else outlines.
  const face = el.querySelector('.cta-inner')
  const s = getComputedStyle(face || el)
  const frame = face ? s.boxShadow : `outline ${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} offset ${s.outlineOffset}`
  const ok = face ? /inset/.test(s.boxShadow) && s.boxShadow.includes('126, 240, 212') : s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2
  return {
    ok: el !== document.body && el.matches(':focus-visible') && ok,
    cue: `frame: ${frame} on "${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)}"`,
  }
})

// ---------------------------------------------------------------- Lock
await page.getByText('NEW OPERATION').first().click()
await wait(1500)
const d = page.locator('[aria-label="Dismiss the orientation"]')
if (await d.count()) {
  await d.click()
  await wait(300)
}
await shoot('03', 'lock', () => {
  const tab = document.querySelector('.navtab.locked')
  const sel = document.querySelector('.navtab.active')
  const t = tab ? tab.innerText.replace(/\s+/g, ' ').trim() : ''
  const ss = sel ? getComputedStyle(sel) : null
  return {
    ok: !!tab && /LOCKED/.test(t) && /NO CONTRACT SELECTED/.test(t) && !!tab.querySelector('svg') && !!ss && parseFloat(ss.borderTopWidth) >= 2,
    cue: `locked tab prints "${t}" + lock glyph; selected tab "${sel?.innerText.trim()}" framed ${ss?.borderTopWidth} ${ss?.borderTopStyle} (${ss?.color})`,
  }
})

// ---------------------------------------------------------------- Mission
await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().click()
await wait(900)
await page.locator('[aria-label^="ACCEPT CONTRACT"]').click()
await wait(900)
for (let i = 0; i < 8; i++) {
  const assign = page.locator('button[aria-label^="ASSIGN "]:not([disabled])')
  if (/4 \/ 4 ASSIGNED/.test(await page.innerText('body')) || (await assign.count()) === 0) break
  await assign.first().click()
  await wait(150)
}
await page.locator('[aria-label^="DEPLOY STRIKE TEAM"]').click()
await until(async () => !!(await import('/src/game/runtime.ts')).getWorld(), 60000)
await wait(3000)
// Tutorial toasts sit over the HUD; skip them so every panel is in frame.
const skip = page.locator('button', { hasText: /SKIP TUTORIAL/i })
if (await skip.count()) {
  await skip.first().click()
  await wait(300)
}

// Selection: slot 1, then slot 2 added with shift (multi-select).
await page.keyboard.press('Digit1')
await wait(300)
await page.locator('.hud-agent').nth(1).click({ modifiers: ['Shift'] })
await wait(400)
await styles('mission-hud')
await shoot('04', 'selection', () => {
  const sel = [...document.querySelectorAll('.hud-agent.sel')]
  const s = sel[0] ? getComputedStyle(sel[0]) : null
  const slot = sel[0]?.querySelector('.hud-agent-slot')
  const before = slot ? getComputedStyle(slot, '::before').content : ''
  return {
    ok: sel.length === 2 && s.outlineStyle === 'double' && parseFloat(s.outlineWidth) >= 3 && before.includes('['),
    cue: `${sel.length} cards: closed double ring (outline ${s?.outlineStyle} ${s?.outlineWidth} ${s?.outlineColor}) + bracketed slot ${before}${slot?.textContent}]`,
  }
})

// Objective: the active row's mark and printed token.
await shoot('05', 'objective', () => {
  const row = document.querySelector('.hud-obj.active')
  const tok = row?.querySelector('.hud-obj-tok')?.textContent
  const mark = row?.querySelector('.hud-obj-mark polygon')
  return {
    ok: !!row && tok === 'ACTIVE' && !!mark && getComputedStyle(row).color === 'rgb(155, 232, 255)',
    cue: `"${row?.querySelector('.hud-obj-text')?.textContent}" prints token "${tok}" + triangle mark (${mark?.getAttribute('fill')}); row colour ${row ? getComputedStyle(row).color : '-'}`,
  }
})

// Freeze the sim; from here the HUD store is written directly (named assist).
await page.evaluate(async () => {
  const M = (await import('/src/state/missionStore.ts')).useMissionStore
  M.setState({ live: false })
})
await wait(200)

// Injury/KIA: slot 2 at 20% health, slot 3 flatlined.
await page.evaluate(async () => {
  const M = (await import('/src/state/missionStore.ts')).useMissionStore
  const rows = M.getState().squad.map((r, i) =>
    i === 1 ? { ...r, hp: Math.round(r.maxHp * 0.2) } : i === 2 ? { ...r, hp: 0, dead: true, holdGround: false, holdFire: false } : r,
  )
  M.getState().setSquad(rows)
})
await wait(300)
await shoot('06', 'injury-kia', () => {
  const cards = [...document.querySelectorAll('.hud-agent')]
  const inj = cards[1]
  const kia = cards[2]
  const injText = inj?.innerText.replace(/\s+/g, ' ') ?? ''
  const kiaText = kia?.innerText.replace(/\s+/g, ' ') ?? ''
  return {
    ok:
      /INJURED/.test(injText) && !!inj.querySelector('.hud-hp.low') &&
      /FLATLINED/.test(kiaText) && !!kia.querySelector('.hud-flatline svg') &&
      getComputedStyle(kia.querySelector('.hud-agent-name')).textDecorationLine.includes('line-through'),
    cue: `injured card: pips at ${inj?.querySelector('.hud-hp i')?.style.width} (dashed frame) + "${injText.match(/\d+\/\d+/)?.[0]}" + "+ INJURED"; KIA card: skull glyph + "FLATLINED" + struck-through name`,
  }
})

// Alert 2.
await page.evaluate(async () => {
  const M = (await import('/src/state/missionStore.ts')).useMissionStore
  M.getState().setAlert(2)
})
await wait(300)
await shoot('07', 'alert', () => {
  const a = document.querySelector('.hud-alert')
  return {
    ok: a.classList.contains('hot') && /ALERT: 2/.test(a.innerText),
    cue: `prints "${a.innerText.replace(/\s+/g, ' ').trim()}" with blinking bars (hot)`,
  }
})

// Green scan over the HUD (tactical feed), before the result banner.
report.greenInHud = await page.evaluate(() => {
  const hits = []
  for (const el of document.querySelectorAll('.hud-root *, .hud *')) {
    const s = getComputedStyle(el)
    if ([s.color, s.backgroundColor, s.borderTopColor].some((c) => c === 'rgb(125, 224, 138)')) hits.push(el.className + ' "' + el.textContent.trim().slice(0, 30) + '"')
  }
  return hits
})
check('Mission HUD: no Nominal Green cue', report.greenInHud.length === 0, report.greenInHud.join('; ') || 'none painted')

// Result: won, then lost.
for (const [n, r] of [['08', 'won'], ['09', 'lost']]) {
  await page.evaluate(async (r) => {
    const M = (await import('/src/state/missionStore.ts')).useMissionStore
    M.getState().setResult(r)
  }, r)
  await wait(700)
  await shoot(n, 'result-' + r, () => {
    const b = document.querySelector('.hud-banner')
    const t = b ? b.innerText.replace(/\s+/g, ' ').trim() : ''
    return { ok: /CONTRACT FULFILLED|SQUAD ELIMINATED/.test(t), cue: `banner prints "${t}"` }
  })
}

check('no page errors', errs.length === 0, errs.join(' | '))
writeFileSync(OUT + 'capture-result.json', JSON.stringify(report, null, 2))
console.log(fails ? `${fails} FAIL` : 'ALL PASS')
await browser.close()
process.exit(fails ? 1 : 0)
