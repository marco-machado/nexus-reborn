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

// Focus sweep: Tab through a surface and check every stop draws the P-04
// bracket set (or, for a canvas / form field / SVG node, a 2px frame or its
// own dashed stroke), and that brackets drawn outside the box are not cut
// off by the element's own overflow.
async function focusSweep(surface, tabs) {
  const seen = []
  for (let i = 0; i < tabs; i++) {
    await page.keyboard.press('Tab')
    await wait(60)
    seen.push(
      await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        const name = (el.getAttribute('aria-label') || el.textContent || el.className.baseVal || el.className).toString().trim().slice(0, 28)
        const own = getComputedStyle(el)
        if (el instanceof SVGElement || /^(INPUT|SELECT|TEXTAREA|CANVAS)$/.test(el.tagName)) {
          const ok = el instanceof SVGElement || (own.outlineStyle !== 'none' && parseFloat(own.outlineWidth) >= 2)
          return { name, kind: 'frame', ok }
        }
        const face = el.querySelector(':scope > .cta-inner')
        const a = getComputedStyle(face || el, '::after')
        const strokes = (a.backgroundImage.match(/linear-gradient/g) || []).length
        const outside = parseFloat(a.top) < 0
        const clipped = outside && (own.overflow !== 'visible' || own.clipPath !== 'none')
        return { name, kind: 'brackets', ok: a.content !== 'none' && strokes === 8 && !clipped, clipped }
      }),
    )
  }
  const stops = seen.filter(Boolean)
  const bad = stops.filter((x) => !x.ok)
  report.focusSweep = report.focusSweep || {}
  report.focusSweep[surface] = { stops: stops.length, bad }
  check(`focus sweep ${surface}: brackets on every stop`, stops.length > 0 && bad.length === 0, `${stops.length} stops` + (bad.length ? '; bad: ' + bad.map((b) => b.name + (b.clipped ? ' (clipped)' : '')).join(', ') : ''))
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
  // P-04 bracket set: eight 2px strokes on ::after. A clip-path CTA draws
  // them on its face (.cta-inner::after) so the chevron cut does not clip them.
  const face = el.querySelector('.cta-inner')
  const s = getComputedStyle(face || el, '::after')
  const strokes = (s.backgroundImage.match(/linear-gradient/g) || []).length
  const ok = s.content !== 'none' && strokes === 8 && /2px/.test(s.backgroundSize)
  return {
    ok: el !== document.body && el.matches(':focus-visible') && ok,
    cue: `bracket set: ${strokes} strokes, sizes ${s.backgroundSize.split(',').slice(0, 2).join(',')} on "${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)}"`,
  }
})

await focusSweep('menu', 6)

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

await focusSweep('world-network', 40)
await page.mouse.click(5, 5)

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
      getComputedStyle(kia.querySelector('.hud-agent-name')).textDecorationLine.includes('line-through') &&
      getComputedStyle(inj.querySelector('.hud-hp')).outlineStyle === 'dashed' &&
      parseFloat(getComputedStyle(inj.querySelector('.hud-hp')).outlineWidth) >= 2,
    cue: `injured card: pips at ${inj?.querySelector('.hud-hp i')?.style.width} + health bar framed ${getComputedStyle(inj.querySelector('.hud-hp')).outlineWidth} ${getComputedStyle(inj.querySelector('.hud-hp')).outlineStyle} + "${injText.match(/\d+\/\d+/)?.[0]}" + "+ INJURED"; KIA card: skull glyph + "FLATLINED" + struck-through name`,
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
  const s = getComputedStyle(a)
  const glow = document.querySelector('.hud-edge-glow')
  return {
    ok: a.classList.contains('hot') && /ALERT: 2/.test(a.innerText) && parseFloat(s.borderTopWidth) >= 2 && s.fontWeight === '700' && !!glow,
    cue: `prints "${a.innerText.replace(/\s+/g, ' ').trim()}" bold (${s.fontWeight}) in a ${s.borderTopWidth} frame, blinking bars, edge glow ${glow ? 'on' : 'MISSING'}`,
  }
})

// Collateral and Credits (hud.md E4 / E5): the chip is a Telemetry Ink count
// with no CR; Credits print in Ledger Amber with the CR suffix.
await page.evaluate(async () => {
  const M = (await import('/src/state/missionStore.ts')).useMissionStore
  M.getState().setCiviliansHit(2)
})
await wait(700)
await shoot('10', 'collateral-credits', () => {
  const chip = document.querySelector('.hud-collateral')
  const cr = document.querySelector('.hud-credits')
  const cs = chip ? getComputedStyle(chip) : null
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()
  const crText = cr ? cr.innerText.replace(/\s+/g, ' ').trim() : ''
  return {
    ok: !!chip && /^COLLATERAL 2$/.test(chip.innerText.trim()) && !/CR/.test(chip.innerText) && cs.color === 'rgb(184, 216, 207)' && /CR$/.test(crText) && getComputedStyle(cr).color === 'rgb(255, 208, 117)',
    cue: `chip "${chip?.innerText.trim()}" in ${cs?.color} (ink ${ink}); credits "${crText}" in ${cr ? getComputedStyle(cr).color : '-'}`,
  }
})

// Minimap: the sim is frozen, so every unit and mark holds still and the only
// thing that changes between frames is the expanding objective pulse. Pixels
// that are VIP Ice in some frames and not in others are the pulse; VIP Ice
// pixels present in every frame are the static VIP / DEVICE marks. Also check
// no Ledger Amber or old DEVICE amber pixel appears in any frame.
// The minimap opens at its closest zoom, which can leave the objective zone
// off the canvas; zoom fully out to sample, then restore the zoom.
const mmOut = page.locator('[aria-label="Zoom minimap out"]')
while (await mmOut.isEnabled()) {
  await mmOut.click()
  await wait(150)
}
report.minimap = await page.evaluate(async () => {
  const c = document.querySelector('.minimap-canvas')
  if (!c) return { ok: false }
  const g = c.getContext('2d')
  const isVip = (r, gg, b) => b > 150 && gg > 150 && r < gg - 40 && b > r + 40 && b >= gg - 10
  const n = c.width * c.height
  const seen = new Uint8Array(n)
  let frames = 0
  let amber = 0
  for (let k = 0; k < 14; k++) {
    const d = g.getImageData(0, 0, c.width, c.height).data
    for (let i = 0, px = 0; i < d.length; i += 4, px++) {
      const [r, gg, b, a] = [d[i], d[i + 1], d[i + 2], d[i + 3]]
      if (a < 40) continue
      if (isVip(r, gg, b)) seen[px]++
      if (r > 180 && gg > 120 && gg < 215 && b < 110 && r > b + 90) amber++
    }
    frames++
    await new Promise((res) => setTimeout(res, 100))
  }
  let pulse = 0
  let steady = 0
  for (let px = 0; px < n; px++) {
    if (seen[px] === frames) steady++
    else if (seen[px] > 0) pulse++
  }
  return { ok: pulse > 0 && amber === 0, pulsePixels: pulse, steadyVipPixels: steady, amberPixels: amber, frames }
})
check('minimap: VIP Ice objective pulse animates, no amber', report.minimap.ok, JSON.stringify(report.minimap))
const mmIn = page.locator('[aria-label="Zoom minimap in"]')
while (await mmIn.isEnabled()) {
  await mmIn.click()
  await wait(150)
}

// High contrast: the same HUD (injured, KIA, Alert, Collateral) under
// :root.s-high-contrast, in colour and greyscale.
await page.evaluate(() => document.documentElement.classList.add('s-high-contrast'))
await wait(200)
await shoot('11', 'high-contrast', () => {
  const hc = document.documentElement.classList.contains('s-high-contrast')
  const a = document.querySelector('.hud-alert.hot')
  const inj = document.querySelector('.hud-hp.low')
  const sel = document.querySelector('.hud-agent.sel')
  return {
    ok: hc && !!a && !!inj && getComputedStyle(inj).outlineStyle === 'dashed' && !!sel && getComputedStyle(sel).outlineStyle === 'double',
    cue: `high contrast on: Alert frame ${a ? getComputedStyle(a).borderTopWidth : '-'}, injured bar ${inj ? getComputedStyle(inj).outlineStyle : '-'}, selection ${sel ? getComputedStyle(sel).outlineStyle : '-'}`,
  }
})
await page.evaluate(() => document.documentElement.classList.remove('s-high-contrast'))

await page.mouse.click(640, 400)
await focusSweep('mission-hud', 30)
await page.evaluate(() => document.activeElement?.blur())

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
    // Greyscale contrast of the title against the banner ground (#040a09).
    const lum = (rgb) => {
      const [r, g, bl] = rgb.match(/\d+/g).slice(0, 3).map((v) => {
        const c = Number(v) / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * bl
    }
    const title = b?.querySelector('.hud-banner-title')
    const ratio = title ? (lum(getComputedStyle(title).color) + 0.05) / (lum('rgb(4, 10, 9)') + 0.05) : 0
    // Lost also carries the failed-objective cross, so it differs from won by shape.
    const mark = !!b?.querySelector('.hud-banner-mark')
    const markOk = b?.classList.contains('lost') ? mark : !mark
    return { ok: /CONTRACT FULFILLED|SQUAD ELIMINATED/.test(t) && ratio >= 12 && markOk, cue: `banner prints "${t}"${mark ? ' + failed cross mark' : ''}; title contrast ${ratio.toFixed(1)}:1`, ratio }
  })
}

check('no page errors', errs.length === 0, errs.join(' | '))
writeFileSync(OUT + 'capture-result.json', JSON.stringify(report, null, 2))
console.log(fails ? `${fails} FAIL` : 'ALL PASS')
await browser.close()
process.exit(fails ? 1 : 0)
