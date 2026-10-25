// IF-023 TC-10 only. Lines 4-277 copied verbatim from ../handwalk.mjs (probe.mjs lines 22-60 + HELPERS). TC-10 walk below is new.
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
const OUT = process.env.PROBE_OUT || new globalThis.URL('.', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const SCALES = [90, 100, 110, 125]

// Spec literals, pinned here (art bible §7.5 / spec Contrast table).
const INK_DIM = 'rgb(93, 125, 117)'
const INK_FAINT = 'rgb(53, 80, 74)'
const INK = 'rgb(184, 216, 207)'
const TEAL = 'rgb(126, 240, 212)'
const PRINT_WHITE = 'rgb(226, 246, 238)' // --print-white #e2f6ee (src/index.css)
const RED_HOT = 'rgb(255, 107, 85)'
const AMBER = 'rgb(255, 208, 117)'

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

/* ------------------------------ in-page helpers ----------------------------- */

// Installed once per document: measurement functions on window.__probe.
const HELPERS = () => {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map((x) => parseFloat(x))
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
  }
  const over = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  })
  const lum = (c) => {
    const f = (v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  const VOID = { r: 4, g: 7, b: 10, a: 1 }
  // Background under an element: its ancestors' solid backgrounds,
  // composited bottom-up on Void. Gradients and images are ignored.
  const bgOf = (el) => {
    const chain = []
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) chain.push(n)
    let bg = VOID
    for (const n of chain.reverse()) {
      const c = parse(getComputedStyle(n).backgroundColor)
      if (c && c.a > 0) bg = over(c, bg)
    }
    return bg
  }
  const alphaOf = (el) => {
    let a = 1
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) a *= parseFloat(getComputedStyle(n).opacity)
    return a
  }
  const visible = (el) => {
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') return false
    const r = el.getBoundingClientRect()
    if (r.width <= 1 && r.height <= 1) return false
    if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)') return false
    return el.getClientRects().length > 0
  }
  const path = (el) => {
    const parts = []
    for (let n = el; n && n.nodeType === 1 && parts.length < 4; n = n.parentElement) {
      parts.unshift(n.tagName.toLowerCase() + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).join('.') : ''))
    }
    return parts.join(' > ')
  }
  const runs = (rootSel) => {
    const root = document.querySelector(rootSel)
    if (!root) return []
    const out = []
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      const text = t.textContent.trim()
      if (!text) continue
      const el = t.parentElement
      if (!el || !visible(el)) continue
      if (el.closest('svg')) continue
      const cs = getComputedStyle(el)
      const col = parse(cs.color)
      const alpha = alphaOf(el) * col.a
      // Fully transparent text is not drawn (hover tips, the Feed row
      // chevron): not a visible run.
      if (alpha === 0) continue
      const bg = bgOf(el)
      const fg = over({ ...col, a: alpha }, bg)
      out.push({
        text: text.slice(0, 40),
        size: parseFloat(cs.fontSize),
        color: `rgb(${col.r}, ${col.g}, ${col.b})`,
        alpha: Math.round(alpha * 1000) / 1000,
        ratio: Math.round(ratio(fg, bg) * 100) / 100,
        path: path(el),
        el,
      })
    }
    return out
  }
  const box = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }
  }
  // Clip, truncation, spill and overlap under a root: text cut by its own
  // box, an ellipsis, text drawn outside its box, and panels intersecting
  // (declared overlays excluded: the first-visit card, tips, the Scan's own
  // floating chrome).
  const clipped = (rootSel) => {
    const root = document.querySelector(rootSel)
    if (!root) return ['no root ' + rootSel]
    const bad = []
    const overlay = (el) => !!el.closest('.hud-menu-wrap, .tip, .globe-view, .wm-map-wrap')
    for (const el of root.querySelectorAll('*')) {
      if (!visible(el) || el.closest('svg') || el.closest('canvas') || overlay(el)) continue
      // A vertical list that also scrolls sideways hides text off its edge.
      const ecs = getComputedStyle(el)
      if (/(auto|scroll)/.test(ecs.overflowY) && el.scrollWidth > el.clientWidth + 1) {
        bad.push('hscroll ' + path(el) + ' ' + el.scrollWidth + ' in ' + el.clientWidth)
      }
      const cs = getComputedStyle(el)
      // An ellipsis cuts text whether or not the box holds text directly.
      if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && el.textContent.trim()) {
        bad.push('truncated ' + path(el) + ' "' + el.textContent.trim().slice(0, 30) + '"')
        continue
      }
      const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
      if (!own.length) continue
      const scrolls = /(auto|scroll)/.test(cs.overflowY) || /(auto|scroll)/.test(cs.overflowX)
      const what = path(el) + ' "' + el.textContent.trim().slice(0, 30) + '"'
      // Cut by an ancestor that clips without scrolling (a fixed strip whose
      // body is overflow: clip / hidden).
      const er = el.getBoundingClientRect()
      let cutBy = null
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        const ns = getComputedStyle(n)
        if (/(auto|scroll)/.test(ns.overflowY + ns.overflowX)) break
        if (ns.overflowY !== 'visible' || ns.overflowX !== 'visible') {
          const nr = n.getBoundingClientRect()
          if (er.bottom > nr.bottom + 1 || er.right > nr.right + 1 || er.top < nr.top - 1 || er.left < nr.left - 1) cutBy = n
          break
        }
      }
      if (cutBy) { bad.push('cut ' + what + ' by ' + path(cutBy)); continue }
      if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) {
        bad.push('truncated ' + what)
      } else if (cs.overflow !== 'visible' && !scrolls && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
        bad.push('clip ' + what + ' ' + el.scrollWidth + 'x' + el.scrollHeight + ' in ' + el.clientWidth + 'x' + el.clientHeight)
      } else if (cs.display !== 'inline') {
        const r = el.getBoundingClientRect()
        // A text box that sticks out of its control or panel is spill too.
        const host = el.parentElement?.closest('button, .panel-body, .kv')
        if (host) {
          const h = host.getBoundingClientRect()
          if (r.left < h.left - 1.5 || r.right > h.right + 1.5) {
            bad.push('spill ' + what + ' box ' + Math.round(r.left) + '-' + Math.round(r.right) + ' host ' + Math.round(h.left) + '-' + Math.round(h.right))
            continue
          }
        }
        const range = document.createRange()
        for (const t of own) {
          range.selectNodeContents(t)
          const tr = range.getBoundingClientRect()
          if (tr.width && (tr.left < r.left - 1.5 || tr.right > r.right + 1.5)) {
            bad.push('spill ' + what + ' text ' + Math.round(tr.left) + '-' + Math.round(tr.right) + ' box ' + Math.round(r.left) + '-' + Math.round(r.right))
            break
          }
        }
      }
    }
    // Text drawn over other text: every rendered line of every text node
    // (HTML ranges and SVG text boxes), compared pairwise.
    const lines = []
    // A line's visible part: its rect cut by every ancestor that clips
    // (overflow other than visible), so text scrolled out of view is ignored.
    const visiblePart = (r, el) => {
      let x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom
      for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const ns = getComputedStyle(n)
        if (ns.overflowX !== 'visible' || ns.overflowY !== 'visible') {
          const c = n.getBoundingClientRect()
          x1 = Math.max(x1, c.left); y1 = Math.max(y1, c.top); x2 = Math.min(x2, c.right); y2 = Math.min(y2, c.bottom)
        }
      }
      x1 = Math.max(x1, 0); y1 = Math.max(y1, 0); x2 = Math.min(x2, innerWidth); y2 = Math.min(y2, innerHeight)
      return x2 - x1 > 1 && y2 - y1 > 1 ? { left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 } : null
    }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      const host = t.parentElement
      if (!t.textContent.trim() || !host || !visible(host) || overlay(host) || host.closest('canvas')) continue
      if (host.closest('svg')) continue
      const rg = document.createRange()
      rg.selectNodeContents(t)
      for (const r0 of rg.getClientRects()) {
        const r = visiblePart(r0, t.parentElement)
        if (r) lines.push({ r, host, t: t.textContent.trim().slice(0, 24) })
      }
    }
    for (const el of root.querySelectorAll('svg text, svg tspan')) {
      if (el.tagName === 'text' && el.querySelector('tspan')) continue
      if (!el.textContent.trim() || overlay(el)) continue
      const r = visiblePart(el.getBoundingClientRect(), el)
      if (r) lines.push({ r, host: el, t: el.textContent.trim().slice(0, 24) })
    }
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
      const x = lines[i].r, y = lines[j].r
      const w = Math.min(x.right, y.right) - Math.max(x.left, y.left)
      const h = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top)
      if (w > 2 && h > 2 && h > Math.min(x.height, y.height) * 0.3) {
        bad.push('textoverlap "' + lines[i].t + '" x "' + lines[j].t + '" ' + Math.round(w) + 'x' + Math.round(h))
      }
    }
    // Absolutely placed boxes that hold text must not cover one another
    // (labels laid over art): compare positioned siblings pairwise.
    const placed = [...root.querySelectorAll('*')].filter((el) => {
      if (!visible(el) || overlay(el) || el.closest('svg')) return false
      const pos = getComputedStyle(el).position
      return (pos === 'absolute' || pos === 'fixed') && el.textContent.trim()
    })
    for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
      const A = placed[i], B = placed[j]
      if (A.parentElement !== B.parentElement) continue
      const x = A.getBoundingClientRect(), y = B.getBoundingClientRect()
      const w = Math.min(x.right, y.right) - Math.max(x.left, y.left)
      const h = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top)
      if (w > 2 && h > 2) bad.push('boxoverlap ' + path(A) + ' x ' + path(B) + ' ' + Math.round(w) + 'x' + Math.round(h))
    }
    const panels = [...root.querySelectorAll('.panel, .navtabs, .wm-campaign-fail, .wm-campaign-win')].filter((p) => visible(p) && !overlay(p))
    const outer = panels.filter((p) => !panels.some((q) => q !== p && q.contains(p)))
    for (let a = 0; a < outer.length; a++) for (let b = a + 1; b < outer.length; b++) {
      const x = outer[a].getBoundingClientRect(), y = outer[b].getBoundingClientRect()
      const w = Math.min(x.right, y.right) - Math.max(x.left, y.left)
      const h = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top)
      if (w > 1 && h > 1) bad.push('overlap ' + path(outer[a]) + ' x ' + path(outer[b]) + ' ' + Math.round(w) + 'x' + Math.round(h))
    }
    return bad
  }
  window.__probe = { runs, box, clipped, visible, path, parse, ratio, bgOf, over }
}

const install = () => page.evaluate(HELPERS)

/* ------------------------------- TC-10 walk ---------------------------------- */
const J = (o) => JSON.stringify(o)
const hdrInf = () => page.evaluate(() => [...document.querySelectorAll('.wm-resource')].find((r) => r.textContent.includes('INFLUENCE'))?.textContent ?? null)
const balanceRuns = (num) => page.evaluate((num) => {
  const re = new RegExp('\\bINFLUENCE\\b|\\b' + num + '\\s*PTS\\b')
  return window.__probe.runs('body').filter((r) => re.test(r.text)).map((r) => ({ text: r.text, path: r.path, inHeader: !!r.el.closest('.wm-resource'), inLeft: !!r.el.closest('.wm-left') }))
}, num)
const clickEl = async (sel, text) => {
  const h = await page.evaluateHandle(({ sel, text }) => [...document.querySelectorAll(sel)].find((e) => (!text || (e.getAttribute('aria-label') || '').includes(text) || e.textContent.includes(text)) && e.getBoundingClientRect().width > 0) ?? null, { sel, text })
  const el = h.asElement()
  if (!el) throw new Error('no element ' + sel + ' ' + (text || ''))
  const b = await el.boundingBox()
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
}
const phase = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
const assists = []
let holdsReleasedKey = 0, holdsReleasedStore = 0
note('# IF-023 TC-10 — ' + new Date().toISOString())
note('viewport ' + J(page.viewportSize()))

await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload(); await wait(1500)
await clickEl('button', 'NEW OPERATION'); await wait(400)
if ((await phase()) === 'menu') { await clickEl('button', 'NEW OPERATION'); await wait(400) }
await wait(1000); await install()
note('phase after NEW OPERATION: ' + await phase())
const card = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'UNDERSTOOD'))
if (card) { await clickEl('button', 'UNDERSTOOD'); await wait(300) }
const start = await hdrInf()
const startStore = await page.evaluate(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().influence)
note('step1 header ' + J(start) + ' store ' + startStore)
await shot('tc10-world-start')
await clickEl('.wm-sector', 'NORTH AMERICA'); await wait(400)
await clickEl('.wm-op', 'RUST HAVEN'); await wait(700)
note('after RUST HAVEN row: ' + await phase())
if ((await phase()) === 'world') { await clickEl('button', 'BRIEF'); await wait(600) }
await clickEl('button', 'ACCEPT CONTRACT'); await wait(800)
note('after ACCEPT: ' + await phase())
await clickEl('button', 'DEPLOY TEAM'); await wait(800)
note('after DEPLOY: ' + await phase())
for (let i = 0; i < 60; i++) {
  if (await page.evaluate(async () => !!(await import('/src/game/runtime.ts')).getWorld())) break
  await wait(500)
}
// Which module URLs the app loaded (a ?t= copy would mean the script's imports hit a separate store).
note('modules ' + J(await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name.replace(location.origin, '')).filter((n) => /(missionStore|runtime|appStore|worldStore)\.ts/.test(n)))))
await shot('tc10-mission-start')

// Release a TM-019 hold: Space first (the game's own binding), store only if Space did not clear it.
async function releaseHold() {
  const held = await page.evaluate(async () => { const s = (await import('/src/state/missionStore.ts')).useMissionStore.getState(); return { held: s.held, reason: s.holdReason } })
  if (!held.held) return null
  await page.keyboard.press('Space'); await wait(80)
  let still = await page.evaluate(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().held)
  if (!still) { holdsReleasedKey++; return 'space:' + held.reason }
  await page.evaluate(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().setHeld(false))
  holdsReleasedStore++
  return 'store:' + held.reason
}

// Phase A: played. Orders through the sim's order calls; no pausing; holds released.
const PLAYSTEPS = Number(process.env.PLAYSTEPS || 200)
let res = 'none', civ = 0, lastT = -1
for (let step = 0; step < PLAYSTEPS; step++) {
  const rel = await releaseHold()
  const s = await page.evaluate(async (step) => {
    const ms = (await import('/src/state/missionStore.ts')).useMissionStore
    const w = (await import('/src/game/runtime.ts')).getWorld()
    const st = ms.getState()
    if (!w) return { result: st.result, civ: st.civiliansHit, now: 'noworld' }
    const ag = w.units.filter((u) => u.kind === 'agent' && u.stance !== 'dead')
    const ids = ag.map((u) => u.id)
    const row = (id) => st.objectives.find((o) => o.id === id) || {}
    const cen = ag.length ? { x: ag.reduce((a, u) => a + u.pos.x, 0) / ag.length, z: ag.reduce((a, u) => a + u.pos.z, 0) / ag.length } : { x: 0, z: 0 }
    const d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
    const go = (p, r = 3) => { if (ag.some((u) => d(u.pos, p) > r) && (step % 5 === 0 || ag.every((u) => u.stance === 'idle'))) w.orderMove(ids, p) }
    if (ag.some((u) => u.hp / u.maxHp < 0.45)) w.orderUseMed(ids)
    const relays = w.units.filter((u) => u.kind === 'device' && u.tag === 'relay' && u.stance !== 'dead')
    let ph
    if (!row('rh1').done) { ph = 'yard'; go(w.city.landmarks['yard-a']) }
    else if (relays.length) {
      ph = 'relays'
      const r = relays.sort((a, b) => d(a.pos, cen) - d(b.pos, cen))[0]
      if (d(cen, r.pos) > 6) go(r.pos, 6)
      else w.orderAbility(ids)
    } else if (!row('rh3').done) { ph = 'hold'; go(w.city.landmarks.target, 2.5) }
    else { ph = 'extract'; go(w.city.extraction, 2) }
    return { t: Math.round(w.time * 10) / 10, paused: st.paused, held: st.held, live: st.live, ph, result: st.result, civ: st.civiliansHit, ag: ag.map((u) => u.id + ':' + Math.round(u.hp)).join(','), enemies: w.units.filter((u) => u.kind === 'enemy' && u.stance !== 'dead').length, relays: relays.length, rows: st.objectives.map((o) => o.id + (o.done ? '+' : o.active ? '*' : '-')).join(' ') }
  }, step)
  if (step % 10 === 0 || rel || s.result !== 'none') note(`A step ${step}${rel ? ' hold released ' + rel : ''} ${J(s)}`)
  civ = s.civ || 0
  if (civ > 0) { note('civilian hit: attempt void for a clean win'); break }
  if (s.result && s.result !== 'none') { res = s.result; break }
  if (!s.ag) { note('no agents alive'); break }
  lastT = s.t
  await wait(400)
}
note(`Phase A end: result ${res}, civ ${civ}, t ${lastT}, holds released by Space ${holdsReleasedKey}, by setHeld ${holdsReleasedStore}`)
if (holdsReleasedStore) assists.push(`setHeld(false) x${holdsReleasedStore} (Space did not clear the hold)`)

// Phase B: sim assist (smoke item 4 / world.test.ts "Rust Haven"), only if Phase A did not win and no civilian was hit.
if (res === 'none' && civ === 0) {
  assists.push('mission completed via the sim: enemies set dead, relays set dead, squad placed on yard-a / target / extraction; hold timer ran on the live loop')
  const stage = (name) => page.evaluate(async (name) => {
    const w = (await import('/src/game/runtime.ts')).getWorld()
    const ms = (await import('/src/state/missionStore.ts')).useMissionStore
    const put = (u, at) => { u.pos.x = at.x; u.pos.z = at.z; u.path.length = 0 }
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
    const ag = w.units.filter((u) => u.kind === 'agent' && u.stance !== 'dead')
    if (name === 'relays') for (const u of w.units) if (u.kind === 'device' && u.tag === 'relay') u.stance = 'dead'
    const at = name === 'yard' ? w.city.landmarks['yard-a'] : name === 'hold' ? w.city.landmarks.target : name === 'extract' ? w.city.extraction : null
    if (at) for (const u of ag) put(u, at)
    const st = ms.getState()
    return { t: Math.round(w.time * 10) / 10, held: st.held, paused: st.paused, result: st.result, civ: st.civiliansHit, rows: st.objectives.map((o) => o.id + (o.done ? '+' : o.active ? '*' : '-') + (o.progress ? Math.round(o.progress * 100) : '')).join(' ') }
  }, name)
  const until = async (name, pred, n) => {
    let s
    for (let i = 0; i < n; i++) {
      await releaseHold()
      s = await stage(name)
      if (i % 10 === 0) note(`B ${name} ${i} ${J(s)}`)
      if (pred(s)) break
      await wait(500)
    }
    note(`B ${name} done ${J(s)}`)
    return s
  }
  await until('yard', (s) => /rh1\+/.test(s.rows), 20)
  await until('relays', (s) => /rh2\+/.test(s.rows), 20)
  await until('hold', (s) => /rh3\+/.test(s.rows), 200)
  const e = await until('extract', (s) => s.result !== 'none', 30)
  res = e.result; civ = e.civ
  if (holdsReleasedStore && !assists.some((a) => a.startsWith('setHeld'))) assists.push(`setHeld(false) x${holdsReleasedStore}`)
}
note('mission result ' + res + ' civ ' + civ)
for (let i = 0; i < 40 && (await phase()) !== 'debrief'; i++) await wait(500)
note('phase ' + await phase())
let out = { start, startStore, res, civ, assists }
if (res === 'won' && (await phase()) === 'debrief') {
  await wait(800); await install()
  out.deb = await page.evaluate(() => document.body.innerText.split('\n').filter((l) => /INFLUENCE|CIVILIAN|COLLATERAL|CONTRACT/i.test(l)))
  out.debStore = await page.evaluate(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().influence)
  out.debCiv = await page.evaluate(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().civiliansHit)
  out.outcome = await page.evaluate(async () => { const o = (await import('/src/state/appStore.ts')).useAppStore.getState().outcome; return o && { won: o.won, civiliansHit: o.civiliansHit, quietReplay: o.quietReplay } })
  await shot('if-023-debrief-award')
  // First frame: click RETURN, one rAF, read.
  out.first = await page.evaluate(async () => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'RETURN TO WORLD NETWORK')
    if (!b) return { error: 'no RETURN button' }
    b.click()
    await new Promise((r) => requestAnimationFrame(() => r()))
    const { useAppStore } = await import('/src/state/appStore.ts')
    return { phase: useAppStore.getState().phase, header: [...document.querySelectorAll('.wm-resource')].find((r) => r.textContent.includes('INFLUENCE'))?.textContent ?? null, left: document.querySelectorAll('.wm-left > *').length, leftTitles: [...document.querySelectorAll('.wm-left .panel-title')].map((t) => t.textContent.trim()) }
  })
  await shot('if-023-return-award')
  out.after = await hdrInf()
  out.afterStore = await page.evaluate(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().influence)
  out.lines = await page.evaluate(() => document.body.innerText.split('\n').filter((l) => /INFLUENCE|\b8\s*PTS\b/.test(l)))
  await install()
  out.runs = await balanceRuns(8)
}
note('OUT ' + J(out))
note('page errors: ' + errs.length + (errs.length ? ' ' + J(errs.slice(0, 5)) : ''))
writeFileSync(OUT + 'tc10-output.txt', log.join('\n') + '\n')
await browser.close()
