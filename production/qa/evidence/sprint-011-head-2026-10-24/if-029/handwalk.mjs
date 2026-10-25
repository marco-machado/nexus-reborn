// IF-029 hand-walk harness (Sprint 11 /team-qa Phase 5, HEAD 131a5c1).
// Copied verbatim from production/qa/evidence/sprint-011/probe.mjs: lines
// 22-61 (launch, 1280x720 context, check/note), HELPERS, install, fresh,
// store, dismissCard, setHC, pause, sector, and STATES.opening / .failed.
// No other harness assist. Pixel sampling decodes page screenshots in a
// separate about:blank page (measurement only, never the app page).
// Run: PROBE_URL=http://localhost:4200/ PROBE_OUT=<this dir>/ node handwalk.mjs
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
const STATES = {
  opening: async () => { await fresh(); await dismissCard(); await pause() },
  failed: async () => {
    await STATES.opening()
    await store(async () => {
      const { useCampaignStore } = await import('/src/state/campaignStore.ts')
      useCampaignStore.setState({ campaignFailed: true })
    })
  },
}

/* ------------------------------ IF-029 hand-walk ----------------------------- */

const enter = async (name) => { await STATES[name](); await wait(500); await install() }
const cardUp = () => page.evaluate(() => [...document.querySelectorAll('button')].some((b) => /UNDERSTOOD/.test(b.textContent) && window.__probe.visible(b)))
async function enterSafe(name) {
  await enter(name)
  if (await cardUp()) { note('NOTE first-visit card still up after dismissCard; clicking UNDERSTOOD'); await page.getByRole('button', { name: /UNDERSTOOD/ }).click(); await wait(200) }
}
const sel = async (id) => { await sector(id, {}); await wait(250); await install() }
const hexRgb = (h) => { h = h.trim(); if (h.startsWith('rgb')) return h; const n = parseInt(h.slice(1), 16); return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})` }
const inkNow = async () => hexRgb(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink')))
const inkDimNow = async () => hexRgb(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink-dim')))
const inkFaintNow = async () => hexRgb(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink-faint')))
const lumOf = (rgb) => { const p = rgb.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]) }
const ratioRgb = (a, b) => { const [x, y] = [lumOf(a), lumOf(b)].sort((p, q) => q - p); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100 }
const J = (o) => JSON.stringify(o)

// Every row in the current list, with everything the cases read.
const readRows = () => page.evaluate(() => {
  const P = window.__probe
  const runs = P.runs('.wm-ops-list')
  const fr = (el) => { const cs = getComputedStyle(el); return { border: cs.borderTopColor, style: cs.borderTopStyle, bg: cs.backgroundColor, op: cs.opacity } }
  const clip = P.clipped('.wm-ops-list')
  return [...document.querySelectorAll('.wm-ops-list .wm-op')].map((row) => {
    const rr = runs.filter((r) => row.contains(r.el)).map((r) => {
      const kind = r.el.matches('.wm-op-main > b') ? 'codename' : r.el.closest('.wm-op-main i') ? (row.classList.contains('locked') ? 'reason' : 'type-city') : r.el.closest('.chip') ? 'chip' : 'other'
      const { el, ...rest } = r
      return { ...rest, kind }
    })
    const i = row.querySelector('.wm-op-main i')
    const svgs = [...row.querySelectorAll('.wm-op-glyph svg')]
    const g = svgs[0]
    const gb = g && g.getBoundingClientRect()
    let gAlpha = 1
    for (let n = g?.querySelector('rect, circle') ; n && n.nodeType === 1; n = n.parentElement) gAlpha *= parseFloat(getComputedStyle(n).opacity)
    const iBox = i && i.getBoundingClientRect()
    return {
      codename: row.querySelector('.wm-op-main > b')?.textContent.trim(),
      locked: row.classList.contains('locked'),
      ariaDisabled: row.getAttribute('aria-disabled'),
      ariaLabel: row.getAttribute('aria-label'),
      reason: i && { text: i.textContent.trim(), color: getComputedStyle(i).color, cls: i.className, w: Math.round(iBox.width), h: Math.round(iBox.height), clippedHits: clip.filter((c) => c.includes(i.textContent.trim().slice(0, 20))) },
      redDim: !!row.querySelector('.red-dim'),
      frame: fr(row),
      minAlpha: rr.length ? Math.min(...rr.map((r) => r.alpha)) : null,
      minRatio: rr.length ? Math.min(...rr.map((r) => r.ratio)) : null,
      runs: rr,
      glyphs: svgs.map((s) => s.getAttribute('viewBox')),
      glyph: g && { w: Math.round(gb.width * 10) / 10, h: Math.round(gb.height * 10) / 10, vis: getComputedStyle(g).visibility, color: getComputedStyle(row.querySelector('.wm-op-glyph')).color, alpha: gAlpha },
    }
  })
})

// Glyph computed ratio: currentColor at effective alpha over bgOf(row) on Void.
const glyphComputed = () => page.evaluate(() => {
  const P = window.__probe
  return [...document.querySelectorAll('.wm-op.locked')].map((row) => {
    const span = row.querySelector('.wm-op-glyph')
    const rect = span.querySelector('svg rect')
    let a = 1
    for (let n = rect; n && n.nodeType === 1; n = n.parentElement) a *= parseFloat(getComputedStyle(n).opacity)
    const col = P.parse(getComputedStyle(rect).fill === 'currentcolor' ? getComputedStyle(span).color : getComputedStyle(rect).fill) || P.parse(getComputedStyle(span).color)
    const bg = P.bgOf(span)
    const fg = P.over({ ...col, a: col.a * a }, bg)
    return { codename: row.querySelector('.wm-op-main > b').textContent.trim(), fill: getComputedStyle(rect).fill, color: getComputedStyle(span).color, alpha: a, bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`, ratio: Math.round(P.ratio(fg, bg) * 100) / 100 }
  })
})

// Pixel sampling: full-page screenshot decoded in a separate blank page.
const decoder = await ctx.newPage()
await decoder.goto('about:blank')
async function sample(points) {
  const buf = await page.screenshot()
  return decoder.evaluate(async ({ b64, points }) => {
    const img = new Image()
    img.src = 'data:image/png;base64,' + b64
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width; c.height = img.height
    const x = c.getContext('2d')
    x.drawImage(img, 0, 0)
    return { size: [img.width, img.height], px: points.map(([px, py]) => { const d = x.getImageData(Math.round(px), Math.round(py), 1, 1).data; return `rgb(${d[0]}, ${d[1]}, ${d[2]})` }) }
  }, { b64: buf.toString('base64'), points })
}
async function glyphPixels() {
  const pts = await page.evaluate(() => [...document.querySelectorAll('.wm-op.locked')].map((row) => {
    const span = row.querySelector('.wm-op-glyph')
    const r = span.querySelector('svg rect').getBoundingClientRect()
    const s = span.getBoundingClientRect()
    return { codename: row.querySelector('.wm-op-main > b').textContent.trim(), body: [r.left + r.width / 2, r.top + r.height / 2], bg: [s.left - 3, s.top + s.height / 2] }
  }))
  const out = []
  for (const p of pts) {
    const { size, px } = await sample([p.body, p.bg])
    out.push({ codename: p.codename, size, bodyAt: p.body.map(Math.round), bgAt: p.bg.map(Math.round), body: px[0], bg: px[1], ratio: ratioRgb(px[0], px[1]) })
  }
  return out
}
const gray = (on) => page.evaluate((on) => { document.documentElement.style.filter = on ? 'grayscale(1)' : '' }, on)
const phase = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
const R = {}
const res = (tc, ok, detail) => { R[tc] = ok; check('IF-029', tc, ok, typeof detail === 'string' ? detail : J(detail)) }
const SECS = ['eu', 'as', 'na']

note('# IF-029 hand-walk — ' + new Date().toISOString() + ' — ' + URL)
note('viewport ' + J(page.viewportSize()))

/* TC-05 */
{
  const bad = []
  for (const hc of [false, true]) {
    await enterSafe('opening'); await sector('eu', {}); await setHC(hc); await wait(250); await install()
    const ink = await inkNow(), dim = await inkDimNow(), faint = await inkFaintNow()
    const L = lumOf(ink)
    const rows = (await readRows()).filter((r) => r.locked)
    note(`TC-05 ${hc ? 'hc' : 'default'} ink ${ink} (lum ${L.toFixed(4)}) ink-dim ${dim} ink-faint ${faint} locked rows ${rows.length}`)
    for (const r of rows) for (const u of r.runs) {
      const l = lumOf(u.color)
      note(`  ${r.codename} [${u.kind}] "${u.text}" ${u.color} lum ${l.toFixed(4)} alpha ${u.alpha} ratio ${u.ratio} ${u.path}`)
      if (u.kind === 'reason') continue
      if (l < L - 1e-9 || u.alpha !== 1 || u.ratio < 4.5 || [INK_DIM, INK_FAINT, dim, faint].includes(u.color)) bad.push(`${hc ? 'hc' : 'def'} ${r.codename} "${u.text}" ${u.color} a${u.alpha} r${u.ratio}`)
    }
    if (!rows.length) bad.push(`${hc ? 'hc' : 'def'} no locked rows`)
    if (!rows.some((r) => r.runs.some((u) => u.kind === 'type-city'))) note(`  TC-05 ${hc ? 'hc' : 'default'}: no TYPE // CITY run in any locked row (as built the reason replaces it)`)
    await shot(`tc05-${hc ? 'hc' : 'default'}`)
  }
  await setHC(false)
  res('TC-05 codename/chips in locked rows Ink or brighter, alpha 1, >= 4.5:1 (default + HC)', bad.length === 0, bad)
}

/* TC-06 */
{
  await enterSafe('opening')
  const bad = []
  for (const s of SECS) {
    await sel(s)
    const rows = await readRows()
    for (const r of rows) {
      note(`TC-06 ${s} ${r.codename} locked ${r.locked} viewBox ${J(r.glyphs)} box ${J(r.glyph)}`)
      const want = r.locked ? '0 0 12 14' : '0 0 16 16'
      if (r.glyphs.length !== 1 || r.glyphs[0] !== want || !(r.glyph.w > 0 && r.glyph.h > 0) || r.glyph.vis !== 'visible') bad.push(`${s} ${r.codename} ${J(r.glyphs)}`)
    }
    await shot(`tc06-${s}`)
  }
  res('TC-06 lock glyph on locked rows, target glyph on open rows', bad.length === 0, bad)
}

/* TC-07 */
{
  const bad = []
  for (const hc of [false, true]) {
    await enterSafe('opening'); await sector('as', {}); await setHC(hc); await wait(250); await install()
    const hcRow = (await readRows()).find((r) => r.codename === 'HOLLOW CROWN')
    await shot(`tc07-as-${hc ? 'hc' : 'default'}`)
    await sel('na')
    const rh = (await readRows()).find((r) => r.codename === 'RUST HAVEN')
    const { runs, ...h } = hcRow || {}
    note(`TC-07 ${hc ? 'hc' : 'default'} HOLLOW CROWN ${J(h)}`)
    note(`TC-07 ${hc ? 'hc' : 'default'} RUST HAVEN frame ${J(rh?.frame)} locked ${rh?.locked}`)
    if (!hcRow) { bad.push('no HOLLOW CROWN row'); continue }
    const f = hcRow.frame, o = rh.frame
    const differs = f.border !== o.border || f.style !== o.style || f.bg !== o.bg
    const ok = hcRow.locked && hcRow.minAlpha === 1 && hcRow.minRatio >= 4.5 && /^REQUIRES INTEL LVL \d$/.test(hcRow.reason.text) && hcRow.reason.color === RED_HOT && !hcRow.redDim && f.op === '1' && differs && hcRow.ariaDisabled === 'true'
    if (!ok) bad.push(`${hc ? 'hc' : 'def'} ${J(h)}`)
  }
  await setHC(false)
  res('TC-07 HOLLOW CROWN meets AC-1/AC-2 in both modes', bad.length === 0, bad)
}

/* TC-08 / TC-09 */
for (const hc of [false, true]) {
  const tc = hc ? 'TC-09' : 'TC-08'
  await enterSafe('opening'); await setHC(hc); await wait(150)
  await sel('eu')
  const openEu = (await readRows()).find((r) => !r.locked)
  await sel('na')
  const openNa = (await readRows()).find((r) => r.codename === 'RUST HAVEN')
  note(`${tc} open-row frames (opening, ${hc ? 'hc' : 'default'}): eu ${openEu?.codename} ${J(openEu?.frame)}; na ${openNa?.codename} ${J(openNa?.frame)}`)
  const refs = [openEu, openNa].filter(Boolean).map((r) => r.frame)
  await enterSafe('failed'); await setHC(hc); await wait(250); await install()
  const bad = []
  let count = 0
  for (const s of ['eu', 'na', 'as']) {
    await sel(s)
    const rows = await readRows()
    for (const r of rows) {
      count++
      const { runs, ...x } = r
      note(`${tc} ${s} ${J(x)}`)
      const f = r.frame
      const differs = refs.length > 0 && refs.every((o) => f.border !== o.border || f.style !== o.style || f.bg !== o.bg)
      const ok = r.locked && r.reason && r.reason.text === 'CAMPAIGN LOST' && r.reason.color === RED_HOT && !/red-dim/.test(r.reason.cls) && !r.redDim && r.minAlpha === 1 && r.minRatio >= 4.5 && f.op === '1' && differs && r.glyphs.length === 1 && r.glyphs[0] === '0 0 12 14' && r.ariaDisabled === 'true'
      if (!ok) bad.push(`${s} ${r.codename}`)
    }
    await shot(`${hc ? 'tc09-failed-hc' : 'tc08-failed-default'}-${s}`)
  }
  if (!count) bad.push('no rows')
  res(`${tc} failed campaign rows locked treatment (${hc ? 'high contrast' : 'default'}) rows ${count}`, bad.length === 0, bad)
}
await setHC(false)

/* TC-10 */
{
  await enterSafe('opening')
  const bad = []
  await gray(true)
  for (const s of SECS) {
    await sel(s)
    const rows = await readRows()
    await shot(`tc10-gray-${s}`)
    if (s === 'eu') {
      // The open row sits below the list's fold at 1280x720: scroll the list
      // (as a player would) and capture it in grayscale too.
      await page.evaluate(() => { const l = document.querySelector('.wm-ops-list'); l.scrollTop = l.scrollHeight })
      await wait(200)
      await shot('tc10-gray-eu-scrolled')
      const inView = await page.evaluate(() => {
        const l = document.querySelector('.wm-ops-list').getBoundingClientRect()
        return [...document.querySelectorAll('.wm-ops-list .wm-op')].map((row) => {
          const r = row.querySelector('.wm-op-glyph svg').getBoundingClientRect()
          const i = row.querySelector('.wm-op-main i').getBoundingClientRect()
          return { codename: row.querySelector('.wm-op-main > b').textContent.trim(), locked: row.classList.contains('locked'), glyphInView: r.top >= l.top && r.bottom <= l.bottom, textInView: i.top >= l.top && i.bottom <= l.bottom, text: row.querySelector('.wm-op-main i').textContent.trim(), viewBox: row.querySelector('.wm-op-glyph svg').getAttribute('viewBox') }
        })
      })
      note(`TC-10 eu scrolled in-view ${J(inView)}`)
      const open = inView.find((r) => !r.locked)
      if (!open || !open.glyphInView || open.viewBox !== '0 0 16 16' || /REQUIRES|CAMPAIGN LOST/.test(open.text)) bad.push('eu open row not observed with target glyph / no reason after scroll')
      await page.evaluate(() => { document.querySelector('.wm-ops-list').scrollTop = 0 })
      await wait(150)
    }
    const px = await glyphPixels()
    for (const r of rows) {
      note(`TC-10 ${s} ${r.codename} locked ${r.locked} viewBox ${J(r.glyphs)} reason ${J(r.reason)}`)
      if (r.locked) {
        if (r.glyphs[0] !== '0 0 12 14' || !/^REQUIRES INTEL LVL \d$/.test(r.reason.text) || !(r.reason.w > 0 && r.reason.h > 0) || r.reason.clippedHits.length) bad.push(`${s} ${r.codename} locked`)
      } else {
        if (r.glyphs[0] !== '0 0 16 16' || /REQUIRES|CAMPAIGN LOST/.test(r.reason?.text || '')) bad.push(`${s} ${r.codename} open`)
      }
    }
    for (const p of px) note(`TC-10 ${s} gray glyph pixels ${J(p)}`)
    // Reason drawn: brightest pixel across the reason box vs the row background left of the glyph.
    const rp = await page.evaluate(() => [...document.querySelectorAll('.wm-op.locked')].map((row) => {
      const i = row.querySelector('.wm-op-main i').getBoundingClientRect(); const s = row.querySelector('.wm-op-glyph').getBoundingClientRect()
      const pts = []; for (let x = i.left + 1; x < Math.min(i.right, i.left + 120); x += 1) pts.push([x, i.top + i.height / 2])
      return { codename: row.querySelector('.wm-op-main > b').textContent.trim(), pts, bg: [s.left - 3, s.top + s.height / 2] }
    }))
    for (const r of rp) {
      const { px } = await sample([...r.pts, r.bg])
      const bg = px.pop()
      const best = px.reduce((m, c) => (lumOf(c) > lumOf(m) ? c : m), px[0])
      note(`TC-10 ${s} gray reason ${r.codename}: brightest ${best} vs row bg ${bg} ratio ${ratioRgb(best, bg)}`)
      if (ratioRgb(best, bg) < 3) bad.push(`${s} ${r.codename} reason pixels ${best} on ${bg}`)
    }
  }
  await gray(false)
  res('TC-10 grayscale: locked rows lock glyph + visible unclipped reason; open rows neither', bad.length === 0, bad)
}

/* TC-11 */
{
  const bad = []
  for (const hc of [false, true]) {
    for (const s of ['eu', 'as']) {
      await enterSafe('opening'); await sector(s, {}); await setHC(hc); await wait(250); await install()
      const comp = await glyphComputed()
      const px = await glyphPixels()
      for (const c of comp) note(`TC-11 ${hc ? 'hc' : 'default'} ${s} computed ${J(c)}`)
      for (const p of px) note(`TC-11 ${hc ? 'hc' : 'default'} ${s} pixel ${J(p)}`)
      for (const c of comp) {
        const p = px.find((q) => q.codename === c.codename)
        if (c.ratio < 3 || c.alpha !== 1 || !p || p.ratio < 3) bad.push(`${hc ? 'hc' : 'def'} ${c.codename} computed ${c.ratio} pixel ${p?.ratio}`)
      }
      await page.locator('.wm-op.locked .wm-op-glyph').first().screenshot({ path: `${OUT}tc11-glyph-${hc ? 'hc' : 'default'}-${s}.png` })
    }
  }
  for (const s of ['eu', 'as']) {
    await enterSafe('opening'); await sector(s, {}); await setHC(false); await wait(250); await install()
    await gray(true)
    const px = await glyphPixels()
    for (const p of px) { note(`TC-11 grayscale ${s} pixel ${J(p)}`); if (p.ratio < 3) bad.push(`gray ${p.codename} pixel ${p.ratio}`) }
    await page.locator('.wm-op.locked .wm-op-glyph').first().screenshot({ path: `${OUT}tc11-glyph-gray-${s}.png` })
    await gray(false)
  }
  res('TC-11 lock glyph >= 3:1 computed and pixel (default, HC, grayscale)', bad.length === 0, bad)
}

/* TC-12 */
{
  await enterSafe('opening')
  const bad = []
  const seen = {}
  for (const hc of [false, true]) {
    await setHC(hc); await wait(150)
    for (const s of SECS) {
      await sel(s)
      for (const r of await readRows()) {
        note(`TC-12 ${hc ? 'hc' : 'default'} ${s} ${r.codename} locked ${r.locked} aria-disabled ${J(r.ariaDisabled)}`)
        if (r.locked ? r.ariaDisabled !== 'true' : r.ariaDisabled !== null) bad.push(`${hc ? 'hc' : 'def'} ${s} ${r.codename} ${r.ariaDisabled}`)
        const k = s + r.codename
        if (k in seen && seen[k] !== r.ariaDisabled) bad.push(`mode-dependent ${k}`)
        seen[k] = r.ariaDisabled
      }
    }
  }
  await setHC(false); await sel('eu')
  await page.locator('.wm-op.locked').first().click({ force: true })
  await wait(400)
  const ph = await phase()
  note(`TC-12 after force-click on locked row: phase ${ph}`)
  if (ph !== 'world') bad.push('phase ' + ph)
  res('TC-12 aria-disabled true on locked, absent on open, both modes; locked click stays on world', bad.length === 0, bad)
}

note(errs.length ? 'ERRORS ' + J(errs) : 'no console or page errors')
note(fails ? `${fails} FAIL` : 'ALL PASS')
writeFileSync(`${OUT}handwalk-output.txt`, log.join('\n') + '\n')
await browser.close()
