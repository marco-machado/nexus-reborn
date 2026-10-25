// IF-031 hand-walk (TC-03..TC-06). Lines below copied from production/qa/evidence/sprint-011/probe.mjs lines 22-367 (launch, HELPERS, fixtures); OUT points at this folder.
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
const OUT = new globalThis.URL(".", import.meta.url).pathname
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

/* ------------------------------ IF-031 hand-walk ---------------------------- */

const opening = async () => { await fresh(); await dismissCard(); await pause() }
const cardUp = async () => {
  await wait(200)
  const b = page.getByRole('button', { name: /UNDERSTOOD/i })
  if (await b.count()) { note('card still up after dismissCard(); clicking UNDERSTOOD'); await b.first().click(); await wait(200) }
}
const seed = () => store(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const s = useWorldStore.getState(); const base = s.events[0]
  const sectors = ['na','sa','eu','af','as','oc']
  const long = 'LONG FEED LINE FOR WRAP CHECK '.repeat(6).trim()
  const events = Array.from({ length: 14 }, (_, i) => ({ ...base, contract: undefined, id: 9100 + i, t: i * 60,
    sector: sectors[i % 6], text: (i === 3 || i === 10) ? long : 'SHORT LINE ' + i }))
  useWorldStore.setState({ events, unread: 3 })
})
const rows = () => page.evaluate(() => [...document.querySelectorAll('.wm-feed-line')].map((b) => {
  const r = b.getBoundingClientRect()
  return { top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height, text: b.querySelector('.wm-feed-x')?.textContent ?? '', label: b.getAttribute('aria-label'),
    xs: b.querySelector('.wm-feed-x')?.scrollHeight, xc: b.querySelector('.wm-feed-x')?.clientHeight, xbottom: b.querySelector('.wm-feed-x')?.getBoundingClientRect().bottom }
}))
const listRect = () => page.evaluate(() => {
  const el = document.querySelector('.wm-feed-list'); const r = el.getBoundingClientRect()
  return { top: r.top, bottom: r.bottom, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollTop: el.scrollTop }
})
const inView = (row, L) => row.top >= L.top - 0.01 && row.bottom <= L.bottom + 0.01
const st = () => page.evaluate(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const { useAppStore } = await import('/src/state/appStore.ts')
  const w = useWorldStore.getState()
  return { selected: w.selected, unread: w.unread, phase: useAppStore.getState().phase,
    header: document.querySelector('.wm-feed')?.querySelector('.panel-head, header, h2, .panel-title')?.parentElement?.textContent?.slice(0, 60) ?? null,
    badge: (document.querySelector('.wm-feed .wm-unread') ?? [...document.querySelectorAll('.wm-feed span.dim')].find((x) => /FEED CLEAR/.test(x.textContent)))?.textContent ?? null,
    readout: (document.querySelector('.wm-inset-tag')?.textContent ?? '').split(' // ')[0].trim() || null,
    pressed: document.querySelector('[aria-pressed="true"] .wm-sector-name')?.textContent ?? null }
})
const sectorName = (id) => store(async (id) => (await import('/src/game/atlas.ts')).sectorDef(id).name, id)
const scrollList = (to) => page.evaluate((to) => { const el = document.querySelector('.wm-feed-list'); el.scrollTop = to === 'bottom' ? el.scrollHeight : 0 }, to)

await opening(); await cardUp(); await seed(); await wait(250)

// ---- TC-03
{
  const R = await rows()
  note('TC-03 rows: ' + JSON.stringify(R.map((r) => ({ t: r.text.slice(0, 14), top: +r.top.toFixed(1), h: +r.height.toFixed(1), xs: r.xs, xc: r.xc }))))
  const longIdx = R.map((r, i) => (r.text.startsWith('LONG') ? i : -1)).filter((i) => i >= 0)
  const shortH = R.filter((r) => !r.text.startsWith('LONG')).map((r) => r.height)
  const minH = Math.min(...R.map((r) => r.height)), maxShort = Math.max(...shortH)
  const overl = R.filter((r, i) => i > 0 && r.top < R[i - 1].top + R[i - 1].height - 0.5).length
  const longH = longIdx.map((i) => R[i].height)
  const contained = longIdx.every((i) => R[i].xs <= R[i].xc + 1 && R[i].xbottom <= R[i].bottom + 0.5)
  check('IF-031', 'TC-03 row count 14', R.length === 14, String(R.length))
  check('IF-031', 'TC-03 min height >= 24', minH >= 24, `min ${minH}`)
  check('IF-031', 'TC-03 each long row taller than tallest short row', longIdx.length === 2 && longH.every((h) => h > maxShort), `long ${JSON.stringify(longH)} at idx ${longIdx}, max short ${maxShort}`)
  check('IF-031', 'TC-03 zero overlapping pairs', overl === 0, `${overl} overlaps`)
  check('IF-031', 'TC-03 long text inside its row (scrollH<=clientH, text bottom<=row bottom)', contained, JSON.stringify(longIdx.map((i) => ({ xs: R[i].xs, xc: R[i].xc, xb: R[i].xbottom, rb: R[i].bottom }))))
  for (const [n, i] of longIdx.entries()) {
    await page.locator('.wm-feed-line').nth(i).evaluate((b) => b.scrollIntoView({ block: 'nearest' }))
    await wait(150); await shot(`if-031-wrapped-rows-${n + 1}`)
  }
}

// ---- TC-04
{
  await scrollList('top'); await wait(150)
  let L = await listRect(); let R = await rows()
  note('TC-04 list: ' + JSON.stringify(L) + ' first row ' + JSON.stringify({ text: R[0].text, top: R[0].top, bottom: R[0].bottom }))
  check('IF-031', 'TC-04 scrollHeight > clientHeight', L.scrollHeight > L.clientHeight, `${L.scrollHeight} vs ${L.clientHeight}`)
  check('IF-031', 'TC-04 first row is SHORT LINE 13', R[0].text === 'SHORT LINE 13', 'aria ' + R[0].label)
  check('IF-031', 'TC-04 newest row fully in list rect', inView(R[0], L))
  await scrollList('bottom'); await wait(150)
  L = await listRect(); R = await rows()
  const last = R[R.length - 1]
  check('IF-031', 'TC-04 bottom: last row SHORT LINE 0 fully visible', last.text === 'SHORT LINE 0' && inView(last, L), `${last.text} top ${last.top} bottom ${last.bottom} list ${L.top}-${L.bottom} scrollTop ${L.scrollTop}`)
  await shot('if-031-feed-scrolled-bottom')
  const lr = await page.locator('.wm-feed-list').boundingBox()
  await page.mouse.move(lr.x + lr.width / 2, lr.y + lr.height / 2)
  await page.mouse.wheel(0, -2000); await wait(300)
  L = await listRect(); R = await rows()
  check('IF-031', 'TC-04 wheel to top: SHORT LINE 13 fully visible', R[0].text === 'SHORT LINE 13' && inView(R[0], L), `scrollTop ${L.scrollTop} first ${R[0].text} ${R[0].top}-${R[0].bottom} list ${L.top}-${L.bottom}`)
  await shot('if-031-feed-top')
  const append = (ev) => store(async (ev) => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const s = useWorldStore.getState()
    useWorldStore.setState({ events: [...s.events, { ...s.events[s.events.length - 1], contract: undefined, ...ev }] })
  }, ev)
  await append({ id: 9114, t: 840, sector: 'eu', text: 'SHORT LINE 14' }); await wait(250)
  L = await listRect(); R = await rows()
  check('IF-031', 'TC-04 step 6: 14 rows, SHORT LINE 14 first', R.length === 14 && R[0].text === 'SHORT LINE 14', `${R.length} rows, first ${R[0].text}, scrollTop ${L.scrollTop}, first visible ${inView(R[0], L)}`)
  await scrollList('bottom'); await wait(150)
  await append({ id: 9115, t: 900, sector: 'af', text: 'SHORT LINE 15' }); await wait(250)
  await scrollList('top'); await wait(150)
  L = await listRect(); R = await rows()
  check('IF-031', 'TC-04 step 7: 14 rows, SHORT LINE 15 first and fully visible at top', R.length === 14 && R[0].text === 'SHORT LINE 15' && inView(R[0], L), `${R.length} rows, first ${R[0].text}, last ${R[R.length - 1].text}, scrollTop ${L.scrollTop}`)
}

// ---- TC-05 (fresh seed)
await seed(); await wait(250)
for (const [label, sec, mode] of [['SHORT LINE 2', 'eu', 'click'], ['SHORT LINE 4', 'as', 'enter']]) {
  await store(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ unread: 3 }); useWorldStore.getState().select('na') })
  await wait(150)
  const before = await st()
  note(`TC-05 ${mode} before: ${JSON.stringify(before)}`)
  await scrollList('bottom'); await wait(100)
  const row = page.locator('.wm-feed-line', { hasText: new RegExp('^\\d\\d:\\d\\d' + label + '>?$') })
  const n = await row.count()
  const aria = n ? await row.first().getAttribute('aria-label') : null
  note(`TC-05 ${mode} target: ${n} match, aria "${aria}"`)
  await row.first().evaluate((b) => b.scrollIntoView({ block: 'nearest' }))
  if (mode === 'click') await row.first().click()
  else { await row.first().focus(); await page.keyboard.press('Enter') }
  await wait(200)
  const after = await st(); const name = await sectorName(sec)
  note(`TC-05 ${mode} after: ${JSON.stringify(after)}; expected sector ${sec} (${name})`)
  check('IF-031', `TC-05 ${mode} ${label}: selected=${sec}, unread 0, FEED CLEAR, phase world, readout+sector list ${name}`,
    before.selected === 'na' && after.selected === sec && after.unread === 0 && /FEED CLEAR/.test(after.badge ?? '') && after.phase === 'world' && after.readout === name && after.pressed === name)
  if (mode === 'click') await shot('if-031-row-click-focused')
}

// ---- TC-06
{
  await seed(); await wait(250); await scrollList('top'); await wait(150)
  const res = await page.evaluate(() => {
    const L = document.querySelector('.wm-feed-list').getBoundingClientRect()
    const els = [...document.querySelectorAll('.wm-feed-line')]
    const vis = els.filter((b) => { const r = b.getBoundingClientRect(); return r.top >= L.top && r.bottom <= L.bottom })
    const hits = [], gaps = []
    vis.forEach((b, i) => {
      const r = b.getBoundingClientRect(); const x = r.left + r.width / 2
      for (const y of [r.top + 1, r.top + r.height / 2, r.bottom - 1]) hits.push({ i, y, ok: document.elementFromPoint(x, y)?.closest('.wm-feed-line') === b })
      if (i > 0) {
        const p = vis[i - 1].getBoundingClientRect(); const gy = (p.bottom + r.top) / 2
        const el = document.elementFromPoint(x, gy); const row = el?.closest('.wm-feed-line')
        gaps.push({ i, gy, gap: r.top - p.bottom, el: el ? el.tagName.toLowerCase() + '.' + el.className : null, foreign: !!row && row !== b && row !== vis[i - 1] })
      }
    })
    return { visible: vis.length, hits, gaps }
  })
  const bad = res.hits.filter((h) => !h.ok)
  note(`TC-06 ${res.visible} fully visible rows, ${res.hits.length} hits, ${bad.length} wrong: ${JSON.stringify(bad)}`)
  note(`TC-06 gaps: ${JSON.stringify(res.gaps.map((g) => ({ i: g.i, gap: +g.gap.toFixed(2), el: g.el, foreign: g.foreign })))}`)
  check('IF-031', 'TC-06 100% top/mid/bottom hits return own row', res.hits.length > 0 && bad.length === 0, `${res.hits.length - bad.length}/${res.hits.length}`)
  check('IF-031', 'TC-06 no gap hit returns a non-neighbour row', res.gaps.every((g) => !g.foreign))
  const R = await rows()
  const secOf = (r) => r.label.split(' // FOCUS ')[1]
  // step 4: short row idx 1 (row above idx 0 has a different sector), click top+1
  const edge = async (i, where) => {
    await store(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.getState().select('na'); useWorldStore.setState({ unread: 3 }) })
    await wait(100)
    const r = (await rows())[i]
    const y = where === 'top' ? r.top + 1 : r.bottom - 1
    await page.mouse.click(r.left + r.width / 2, y); await wait(200)
    const s = await st()
    return { text: r.text, y, want: secOf(r), got: s.readout, selected: s.selected }
  }
  // pick short rows whose sector is not 'na' (so a no-op cannot pass) and whose neighbour differs
  const shortIdx = R.map((r, i) => i).filter((i) => !R[i].text.startsWith('LONG') && secOf(R[i]) !== 'NORTH AMERICA')
  const iTop = shortIdx.find((i) => i > 0 && secOf(R[i - 1]) !== secOf(R[i]) && inView(R[i], { top: -1e9, bottom: 1e9 }))
  const iBot = shortIdx.find((i) => i !== iTop && i < R.length - 1 && secOf(R[i + 1]) !== secOf(R[i]))
  const a = await edge(iTop, 'top'); note('TC-06 step 4 ' + JSON.stringify(a))
  check('IF-031', 'TC-06 step 4 top-edge click selects clicked row sector', a.got === a.want, `${a.text}: want ${a.want}, got ${a.got} (${a.selected})`)
  const b = await edge(iBot, 'bottom'); note('TC-06 step 5 ' + JSON.stringify(b) + ' neighbour below ' + secOf(R[iBot + 1]))
  check('IF-031', 'TC-06 step 5 bottom-edge click selects clicked row sector, not neighbour', b.got === b.want, `${b.text}: want ${b.want}, got ${b.got} (${b.selected}), neighbour ${secOf(R[iBot + 1])}`)
}

note('errors: ' + JSON.stringify(errs))
note(`DONE ${fails} fail(s)`)
writeFileSync(OUT + 'run.log', log.join('\n') + '\n')
await browser.close()
