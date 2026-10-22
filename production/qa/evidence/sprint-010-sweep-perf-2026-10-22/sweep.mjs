// IF-001 sweep: every listed surface at 1280x720 and each text scale.
//
// Sprint 10 copy (2026-10-22) of production/qa/evidence/if-001/sweep.mjs.
// Changes: the Brief is Rust Haven (WN-020 locks Glass Veil at intel 1), and
// destroy objectives are played with grenades (ADR-0016: a Device is never an
// Attack target); when no Power Cell is left the nearest device is set dead by
// hand (the world.test.ts assist). Both assists are named in the output.
//
// Drives the real app on the dev server (port 4200) in headless Chrome for
// Testing. For each of 9 surfaces x 4 scales it retains a screenshot and runs
// two DOM checks, printing failures per surface:
//   CLIP     - text whose box leaves a non-scrolling container, ellipsized
//              text, or an overflow:hidden box whose content is wider/taller
//              than it (scrollWidth > clientWidth) with a text leaf outside
//              it. Content inside a scroll container is reachable by
//              scrolling and is not a clip.
//   OVERLAP  - two visible text/control boxes (neither containing the other)
//              intersecting by more than 1px on both axes, inside the same
//              layer. Declared overlays (Settings, Balance, pause: every
//              .hud-menu-wrap; tutorial toasts: .hud-toasts) are their own
//              layers, so overlay-over-screen is never counted; overlap
//              *inside* an overlay is. Two boxes in the same scroll
//              container are compared on their unclipped boxes, so content
//              below the fold is checked too.
// Both checks run at every scroll position: each scroll container is stepped
// through its full range (half a viewport per step, plus the end). The output
// names each scrolled container and any box never overlap-checked.
// Plus one sub-minimum capture (1100x650) showing the layout keeps its
// 1280x720 minimum and the window scrolls.
//
// Harness assists, named where applied: the text scale is set through the live
// settings store (same call as the Settings buttons); the Debrief is reached by
// playing the mission with the sim's own order API, squad kept at full health
// ("god" assist). The outcome is computed by the sim; nothing writes it.
//
// Run: node production/qa/evidence/if-001/sweep.mjs   (dev server on :4200)
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')

// SWEEP_CHROME overrides the browser binary (default: the Playwright
// chromium-1247 build on macOS arm64). Needs `vite dev`: the harness imports
// /src modules at runtime.
const CHROME =
  process.env.SWEEP_CHROME ||
  process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.SWEEP_URL || 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname
const SCALES = [90, 100, 110, 125]

const browser = await chromium.launch({ executablePath: CHROME, headless: process.env.HEADED ? false : true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
const consoleInfo = []
page.on('console', (m) => {
  if (m.type() === 'error') errs.push('console ' + m.text())
  else if (/renderer|webgpu|webgl/i.test(m.text())) consoleInfo.push(m.text())
})
page.on('response', (r) => r.status() >= 400 && errs.push('HTTP ' + r.status() + ' ' + r.url()))
page.on('requestfailed', (q) => errs.push('requestfailed ' + q.url() + ' ' + (q.failure()?.errorText ?? '')))

const wait = (ms) => page.waitForTimeout(ms)
// Polls an async in-page predicate (page.waitForFunction treats the returned
// Promise itself as truthy, so it cannot await a dynamic import).
async function until(fn, timeoutMs) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    if (await page.evaluate(fn)) return
    await wait(250)
  }
  throw new Error('timed out: ' + fn.toString().slice(0, 80))
}
const report = { surfaces: {}, subMinimum: null, renderer: null, errors: errs }

async function setScale(s) {
  await page.evaluate(async (s) => {
    const S = (await import('/src/state/settingsStore.ts')).useSettingsStore
    S.getState().setTextScale(s)
  }, s)
  await wait(300)
}

// The DOM check. Runs in the page. Every scroll container is stepped through
// its whole range (one container at a time, the others left where they were)
// and the checks run at every position, so content below the fold is checked
// too. Overlap between two boxes in the same scroll container is measured on
// their unclipped boxes (their relative position does not change with
// scrolling), clipped only by overflow-hidden boxes inside that container.
function inspect() {
  const OVERLAY = '.hud-menu-wrap, .hud-toasts'
  const SKIP = '.globe-view, svg, canvas, [aria-hidden="true"], .crt-overlay'
  const isScroll = (s) => /auto|scroll/.test(s.overflowY) || /auto|scroll/.test(s.overflowX)
  const clipsOverflow = (s) => /hidden|clip/.test(s.overflowY) || /hidden|clip/.test(s.overflowX)
  // Per-axis: an axis is reachable only when that axis itself scrolls.
  const ov = (s, ax) => (ax === 'x' ? s.overflowX : s.overflowY)
  const scrollsAx = (s, ax) => /auto|scroll/.test(ov(s, ax))
  const clipsAx = (s, ax) => /hidden|clip/.test(ov(s, ax))
  // A clip-path (the chevron CTAs) clips its own box on both axes.
  const clipPathed = (s) => !!s.clipPath && s.clipPath !== 'none'
  const bordered = (s, side) => parseFloat(s['border' + side + 'Width']) > 0 && s['border' + side + 'Style'] !== 'none'
  // Box of the rendered glyphs (a block's own box can be wider than its text,
  // and nowrap text can run past it).
  const textRect = (el) => {
    let b = null
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue
      const rg = document.createRange()
      rg.selectNodeContents(n)
      for (const q of rg.getClientRects()) {
        if (q.width <= 0 || q.height <= 0) continue
        b = b ? { left: Math.min(b.left, q.left), top: Math.min(b.top, q.top), right: Math.max(b.right, q.right), bottom: Math.max(b.bottom, q.bottom) } : { left: q.left, top: q.top, right: q.right, bottom: q.bottom }
      }
    }
    return b || el.getBoundingClientRect()
  }
  const label = (el) =>
    (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : el.tagName.toLowerCase()) +
    ' "' + (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32) + '"'
  const visible = (el) =>
    el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && (() => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })()
  const clipTo = (box, a) => {
    const ar = a.getBoundingClientRect()
    return { l: Math.max(box.l, ar.left), t: Math.max(box.t, ar.top), r: Math.min(box.r, ar.right), b: Math.min(box.b, ar.bottom) }
  }
  const nonEmpty = (box) => (box.r - box.l > 1 && box.b - box.t > 1 ? box : null)
  const rectBox = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom } }
  // Visible part of a box after every scroll/clip ancestor (null when fully hidden).
  const shown = (el) => {
    let box = rectBox(el)
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      if (clipsOverflow(getComputedStyle(a)) || isScroll(getComputedStyle(a))) box = clipTo(box, a)
    }
    return nonEmpty(box)
  }
  // Innermost scroll container, and the box clipped only by overflow-hidden
  // boxes between the element and that container (null when hidden by one).
  const inContainer = (el) => {
    let box = rectBox(el)
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a)
      if (isScroll(s)) return { ctx: a, box: nonEmpty(box) }
      if (clipsOverflow(s)) box = clipTo(box, a)
    }
    return { ctx: null, box: nonEmpty(box) }
  }

  const all = [...document.querySelectorAll('body *')].filter((el) => !el.closest(SKIP))
  const textLeaves = all.filter(
    (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visible(el),
  )
  const controls = all.filter((el) => el.matches('button, input, select, textarea, [role="button"], [role="slider"]') && visible(el))
  const candidates = [...new Set([...textLeaves, ...controls])]

  const clips = new Set()
  const overlaps = new Set()
  const checkedEls = new Set()

  function once() {
    // Per axis, walking up: text past an ancestor on an axis that scrolls is
    // reachable (and that axis is settled); past one that clips it is CLIPPED;
    // past a drawn border of a visible-overflow box it is a SPILL.
    for (const el of textLeaves) {
      const r = textRect(el)
      const s = getComputedStyle(el)
      if (s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) { clips.add('ELLIPSIS ' + label(el)); continue }
      const settled = { x: false, y: false }
      if (clipPathed(s)) {
        const er = el.getBoundingClientRect()
        if (r.right > er.right + 1 || r.left < er.left - 1 || r.bottom > er.bottom + 1 || r.top < er.top - 1) {
          clips.add('CLIPPED ' + label(el) + ' by its own clip-path')
          continue
        }
      }
      walk: for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const as = getComputedStyle(a)
        const ar = a.getBoundingClientRect()
        const sides = {
          x: [[r.right > ar.right + 1, 'Right'], [r.left < ar.left - 1, 'Left']],
          y: [[r.bottom > ar.bottom + 1, 'Bottom'], [r.top < ar.top - 1, 'Top']],
        }
        for (const ax of ['x', 'y']) {
          if (settled[ax]) continue
          const out = sides[ax].filter(([o]) => o)
          if (scrollsAx(as, ax)) { settled[ax] = true; continue }
          if (!out.length) continue
          if (clipsAx(as, ax) || clipPathed(as)) { clips.add('CLIPPED ' + label(el) + ' in ' + label(a).split(' ')[0]); break walk }
          if (out.some(([, side]) => bordered(as, side))) { clips.add('SPILL ' + label(el) + ' past ' + label(a).split(' ')[0]); break walk }
        }
        if (settled.x && settled.y) break
        if (as.position === 'absolute' || as.position === 'fixed') break
      }
    }
    // Any ellipsized or line-clamped box whose content is cut (the ellipsis may
    // sit on a parent of the text, or on an inline child with no own width).
    for (const el of all) {
      if (!visible(el) || !el.textContent.trim()) continue
      const s = getComputedStyle(el)
      if (s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) clips.add('ELLIPSIS ' + label(el))
      else if (s.webkitLineClamp && s.webkitLineClamp !== 'none' && el.scrollHeight > el.clientHeight + 1) clips.add('LINE-CLAMP ' + label(el))
    }
    // Overflow-hidden boxes holding more text than they show.
    for (const el of all) {
      const s = getComputedStyle(el)
      if (!clipsOverflow(s) || !visible(el) || !el.textContent.trim()) continue
      // Per axis: a scrolling axis is reachable, a hidden one is not.
      const w = clipsAx(s, 'x') && el.scrollWidth > el.clientWidth + 1
      const h = clipsAx(s, 'y') && el.scrollHeight > el.clientHeight + 1
      if (!w && !h) continue
      // Only a defect when a visible text leaf actually lies outside it.
      const r = el.getBoundingClientRect()
      const lost = textLeaves.some((t) => {
        if (!el.contains(t) || t === el) return false
        // A leaf behind a scroll container inside el is reachable on that
        // container's scrolling axes.
        let rx = false, ry = false
        for (let a = t.parentElement; a && a !== el; a = a.parentElement) {
          const as = getComputedStyle(a)
          rx ||= scrollsAx(as, 'x'); ry ||= scrollsAx(as, 'y')
        }
        const tr = textRect(t)
        const lx = w && !rx && (tr.right > r.right + 1 || tr.left < r.left - 1)
        const ly = h && !ry && (tr.bottom > r.bottom + 1 || tr.top < r.top - 1)
        return lx || ly
      })
      if (lost) clips.add('OVERFLOW-HIDDEN ' + label(el) + ` (${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight})`)
    }
    // Page level: anything past the viewport must be reachable by page scroll.
    const se = document.scrollingElement
    const bodyStyle = getComputedStyle(document.body)
    if ((se.scrollWidth > innerWidth + 1 || se.scrollHeight > innerHeight + 1) && /hidden|clip/.test(bodyStyle.overflow))
      clips.add('PAGE overflow hidden on body')

    // Overlap.
    const ctxShown = new Map()
    const ctxVisible = (c) => {
      if (!ctxShown.has(c)) ctxShown.set(c, !!shown(c))
      return ctxShown.get(c)
    }
    const boxes = candidates.map((el) => {
      const ic = inContainer(el)
      return { el, shown: shown(el), ctx: ic.ctx, inBox: ic.ctx && ctxVisible(ic.ctx) ? ic.box : null, layer: el.closest(OVERLAY) }
    })
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const A = boxes[i], B = boxes[j]
        if (A.layer !== B.layer) continue
        if (A.el.contains(B.el) || B.el.contains(A.el)) continue
        const same = A.ctx && A.ctx === B.ctx
        const a = same ? A.inBox : A.shown
        const b = same ? B.inBox : B.shown
        if (!a || !b) continue
        checkedEls.add(A.el); checkedEls.add(B.el)
        const x = Math.min(a.r, b.r) - Math.max(a.l, b.l)
        const y = Math.min(a.b, b.b) - Math.max(a.t, b.t)
        if (x > 1 && y > 1) overlaps.add('OVERLAP ' + label(A.el) + ' x ' + label(B.el) + ` (${Math.round(x)}x${Math.round(y)})`)
      }
    }
  }

  // Scroll positions: the initial one, then every scroll container stepped
  // through its full range on each scrollable axis (half a viewport per step,
  // always including the end), then restored.
  // Only axes the player can scroll (overflow auto/scroll on that axis; the
  // page scrolls on both) are stepped.
  const axes = (el) => {
    const s = getComputedStyle(el)
    const page = el === document.scrollingElement
    return {
      y: (page || /auto|scroll/.test(s.overflowY)) && el.scrollHeight > el.clientHeight + 1,
      x: (page || /auto|scroll/.test(s.overflowX)) && el.scrollWidth > el.clientWidth + 1,
    }
  }
  const scrollers = [document.scrollingElement, ...all].filter((el) => { const a = axes(el); return a.x || a.y })
  const stops = (max, page) => {
    const out = []
    const step = Math.max(40, Math.floor(page / 2))
    for (let v = step; v < max; v += step) out.push(v)
    out.push(max)
    return out
  }
  let positions = 1
  const scrolled = []
  once()
  for (const sc of scrollers) {
    const t0 = sc.scrollTop, l0 = sc.scrollLeft
    const ax = axes(sc)
    const maxT = ax.y ? sc.scrollHeight - sc.clientHeight : 0
    const maxL = ax.x ? sc.scrollWidth - sc.clientWidth : 0
    let n = 0
    if (maxT > 1) for (const v of stops(maxT, sc.clientHeight)) { sc.scrollTop = v; once(); positions++; n++ }
    sc.scrollTop = t0
    if (maxL > 1) for (const v of stops(maxL, sc.clientWidth)) { sc.scrollLeft = v; once(); positions++; n++ }
    sc.scrollLeft = l0
    if (n) scrolled.push(label(sc).split(' ')[0] + ` (${maxL > 1 ? maxL + 'px x, ' : ''}${maxT}px y, ${n} stops)`)
  }
  const unchecked = candidates.filter((el) => !checkedEls.has(el)).map(label)
  return {
    clips: [...clips],
    overlaps: [...overlaps],
    candidates: candidates.length,
    checked: checkedEls.size,
    unchecked,
    positions,
    scrolled,
  }
}

async function sweep(surface) {
  report.surfaces[surface] = {}
  for (const s of SCALES) {
    await setScale(s)
    const r = await page.evaluate(inspect)
    await page.screenshot({ path: `${OUT}${surface}-1280x720-scale${s}.png` })
    report.surfaces[surface][s] = r
    const n = r.clips.length + r.overlaps.length
    console.log(`${surface} @${s}%: ${n ? n + ' FAIL' : 'ok'} (${r.checked}/${r.candidates} boxes overlap-checked, ${r.positions} scroll positions)`)
    for (const line of r.scrolled) console.log('   scrolled ' + line)
    for (const line of r.unchecked) console.log('   not overlap-checked (hidden by an overflow-hidden box) ' + line)
    for (const line of [...r.clips, ...r.overlaps]) console.log('   ' + line)
  }
  await setScale(100)
}

// The orientation dialog shows on first visit only; when it shows, it must go.
async function dismiss() {
  const d = page.locator('[aria-label="Dismiss the orientation"]')
  if (await d.count()) {
    await d.click()
    await wait(300)
    if (await d.count()) throw new Error('orientation dialog did not dismiss')
  }
}

// 1. Menu (fresh profile).
await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await wait(1500)
await sweep('menu')

// 2. Settings over the Menu.
await page.locator('[aria-label^="OPEN SETTINGS"]').click()
await wait(400)
await sweep('settings')
await page.keyboard.press('Escape')
await wait(300)

// 3. World Network.
await page.getByText('NEW OPERATION').first().click()
await wait(1500)
await dismiss()
await wait(400)
await sweep('world-network')

// 4. Research.
await page.locator('[aria-label="RESEARCH"]').click()
await wait(800)
await sweep('research')

// 5. Brief (Rust Haven).
await page.locator('[aria-label="WORLD NETWORK"]').click()
await wait(800)
await dismiss()
await page.locator('[aria-label^="OPEN CONTRACT RUST HAVEN"]').first().click()
await wait(900)
await sweep('brief')

// 6. Assembly, bays filled.
await page.locator('[aria-label^="ACCEPT CONTRACT"]').click()
await wait(900)
// KESTREL in the squad: the longest READY codename, so the HUD is swept
// with it. The team may start full; free the last bay first.
const kestrel = page.locator('button[aria-label^="ASSIGN KESTREL "]')
if (await kestrel.isDisabled()) {
  await page.locator('button[aria-label^="UNASSIGN "]').last().click()
  await wait(150)
}
await kestrel.click()
await wait(150)
for (let i = 0; i < 8; i++) {
  const assign = page.locator('button[aria-label^="ASSIGN "]:not([disabled])')
  if (/4 \/ 4 ASSIGNED/.test(await page.innerText('body')) || (await assign.count()) === 0) break
  await assign.first().click()
  await wait(150)
}
await sweep('assembly')

// 7. Mission HUD.
await page.locator('[aria-label^="DEPLOY STRIKE TEAM"]').click()
await until(async () => !!(await import('/src/game/runtime.ts')).getWorld(), 60000)
await wait(3000)
report.renderer = consoleInfo.slice()
await sweep('mission-hud')
// Each squad member active in turn at 125% (codename in the weapon header,
// ACTIVE badge on its card).
report.activeSlots = {}
await setScale(125)
for (let k = 1; k <= 4; k++) {
  await page.keyboard.press('Digit' + k)
  await wait(300)
  const r = await page.evaluate(inspect)
  r.active = await page.evaluate(() => document.querySelector('.hud-wpn .hud-panel-head span')?.textContent ?? '')
  report.activeSlots[k] = r
  const n = r.clips.length + r.overlaps.length
  console.log(`mission-hud slot ${k} active (${r.active}) @125%: ${n ? n + ' FAIL' : 'ok'}`)
  for (const line of [...r.clips, ...r.overlaps]) console.log('   ' + line)
}
await page.screenshot({ path: `${OUT}mission-hud-1280x720-scale125-slot4.png` })
await page.keyboard.press('Digit1')
await setScale(100)

// 8. Pause, then pause + Settings (overlay on overlay).
await page.locator('[aria-label="Pause and open the menu"]').click()
await wait(500)
await sweep('pause')
await page.locator('[aria-label="Open settings"]').click()
await wait(400)
await sweep('pause-settings')
await page.keyboard.press('Escape')
await wait(300)
await page.getByRole('button', { name: 'RESUME' }).click()
await wait(300)

// 9. Debrief: play the mission out with the sim's order API (god assist).
const played = await page.evaluate(async () => {
  const rt = await import('/src/game/runtime.ts')
  const MS = (await import('/src/state/missionStore.ts')).useMissionStore
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const d2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2
  const w = rt.getWorld()
  const city = w.city
  const zoneOf = (def) => (def.kind === 'extract' ? city.extraction : def.zone ?? (def.landmark && city.landmarks[def.landmark]) ?? city.checkpoint)
  const t0 = performance.now()
  let lastOrder = 0
  const handKills = []
  while (performance.now() - t0 < 300000) {
    const ms = MS.getState()
    if (ms.result !== 'none') break
    const agents = w.units.filter((u) => u.kind === 'agent' && u.stance !== 'dead')
    if (!agents.length) break
    for (const a of agents) a.hp = a.maxHp
    const ids = agents.map((u) => u.id)
    const row = ms.objectives.find((o) => o.active && !o.done && !o.optional) ?? ms.objectives.find((o) => !o.done && !o.optional)
    const def = row && w.mission.objectives.find((d) => d.id === row.id)
    if (def && performance.now() - lastOrder > 700) {
      lastOrder = performance.now()
      const c = agents[0].pos
      if (def.kind === 'eliminate-tag' || def.kind === 'destroy') {
        const kind = def.kind === 'destroy' ? 'device' : 'enemy'
        const e = w.units.filter((u) => u.kind === kind && u.tag === def.tag && u.stance !== 'dead').sort((a, b) => d2(a.pos, c) - d2(b.pos, c))[0]
        if (e && kind === 'enemy') w.orderAttack(ids, e.id)
        else if (e) {
          w.orderMove(ids, { x: e.pos.x, z: e.pos.z })
          if (d2(e.pos, c) < 64 && !w.orderGrenade(ids, { x: e.pos.x, z: e.pos.z }) && MS.getState().inventory.cell === 0) {
            e.hp = 0
            e.stance = 'dead'
            handKills.push(e.tag)
          }
        }
      } else {
        const z = zoneOf(def)
        w.orderMove(ids, { x: z.x, z: z.z })
      }
    }
    for (let i = 0; i < 6; i++) w.tick(1 / 30)
    await sleep(50)
  }
  return { result: MS.getState().result, handKills }
})
console.log('mission assist: hand-killed devices', JSON.stringify(played.handKills))
report.missionResult = played
await until(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase === 'debrief', 60000)
// Let the staggered row reveal finish before measuring.
await wait(5000)
await sweep('debrief')

// Sub-minimum window: 1100x650 on the Debrief at 125%.
await setScale(125)
await page.setViewportSize({ width: 1100, height: 650 })
await wait(500)
report.subMinimum = await page.evaluate(() => {
  const r = document.querySelector('.app-root').getBoundingClientRect()
  const se = document.scrollingElement
  return { appRoot: [Math.round(r.width), Math.round(r.height)], viewport: [innerWidth, innerHeight], scroll: [se.scrollWidth, se.scrollHeight] }
})
await page.screenshot({ path: `${OUT}submin-debrief-1100x650-scale125.png` })
await page.evaluate(() => window.scrollTo(10000, 10000))
await wait(300)
await page.screenshot({ path: `${OUT}submin-debrief-1100x650-scale125-scrolled.png` })
console.log('sub-minimum', JSON.stringify(report.subMinimum))

await browser.close()
// Sub-minimum: the layout keeps 1280x720 and the window scrolls to it.
const sm = report.subMinimum
const smOk = sm.appRoot[0] >= 1280 && sm.appRoot[1] >= 720 && sm.scroll[0] >= 1280 && sm.scroll[1] >= 720
console.log('sub-minimum ' + (smOk ? 'ok' : 'FAIL'))
const fails = Object.entries(report.surfaces).flatMap(([s, by]) => Object.entries(by).filter(([, r]) => r.clips.length || r.overlaps.length).map(([k]) => s + '@' + k))
for (const [k, r] of Object.entries(report.activeSlots)) if (r.clips.length || r.overlaps.length) fails.push('mission-hud-slot' + k + '@125')
if (!smOk) fails.push('sub-minimum')
report.failing = fails
writeFileSync(OUT + 'sweep-result.json', JSON.stringify(report, null, 2))
console.log('renderer', report.renderer, '| mission', played.result, '| console errors', errs.length)
console.log(fails.length ? 'FAILING: ' + fails.join(', ') : 'ALL SURFACES CLEAN')
process.exit(fails.length ? 1 : 0)
