// IF-025 hand-walks (Sprint 11 Phase 5, HEAD 131a5c1, final sprint build). Headless Chrome for Testing, 1280x720.
// Lines 22-367 (imports, launch, HELPERS, fresh/dismissCard/setScale/pause/store helpers) copied verbatim
// from production/qa/evidence/sprint-011/probe.mjs. Cases: production/qa/test-cases/if-025-each-influence-action-prints-its-effect-cases.md
// Run: PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011-head-2026-10-24/if-025/handwalk.mjs
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
  await install()
}

const store = (fn, arg) => page.evaluate(fn, arg)
const dismissCard = () =>
  store(async () => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    useTutorialStore.getState().markSeen('hint-worldmap')
  })
const setScale = (scale) =>
  store(async (scale) => {
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setTextScale(scale)
  }, scale)
const setHC = (on) =>
  store(async (on) => {
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setHighContrast(on)
  }, on)
const pause = () =>
  store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ paused: true })
  })
const sector = (id, patch, crisis) =>
  store(async ({ id, patch, crisis }) => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const s = useWorldStore.getState()
    useWorldStore.setState({
      selected: id,
      sectors: { ...s.sectors, [id]: { ...s.sectors[id], ...patch } },
      crisis: crisis ? [...new Set([...s.crisis, id])] : s.crisis.filter((x) => x !== id),
    })
  }, { id, patch, crisis })
const goto = (phase) =>
  store(async (phase) => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto(phase)
  }, phase)
const runsIn = (sel) =>
  page.evaluate((sel) => window.__probe.runs(sel).map(({ el, ...r }) => r), sel)
const colorOf = (sel) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel)
    return el ? getComputedStyle(el).color : null
  }, sel)
const ratioOf = (sel) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = window.__probe.runs('body').find((x) => x.el === el || el.contains(x.el))
    return r ? r.ratio : null
  }, sel)
const boxes = (sel) =>
  page.evaluate((sel) => [...document.querySelectorAll(sel)].filter(window.__probe.visible).map(window.__probe.box), sel)

/* ---------------------------------- states ---------------------------------- */

// The ten IF-026 states plus intel 2+, keyed by name; each leaves the screen

/* ------------------------------- IF-025 walks ------------------------------- */
// STATES.opening, verbatim from probe.mjs line 371.
const STATES = { opening: async () => { await fresh(); await dismissCard(); await pause() } }
const EXP = ['-12 UNREST OVER 6H', '+8 CONTROL OVER 12H', 'WAIVE INTEL GATE // +24H EXPIRY']
const save = (name, data) => writeFileSync(`${OUT}${name}.json`, JSON.stringify(data, null, 2))
const ws = (fn, arg) => page.evaluate(async ({ src, arg }) => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
  return new Function('W', 'T', 'arg', src)(useWorldStore, useTutorialStore, arg)
}, { src: fn, arg })

// Card gate (shared precondition 4).
async function cardGate(tag) {
  const up = () => page.evaluate(() => [...document.querySelectorAll('*')].some((el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.includes('WORLD NETWORK // ORIENTATION')) && window.__probe.visible(el)))
  let r = 'card absent'
  if (await up()) {
    await page.click('button[aria-label="UNDERSTOOD // DISMISS THE ORIENTATION"]')
    await wait(250)
    r = 'card was up; clicked UNDERSTOOD'
  }
  const still = await up()
  note(`[gate ${tag}] ${r}; after: ${still ? 'CARD STILL UP' : 'no card'}`)
  return !still
}

const M = () => page.evaluate(() => [...document.querySelectorAll('.wm-act-wrap')].map((w) => {
  w.scrollIntoView({ block: 'center' })
  const btn = w.querySelector('.wm-act'), e = w.querySelector('.wm-act-effect'), st = w.querySelector('.wm-act-status')
  const b = btn.getBoundingClientRect(), r = e.getBoundingClientRect(), s = st.getBoundingClientRect()
  const sc = w.closest('.wm-sector-scroll').getBoundingClientRect()
  const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)
  const cs = getComputedStyle(e)
  return {
    name: btn.querySelector('.wm-act-name').textContent.trim(), status: st.textContent, disabled: btn.disabled,
    label: btn.getAttribute('aria-label'), title: btn.getAttribute('title'),
    effect: e.textContent, ariaHidden: e.getAttribute('aria-hidden'), display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
    below: r.top >= b.bottom - 0.5,
    overlap: !(r.bottom <= s.top || s.bottom <= r.top || r.right <= s.left || s.right <= r.left),
    inView: r.top >= sc.top - 0.5 && r.bottom <= sc.bottom + 0.5 && r.left >= sc.left - 0.5 && r.right <= sc.right + 0.5,
    onTop: !!hit && e.contains(hit),
    ellipsis: cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1,
    w: Math.round(r.width), h: Math.round(r.height),
  }
}))
const clip = () => page.evaluate(() => window.__probe.clipped('.wm-right'))
const rowOk = (r, i) => r.effect === EXP[i] && r.below && r.inView && r.onTop && !r.overlap && !r.ellipsis &&
  r.display !== 'none' && r.visibility === 'visible' && r.opacity === '1'
const scrollRow = (i) => page.evaluate((i) => document.querySelectorAll('.wm-act-wrap')[i].scrollIntoView({ block: 'center' }), i)
const header = () => page.evaluate(() => (document.body.innerText.match(/INFLUENCE\s+\d+\s*PTS/) || ['(not found)'])[0])
const ROWN = ['stabilize', 'lobby', 'expedite']

async function sweep(tc, expectStatus) {
  const out = {}
  for (const sc of SCALES) {
    await setScale(sc); await wait(250); await install()
    const gate = await cardGate(`${tc} ${sc}`)
    const m = await M()
    const c = await clip()
    for (let i = 0; i < m.length; i++) { await scrollRow(i); await wait(80); await shot(`if-025-${tc}-${sc}-${ROWN[i]}`) }
    save(`if-025-${tc}-${sc}`, { gate, m, clipped: c })
    const okRows = m.length === 3 && m.every(rowOk)
    const okStatus = expectStatus ? m.map((r) => r.status).join('|') === expectStatus.join('|') : true
    check('IF-025', `${tc} scale ${sc}: 3 rows meet row pass rule, statuses ${expectStatus?.join('/')}, clipped []`,
      gate && okRows && okStatus && c.length === 0,
      JSON.stringify({ statuses: m.map((r) => r.status), disabled: m.map((r) => r.disabled), fails: m.map((r, i) => rowOk(r, i) ? null : r), clipped: c }))
    out[sc] = { m, c }
  }
  await setScale(100); await wait(250)
  return out
}

// ---- TC-02 ----
await STATES.opening(); await setScale(100); await wait(250); await install()
{
  const gate = await cardGate('tc02')
  const m = await M()
  const extra = await page.evaluate(() => [...document.querySelectorAll('.wm-act-wrap')].map((w) => {
    const e = w.querySelector('.wm-act-effect'), btn = w.querySelector('.wm-act')
    return { firstNodeType: e.firstChild?.nodeType, firstText: e.firstChild?.textContent, childNodes: e.childNodes.length,
      outsideButton: !btn.contains(e), btnInnerText: btn.innerText }
  }))
  save('if-025-tc02-100', { gate, m, extra })
  await shot('if-025-tc02-100')
  const ok = gate && m.length === 3 && m.every((r, i) => {
    const x = extra[i]
    const lab = new RegExp('^\\d \\w+ // \\d+ PTS // ' + EXP[i].replace(/[+/]/g, (c) => '\\' + c) + ' // .+$')
    return r.effect === EXP[i] && x.firstNodeType === 3 && x.firstText === EXP[i] && x.outsideButton &&
      !x.btnInnerText.includes(EXP[i]) && lab.test(r.label) && r.ariaHidden === 'true' && (r.title === null || r.title !== EXP[i])
  })
  check('IF-025', 'TC-02 effect is a DOM text node equal to actionEffect, outside the button, aria-label full form', ok,
    JSON.stringify(m.map((r, i) => ({ effect: r.effect, label: r.label, title: r.title, ariaHidden: r.ariaHidden, ...extra[i] }))))
}

// ---- TC-03 ----
const euCount = await ws("return W.getState().contracts.filter((c) => c.sector === 'eu').length")
note(`TC-03 Europe contracts: ${euCount}`)
const ex = euCount === 0 ? 'NO TARGET' : 'UNAFFORDABLE'
await sweep('tc03', ['UNAFFORDABLE', 'UNAFFORDABLE', ex])

// ---- TC-04 ----
await STATES.opening(); await install()
await ws("W.setState({ influence: 8 }); T.getState().markSeen('hint-influence')"); await wait(250)
note(`TC-04 header: ${await header()} selected=${await ws('return W.getState().selected')}`)
await sweep('tc04', ['CLEAR', 'UNAFFORDABLE', ex])

// ---- TC-05 ----
await STATES.opening(); await install()
await ws("const s = W.getState(); W.setState({ influence: 30, cooldowns: { ...s.cooldowns, 'eu:lobby': s.t + 12 * 3600 }, contracts: s.contracts.filter((c) => c.sector !== 'eu') }); T.getState().markSeen('hint-influence')")
await setScale(100); await wait(250); await install(); await cardGate('tc05 pre-click')
await scrollRow(0); await wait(100)
await page.click('.wm-act-wrap:nth-child(1) .wm-act')
await wait(300)
const hdr5 = await header()
const t5 = await ws("const s = W.getState(); return { influence: s.influence, paused: s.paused, spends: s.spends, cooldowns: s.cooldowns, t: s.t }")
note(`TC-05 header after spend: ${hdr5} // ${JSON.stringify(t5)}`)
check('IF-025', 'TC-05 header reads INFLUENCE 22 PTS after STABILIZE click', /INFLUENCE\s+22\s*PTS/.test(hdr5), hdr5)
await sweep('tc05', ['ACTIVE', 'COOLDOWN 12H', 'NO TARGET'])
await page.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)' })
for (let i = 0; i < 3; i++) { await scrollRow(i); await wait(80); await shot(`if-025-tc05-grayscale-${ROWN[i]}`) }
await page.evaluate(() => { document.documentElement.style.filter = '' })
const t5b = await ws('return W.getState().t')
note(`TC-05 clock t before sweep ${t5.t}, after ${t5b} (paused should hold it)`)

// ---- TC-06 ----
await STATES.opening(); await install()
await ws("W.setState({ influence: 30 }); T.getState().markSeen('hint-influence')"); await wait(250)
const tc06 = {}
for (const sc of SCALES) {
  await setScale(sc); await wait(250); await install()
  const gate = await cardGate(`tc06 ${sc}`)
  const m = (await M())[2]
  const g = await page.evaluate(() => {
    const w = document.querySelectorAll('.wm-act-wrap')[2]
    w.scrollIntoView({ block: 'center' })
    const e = w.querySelector('.wm-act-effect')
    const rg = document.createRange(); rg.selectNodeContents(e.firstChild)
    const lines = new Set([...rg.getClientRects()].map((r) => Math.round(r.top))).size
    const r = e.getBoundingClientRect(), wr = w.getBoundingClientRect()
    let nx = w.nextElementSibling; const nr = nx ? nx.getBoundingClientRect() : null
    return { lines, sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight,
      left: r.left, right: r.right, bottom: r.bottom, wrapL: wr.left, wrapR: wr.right, next: nx ? nx.className : null, nextTop: nr ? nr.top : null }
  })
  await shot(`if-025-tc06-${sc}`)
  save(`if-025-tc06-${sc}`, { gate, m, g })
  const ok = gate && m.status === 'CLEAR' && g.lines >= 1 && g.sw <= g.cw + 1 && g.sh <= g.ch + 1 && g.left >= g.wrapL - 1.5 && g.right <= g.wrapR + 1.5 &&
    (g.nextTop === null || g.bottom <= g.nextTop + 0.5) && rowOk(m, 2)
  check('IF-025', `TC-06 scale ${sc}: Expedite effect full, no clip/ellipsis/spill (lines ${g.lines})`, ok, JSON.stringify({ status: m.status, ...g, row: rowOk(m, 2) ? 'ok' : m }))
  tc06[sc] = g.lines
}
await setScale(100); await wait(250)

// ---- TC-07 ----
await STATES.opening(); await setScale(125); await wait(250); await install()
{
  const gate = await cardGate('tc07')
  const s1 = await page.evaluate(() => { const s = document.querySelector('.wm-sector-scroll'); s.scrollTop = 0; return { sh: s.scrollHeight, ch: s.clientHeight, oy: getComputedStyle(s).overflowY } })
  const atTop0 = await page.evaluate(() => {
    const ops = document.querySelector('.wm-ops-list'); ops.scrollTop = 0
    const o = ops.getBoundingClientRect(); const head = ops.closest('.panel')?.querySelector('.panel-head, header, h2, .panel-title')
    const first = ops.querySelector('.wm-op'); const fr = first?.getBoundingClientRect()
    const hr = head?.getBoundingClientRect()
    return { headText: head?.textContent?.trim().slice(0, 40) ?? null, headInView: !!hr && hr.top >= 0 && hr.bottom <= innerHeight,
      firstRowInView: !!fr && fr.top >= o.top - 0.5 && fr.bottom <= o.bottom + 0.5 }
  })
  await shot('if-025-tc07-top')
  // wheel
  const box = await page.evaluate(() => { const r = document.querySelector('.wm-sector-scroll').getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 } })
  await page.mouse.move(box.x, box.y)
  const before = await page.evaluate(() => document.querySelector('.wm-sector-scroll').scrollTop)
  for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 200); await wait(60) }
  await wait(200)
  const after = await page.evaluate(() => { const s = document.querySelector('.wm-sector-scroll'); return { top: s.scrollTop, max: s.scrollHeight - s.clientHeight } })
  const end = await page.evaluate(() => {
    const s = document.querySelector('.wm-sector-scroll'); s.scrollTop = s.scrollHeight
    const sr = s.getBoundingClientRect(); const ws = [...s.querySelectorAll('.wm-act-wrap')]; const e = ws[ws.length - 1].querySelector('.wm-act-effect').getBoundingClientRect()
    return { inside: e.top >= sr.top - 0.5 && e.bottom <= sr.bottom + 0.5 && e.left >= sr.left - 0.5 && e.right <= sr.right + 0.5, e: [e.top, e.bottom], s: [sr.top, sr.bottom] }
  })
  await wait(100); await shot('if-025-tc07-sector-end')
  const ops = await page.evaluate(() => {
    const l = document.querySelector('.wm-ops-list'); const lr0 = { sh: l.scrollHeight, ch: l.clientHeight, oy: getComputedStyle(l).overflowY }
    const rows = [...l.querySelectorAll('.wm-op')]
    const res = rows.map((r, i) => {
      r.scrollIntoView({ block: 'nearest' })
      const lr = l.getBoundingClientRect(), rr = r.getBoundingClientRect()
      const inside = rr.top >= lr.top - 0.5 && rr.bottom <= lr.bottom + 0.5 && rr.left >= lr.left - 0.5 && rr.right <= lr.right + 0.5
      const title = r.querySelector('.wm-op-main b, .wm-op-main') ; const tr = title.getBoundingClientRect()
      const hit = document.elementFromPoint((tr.left + tr.right) / 2, (tr.top + tr.bottom) / 2)
      return { i, inside, onTop: !!hit && (title.contains(hit) || r.contains(hit)), text: r.textContent.trim().slice(0, 40),
        row: [Math.round(rr.top * 10) / 10, Math.round(rr.bottom * 10) / 10, Math.round(rr.left), Math.round(rr.right)],
        list: [Math.round(lr.top * 10) / 10, Math.round(lr.bottom * 10) / 10, Math.round(lr.left), Math.round(lr.right)], scrollTop: l.scrollTop }
    })
    l.scrollTop = l.scrollHeight
    const lr = l.getBoundingClientRect(), last = rows[rows.length - 1]?.getBoundingClientRect()
    // Which of the last row's text lines sit outside the list at max scroll (the frame vs the words).
    const tw = document.createTreeWalker(rows[rows.length - 1], NodeFilter.SHOW_TEXT); const cutText = []
    let firstTextTop = Infinity
    for (let t = tw.nextNode(); t; t = tw.nextNode()) { if (!t.textContent.trim()) continue
      const rg = document.createRange(); rg.selectNodeContents(t)
      for (const q of rg.getClientRects()) { firstTextTop = Math.min(firstTextTop, q.top); if (q.top < lr.top - 0.5 || q.bottom > lr.bottom + 0.5) cutText.push(t.textContent.trim()) } }
    const lcs = getComputedStyle(rows[rows.length - 1])
    return { ...lr0, count: rows.length, res, maxTop: l.scrollTop, lastAtMax: last ? [last.top, last.bottom] : null, listAtMax: [lr.top, lr.bottom],
      listStyle: { pt: getComputedStyle(l).paddingTop, pb: getComputedStyle(l).paddingBottom, h: getComputedStyle(l).height },
      cutText, firstTextTop, lastRowStyle: { pt: lcs.paddingTop, bt: lcs.borderTopWidth, h: lcs.height }, lastInsideAtMax: !!last && last.bottom <= lr.bottom + 0.5 && last.top >= lr.top - 0.5 }
  })
  await wait(100); await shot('if-025-tc07-ops-end')
  save('if-025-tc07', { gate, s1, atTop0, wheel: { before, after }, end, ops })
  const wheelOk = s1.sh > s1.ch ? after.top > before : true
  check('IF-025', 'TC-07 sector scroller: overflow auto/scroll, wheel moves it, last effect inside at max', gate && /(auto|scroll)/.test(s1.oy) && wheelOk && end.inside,
    JSON.stringify({ s1, wheel: { before, after }, end }))
  const opsOk = /(auto|scroll)/.test(ops.oy) && ops.res.every((r) => r.inside && r.onTop) && ops.lastInsideAtMax && atTop0.headInView && atTop0.firstRowInView
  check('IF-025', 'TC-07 ops list: every row reachable, last inside at max, head + row at scroll 0', opsOk,
    JSON.stringify({ sh: ops.sh, ch: ops.ch, oy: ops.oy, count: ops.count, res: ops.res, maxTop: ops.maxTop, lastAtMax: ops.lastAtMax, listAtMax: ops.listAtMax, listStyle: ops.listStyle, cutText: ops.cutText, firstTextTop: ops.firstTextTop, lastRowStyle: ops.lastRowStyle, lastInsideAtMax: ops.lastInsideAtMax, atTop0 }))
}
await setScale(100); await wait(250)

// ---- TC-08 ----
await STATES.opening(); await install()
await ws("W.setState({ influence: 30, selected: 'an' })"); await wait(250)
{
  const gate = await cardGate('tc08')
  // Real control path: click the Antarctica row (locked rows have no onClick at HEAD; record the result).
  await ws("W.setState({ selected: 'eu' })"); await wait(200)
  // Playwright's page.click refuses aria-disabled controls; a real pointer click at the row's centre instead.
  const lb = await page.evaluate(() => { const b = document.querySelector('.wm-sector.locked'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 } })
  await page.mouse.click(lb.x, lb.y); await wait(250)
  const afterClick = await ws('return W.getState().selected')
  note(`TC-08 click on locked Antarctica row -> selected = ${afterClick}`)
  await ws("W.setState({ selected: 'an' })"); await wait(250)
  const res = {}
  for (const sc of [100, 125]) {
    await setScale(sc); await wait(250); await install()
    const d = await page.evaluate(() => {
      const p = document.querySelector('.wm-sector-scroll')
      const txt = document.body.innerText
      return { wraps: p.querySelectorAll('.wm-act-wrap').length, acts: p.querySelectorAll('.wm-act').length,
        actionsChildren: document.querySelector('.wm-actions')?.childElementCount ?? null,
        found: ['SECTOR LOCKED', '-12 UNREST OVER 6H', '+8 CONTROL OVER 12H', 'WAIVE INTEL GATE'].filter((s) => txt.includes(s) || document.body.textContent.includes(s)) }
    })
    const c = await clip()
    await shot(`if-025-tc08-${sc}`)
    res[sc] = { ...d, clipped: c }
  }
  await setScale(100); await wait(250)
  await ws("W.setState({ selected: 'eu' })"); await wait(250)
  const back = await page.evaluate(() => document.querySelectorAll('.wm-act-wrap').length)
  save('if-025-tc08', { gate, afterClick, res, back })
  const ok = gate && [100, 125].every((s) => res[s].wraps === 0 && res[s].acts === 0 && res[s].found.length === 0 && res[s].clipped.length === 0) && back === 3
  check('IF-025', 'TC-08 Antarctica: 0 rows, no SECTOR LOCKED / effect text, clipped [] at 100 and 125, Europe back to 3', ok, JSON.stringify({ afterClick, res, back }))
}

note(errs.length ? 'ERRORS ' + JSON.stringify(errs) : 'no console or page errors')
note(fails ? `FAILS ${fails}` : 'ALL PASS')
writeFileSync(`${OUT}run.log`, log.join('\n') + '\n')
await browser.close()
