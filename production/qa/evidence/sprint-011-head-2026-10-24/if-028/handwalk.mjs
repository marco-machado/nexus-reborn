// IF-028 hand-walk (Sprint 11, HEAD 131a5c1). Harness copied verbatim from
// production/qa/evidence/sprint-011/probe.mjs lines 22-412 (launch, HELPERS,
// fixtures, STATES, enter); OUT defaults to this folder. Cases:
// production/qa/test-cases/if-028-feed-times-and-timeline-axis-move-off-ink-faint-cases.md
// Run: PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011-head-2026-10-24/if-028/handwalk.mjs
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
// in that state (paused, so nothing moves between measurement and capture).
const STATES = {
  'opening-card': async () => { await fresh(); await pause() },
  opening: async () => { await fresh(); await dismissCard(); await pause() },
  'garrison-secure': async () => { await STATES.opening(); await sector('eu', { control: 60 }) },
  'garrison-strained': async () => { await STATES.opening(); await sector('eu', { control: 45 }) },
  'garrison-critical': async () => { await STATES.opening(); await sector('eu', { control: 20 }) },
  pressure: async () => { await STATES.opening(); await sector('eu', { unrest: 61 }) },
  crisis: async () => { await STATES.opening(); await sector('eu', { unrest: 80 }, true) },
  review: async () => {
    await STATES.opening()
    await store(async () => {
      const { useWorldStore } = await import('/src/state/worldStore.ts')
      useWorldStore.setState({ t: 30 * 3600 })
      useWorldStore.getState().setReview(30 * 3600 - 6 * 3600)
    })
  },
  failed: async () => {
    await STATES.opening()
    await store(async () => {
      const { useCampaignStore } = await import('/src/state/campaignStore.ts')
      useCampaignStore.setState({ campaignFailed: true })
    })
  },
  'influence-note': async () => {
    await fresh(); await dismissCard(); await pause()
    await store(async () => {
      const { useWorldStore } = await import('/src/state/worldStore.ts')
      useWorldStore.setState({ influence: 8, selected: 'na' })
    })
  },
  intel2: async () => {
    await STATES.opening()
    await store(async () => {
      const { useCampaignStore } = await import('/src/state/campaignStore.ts')
      useCampaignStore.setState({ intelLevel: 2 })
    })
  },
}

async function enter(name) {
  await STATES[name]()
  await wait(500)
  await install()
}

/* ------------------------------ IF-028 hand-walk ----------------------------- */
const INK_HC = 'rgb(226, 246, 238)'
const INK_FAINT_HC = 'rgb(109, 147, 138)'
const GREEN = 'rgb(125, 224, 138)'
const J = (o) => JSON.stringify(o)

// Per-element read: colour, effective alpha, composited ratio (from the probe's
// runs('body') row for that element), weight, text, clip/ellipsis.
const readAll = (sel) =>
  page.evaluate((sel) => {
    const rs = window.__probe.runs('body')
    return [...document.querySelectorAll(sel)].map((el) => {
      const r = rs.find((x) => x.el === el)
      const cs = getComputedStyle(el)
      return {
        text: el.textContent.trim(), cls: el.className || '', visible: window.__probe.visible(el),
        color: cs.color, weight: cs.fontWeight, alpha: r ? r.alpha : null, ratio: r ? r.ratio : null,
        clip: el.scrollWidth > el.clientWidth + 1 || cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth,
      }
    })
  }, sel)
const readTones = () =>
  page.evaluate(() => {
    const rs = window.__probe.runs('body')
    const rd = (el) => { const r = rs.find((x) => x.el === el); return { color: getComputedStyle(el).color, ratio: r ? r.ratio : null, alpha: r ? r.alpha : null } }
    return [...document.querySelectorAll('.wm-feed-line')].map((l) => ({
      cls: l.className, x: rd(l.querySelector('.wm-feed-x')), t: rd(l.querySelector('.wm-feed-t')), text: l.querySelector('.wm-feed-x').textContent.trim().slice(0, 30),
    }))
  })
const bodySweep = () =>
  page.evaluate(() => {
    const rs = window.__probe.runs('body')
    return {
      total: rs.length,
      head: rs.filter((r) => r.el.closest('.screen-head')).length,
      nav: rs.filter((r) => r.el.closest('.navtabs')).length,
      outsideScreen: rs.filter((r) => !r.el.closest('.screen')).map((r) => r.text + ' @ ' + r.path),
      faintDef: rs.filter((r) => r.color === 'rgb(53, 80, 74)').map((r) => r.text + ' @ ' + r.path),
      faintHC: rs.filter((r) => r.color === 'rgb(109, 147, 138)').map((r) => r.text + ' @ ' + r.path),
      low: rs.filter((r) => r.ratio < 4.5).map((r) => r.ratio + ' ' + r.text + ' ' + r.color + ' @ ' + r.path),
      minRatio: Math.min(...rs.map((r) => r.ratio)),
    }
  })
const cardUp = () => page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'UNDERSTOOD' && window.__probe.visible(b)))
const ensureNoCard = async () => {
  if (await cardUp()) {
    note('card still up after dismissCard(); clicking UNDERSTOOD')
    await page.getByRole('button', { name: 'UNDERSTOOD' }).click()
    await wait(600); await install()
  }
  note('card visible: ' + (await cardUp()))
}
const fourTone = () =>
  store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const s = useWorldStore.getState()
    const base = s.events[0]
    useWorldStore.setState({
      events: ['red', 'green', 'amber', 'dim'].map((tone, i) => ({ ...base, id: 9100 + i, t: Math.max(0, s.t - (i + 1) * 3600), tone })),
      unread: 0,
    })
  })
const toReview = () =>
  store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ t: 30 * 3600 })
    useWorldStore.getState().setReview(30 * 3600 - 6 * 3600)
  })
const settle = async () => { await wait(500); await install() }
const hcOn = () => page.evaluate(() => document.documentElement.classList.contains('s-high-contrast'))
const timecode = () => page.evaluate(() => { const e = document.querySelector('.wm-live'); return e ? { cls: e.className, text: e.textContent.trim() } : null })
const summ = (rows) => ({
  n: rows.length, colors: [...new Set(rows.map((r) => r.color))], minAlpha: Math.min(...rows.map((r) => r.alpha ?? -1)),
  minRatio: Math.min(...rows.map((r) => r.ratio ?? -1)), maxRatio: Math.max(...rows.map((r) => r.ratio ?? -1)), missing: rows.filter((r) => r.ratio == null).length,
})

note('# IF-028 hand-walk — ' + new Date().toISOString() + ' — ' + URL)

// ---- IF-028-02 Feed times, default
await enter('opening'); await ensureNoCard()
note('HC on: ' + (await hcOn()))
const ft = (await readAll('.wm-feed-t')).filter((r) => r.visible)
const ftS = summ(ft)
note('02 feed-t rows ' + J(ft))
note('02 summary ' + J(ftS))
check('IF-028-02', 'feed times Ink, alpha 1, >=4.5', ftS.n >= 1 && J(ftS.colors) === J([INK]) && ftS.minAlpha === 1 && ftS.minRatio >= 4.5 && ftS.missing === 0, J(ftS))
await shot('if-028-feed-times-default')

// ---- IF-028-03 A axis live + IF-028-05 NOW
const axL = await readAll('.wm-tl-axis > span')
note('03A axis live ' + J(axL))
const ticks = (ax) => ax.filter((r) => ['-24H', '-12H', '-6H'].includes(r.text))
const tickOk = (ax, col) => ticks(ax).length === 3 && ticks(ax).every((r) => r.color === col && r.alpha === 1 && r.ratio >= 4.5) && ax.length === 4 && ax.every((r) => !r.clip && r.visible)
check('IF-028-03A', 'live ticks Ink, alpha 1, >=4.5; 4 labels unclipped', tickOk(axL, INK), axL.map((r) => `${r.text} ${r.color} a${r.alpha} ${r.ratio}:1 clip=${r.clip}`).join(' | '))
await shot('if-028-axis-live')
const nowL = await readAll('.wm-tl-axis .now')
note('05 NOW live ' + J(nowL))
check('IF-028-05', 'live NOW teal >=4.5', nowL.length === 1 && nowL[0].text === 'NOW' && nowL[0].color === TEAL && nowL[0].ratio >= 4.5,
  nowL.map((r) => `${r.text} ${r.color} w${r.weight} ${r.ratio}:1`).join(' | '))

// ---- IF-028-04 body sweep, opening
const swO = await bodySweep()
note('04 opening sweep ' + J(swO))
check('IF-028-04', 'opening body sweep: head>=1 nav>=1 faint=0', swO.head >= 1 && swO.nav >= 1 && swO.faintDef.length === 0, `total ${swO.total} head ${swO.head} nav ${swO.nav} faint ${swO.faintDef.length}`)

// ---- IF-028-03 B axis review
await toReview(); await settle()
const tc = await timecode()
note('03B timecode ' + J(tc))
const axR = await readAll('.wm-tl-axis > span')
note('03B axis review ' + J(axR))
const nowR = axR.find((r) => r.text === 'NOW')
check('IF-028-03B', 'review ticks Ink alpha1 >=4.5; NOW no .now, >=4.5, not Ink Faint; REVIEW timecode',
  tickOk(axR, INK) && nowR && !/\bnow\b/.test(nowR.cls) && nowR.ratio >= 4.5 && nowR.color !== INK_FAINT && /REVIEW -/.test(tc?.text || '') && /GO LIVE/.test(tc?.text || ''),
  axR.map((r) => `${r.text} cls="${r.cls}" ${r.color} a${r.alpha} ${r.ratio}:1 clip=${r.clip}`).join(' | ') + ' // timecode ' + J(tc))
await shot('if-028-axis-review')

// ---- IF-028-04 body sweep, opening-card
await enter('opening-card'); await wait(800); await install()
note('opening-card: card visible ' + (await cardUp()))
const swC = await bodySweep()
note('04 opening-card sweep ' + J(swC))
check('IF-028-04', 'opening-card body sweep: head>=1 nav>=1 faint=0', swC.head >= 1 && swC.nav >= 1 && swC.faintDef.length === 0, `total ${swC.total} head ${swC.head} nav ${swC.nav} faint ${swC.faintDef.length}`)
await shot('if-028-opening-card-sweep')

// ---- IF-028-06 four tones, default
await enter('opening'); await ensureNoCard(); await fourTone(); await settle()
const toneExp = { red: RED_HOT, green: GREEN, notice: PRINT_WHITE, dim: INK }
const toneOk = (rows, exp, tcol) => {
  const out = []
  for (const k of Object.keys(exp)) {
    const r = rows.find((x) => x.cls.split(/\s+/).includes(k))
    if (!r) { out.push(`${k}: row missing`); continue }
    if (r.x.color !== exp[k] || !(r.x.ratio >= 4.5)) out.push(`${k} x ${r.x.color} ${r.x.ratio}:1 exp ${exp[k]}`)
    if (r.t.color !== tcol || !(r.t.ratio >= 4.5)) out.push(`${k} t ${r.t.color} ${r.t.ratio}:1 exp ${tcol}`)
  }
  return out
}
const tD = await readTones()
note('06 tones default ' + J(tD))
const tDbad = toneOk(tD, toneExp, INK)
check('IF-028-06', '4 rows; 8 colour reads match; 8 ratios >=4.5', tD.length === 4 && tDbad.length === 0, tD.length + ' rows; ' + (tDbad.join(' | ') || tD.map((r) => `${r.cls}: x ${r.x.color} ${r.x.ratio} / t ${r.t.color} ${r.t.ratio}`).join(' | ')))
await shot('if-028-feed-tones-default')
const ftD4 = (await readAll('.wm-feed-t')).filter((r) => r.visible)
const axD = await readAll('.wm-tl-axis > span')

// ---- IF-028-07 high contrast
await setHC(true); await settle()
note('07 HC class: ' + (await hcOn()))
const ftH = (await readAll('.wm-feed-t')).filter((r) => r.visible)
note('07 feed-t HC ' + J(ftH))
const cmpPairs = (a, b) => a.map((r, i) => ({ text: r.text, def: b[i]?.ratio, hc: r.ratio }))
const ftCmp = cmpPairs(ftH, ftD4)
const ftHS = summ(ftH)
check('IF-028-07', 'HC feed times HC Ink, alpha 1, >=4.5 and >= default ratio', ftHS.n >= 1 && J(ftHS.colors) === J([INK_HC]) && ftHS.minAlpha === 1 && ftHS.minRatio >= 4.5 && ftCmp.every((p) => p.hc >= p.def),
  J(ftHS) + ' pairs ' + J(ftCmp))
const axH = await readAll('.wm-tl-axis > span')
note('07 axis HC ' + J(axH))
const axCmp = cmpPairs(ticks(axH), ticks(axD))
check('IF-028-07', 'HC ticks HC Ink, alpha 1, >=4.5 and >= default', tickOk(axH, INK_HC) && axCmp.every((p) => p.hc >= p.def),
  axH.map((r) => `${r.text} ${r.color} a${r.alpha} ${r.ratio}:1`).join(' | ') + ' pairs ' + J(axCmp))
const nowH = axH.find((r) => r.text === 'NOW')
check('IF-028-07', 'HC live NOW teal', nowH && nowH.color === TEAL && /\bnow\b/.test(nowH.cls), J(nowH))
const tH = await readTones()
note('07 tones HC ' + J(tH))
const tHbad = toneOk(tH, { ...toneExp, dim: INK_HC }, INK_HC)
check('IF-028-07', 'HC tones: red/green/notice unchanged, dim + times HC Ink, >=4.5', tH.length === 4 && tHbad.length === 0, tH.length + ' rows; ' + (tHbad.join(' | ') || tH.map((r) => `${r.cls}: x ${r.x.color} ${r.x.ratio} / t ${r.t.color} ${r.t.ratio}`).join(' | ')))
const swH = await bodySweep()
note('07 HC body sweep ' + J(swH))
check('IF-028-07', 'HC body sweep: faint(def)=0 faint(HC)=0 below4.5=0', swH.faintDef.length === 0 && swH.faintHC.length === 0 && swH.low.length === 0,
  `total ${swH.total} faintDef ${swH.faintDef.length} faintHC ${swH.faintHC.length} low ${swH.low.length} min ${swH.minRatio} ${[...swH.faintHC, ...swH.low].slice(0, 6).join(' | ')}`)
await shot('if-028-hc')
await toReview(); await settle()
const tcH = await timecode()
const axHR = await readAll('.wm-tl-axis > span')
note('07 HC review timecode ' + J(tcH) + ' axis ' + J(axHR))
const nowHR = axHR.find((r) => r.text === 'NOW')
check('IF-028-07', 'HC review ticks HC Ink >=4.5; NOW >=4.5 not Ink Faint', tickOk(axHR, INK_HC) && /REVIEW -/.test(tcH?.text || '') && nowHR && nowHR.ratio >= 4.5 && ![INK_FAINT, INK_FAINT_HC].includes(nowHR.color),
  axHR.map((r) => `${r.text} cls="${r.cls}" ${r.color} a${r.alpha} ${r.ratio}:1`).join(' | '))
await shot('if-028-hc-review')
await setHC(false); await settle()
note('07 HC class after off: ' + (await hcOn()))
const ftOff = (await readAll('.wm-feed-t')).filter((r) => r.visible)
check('IF-028-07', 'HC off: feed times revert to Ink', ftOff.length >= 1 && ftOff.every((r) => r.color === INK), J(summ(ftOff)))

check('ALL', 'no console or page errors', errs.length === 0, errs.slice(0, 5).join(' | '))
note(fails ? `${fails} FAIL` : 'ALL PASS')
writeFileSync(`${OUT}handwalk-output.txt`, log.join('\n') + '\n')
await browser.close()
