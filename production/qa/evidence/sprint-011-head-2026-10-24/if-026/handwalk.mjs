// IF-026 hand-walks (Sprint 11 Phase 5, HEAD 131a5c1). Headless Chrome for Testing, 1280x720.
// Lines 22-426 (setup, HELPERS, fixtures, STATES, enter, readoutSel) and onScreen (760-770)
// copied verbatim from production/qa/evidence/sprint-011/probe.mjs.
// Run: PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011-head-2026-10-24/if-026/handwalk.mjs
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

/* ---------------------------------- checks ---------------------------------- */

const readoutSel = [
  '.wm-resource b',
  '.wm-sector-name',
  '.wm-sector-reading b',
  '.wm-cu b',
  '.wm-kv-readout',
  '.wm-op-main > b',
  '.wm-speed b',
  '.wm-date',
  '.wm-clock',
]
async function onScreen(phase) {
  await enter('opening')
  if (phase === 'brief') {
    await store(async () => {
      const { useAppStore } = await import('/src/state/appStore.ts')
      useAppStore.getState().selectMission('m03')
    })
  } else if (phase !== 'world') await goto(phase)
  await wait(500)
  await install()
}

/* ------------------------------ IF-026 hand-walks ------------------------------ */
const J = (o) => JSON.stringify(o)
note('# IF-026 hand-walk — ' + new Date().toISOString())
await page.goto(URL); await wait(800); await setHC(false)
await setScale(100)

// TC-12 (and per-state min run for TC-12 step 4)
note('## TC-12 readouts by name')
for (const name of Object.keys(STATES)) {
  await enter(name)
  const runs = await runsIn('.screen')
  const ro = await page.evaluate((sels) => sels.map((s) => {
    const els = [...document.querySelectorAll(s)].filter(window.__probe.visible)
    return { sel: s, n: els.length, items: els.map((el) => el.textContent.trim().slice(0, 20) + '=' + getComputedStyle(el).fontSize) }
  }), readoutSel)
  const nres = await page.evaluate(() => [...document.querySelectorAll('.wm-resource')].filter(window.__probe.visible).map((e) => e.textContent.trim().replace(/\s+/g, ' ')))
  note(`TC12 ${name}: minRun=${Math.min(...runs.map((r) => r.size))}px runs=${runs.length} resources=${J(nres)}`)
  for (const r of ro) note(`TC12 ${name} ${r.sel} n=${r.n} ${J(r.items)}`)
  const low = ro.flatMap((r) => r.items.filter((i) => parseFloat(i.split('=').pop()) < 11.95).map((i) => r.sel + ' ' + i))
  const zero = ro.filter((r) => r.n === 0).map((r) => r.sel)
  note(`TC12 ${name} SUMMARY zeroMatch=${J(zero)} below12=${J(low)}`)
}

// TC-13 state-only runs
note('## TC-13 state-only runs')
const groups = [
  ['review', (r) => r.text.startsWith('REVIEW -') || r.text.includes('GO LIVE')],
  ['pressure', (r) => r.text.includes('UNREST PRESSURE')],
  ['crisis', (r) => r.text === 'CRISIS' || r.text.includes('CRISIS')],
  ['failed', (r) => r.path.includes('wm-campaign-fail') || r.text.includes('CAMPAIGN LOST') || r.text.includes('NO CONTRACT CAN BE TAKEN')],
  ['opening', (r) => r.text.includes('EXPIRY')],
]
for (const [name, f] of groups) {
  await enter(name)
  const hit = (await runsIn('.screen')).filter(f)
  note(`TC13 ${name} count=${hit.length} ${J(hit.map((r) => `${r.size}px "${r.text}" ${r.path}`))}`)
  if (name === 'review') await shot('tc13-review')
}
await enter('intel2')
const fc = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.wm-fc-chip, .wm-fc-chip *')].filter(window.__probe.visible)
  const runs = window.__probe.runs('.screen')
  return els.filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => ({ t: e.textContent.trim().slice(0, 30), size: getComputedStyle(e).fontSize, inRuns: runs.some((r) => r.el === e) }))
})
note(`TC13 intel2 forecast chip text elements count=${fc.length} ${J(fc)}`)
await shot('tc13-intel2')

// TC-14 fiction chrome / globe labels / sr-only
note('## TC-14 measurement rules')
await enter('opening')
let waited = 0
for (; waited < 10000; waited += 250) {
  const busy = await page.evaluate(() => [...document.querySelectorAll('.globe-status')].filter(window.__probe.visible).map((e) => e.textContent.trim()))
  if (!busy.length) break
  await wait(250)
}
await install()
const t14 = await page.evaluate(() => {
  const P = window.__probe
  const runs = P.runs('.screen')
  const inRuns = (el) => runs.some((r) => r.el === el)
  const status = [...document.querySelectorAll('.globe-status')].filter(P.visible).map((e) => e.textContent.trim())
  const lb = [...document.querySelectorAll('.globe-toolbar button')].find((b) => b.textContent.trim() === 'LABELS')
  const labels = [...document.querySelectorAll('.globe-marker-label')].filter(P.visible).map((e) => {
    const tn = []; const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); for (let t = tw.nextNode(); t; t = tw.nextNode()) if (t.textContent.trim()) tn.push(t)
    return { t: e.textContent.trim(), size: getComputedStyle(e).fontSize, textNodes: tn.length, inRuns: tn.every((t) => runs.some((r) => r.el === t.parentElement)), sizes: [...new Set(tn.map((t) => getComputedStyle(t.parentElement).fontSize))] }
  })
  const ah = []
  for (const host of document.querySelectorAll('.screen [aria-hidden="true"]')) {
    if (host.closest('svg')) continue
    const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT)
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      const el = t.parentElement
      if (!t.textContent.trim() || el.closest('svg') || !P.visible(el)) continue
      if (parseFloat(getComputedStyle(el).opacity) === 0) continue
      let a = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) a *= parseFloat(getComputedStyle(n).opacity)
      ah.push({ t: t.textContent.trim().slice(0, 30), size: getComputedStyle(el).fontSize, inRuns: inRuns(el), drawnAlpha: Math.round(a * P.parse(getComputedStyle(el).color).a * 1000) / 1000, path: P.path(el) })
    }
  }
  const sr = [...document.querySelectorAll('.screen *')].filter((e) => { const cs = getComputedStyle(e); return cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)' })
  const srIn = runs.filter((r) => sr.some((s) => s === r.el || s.contains(r.el))).map((r) => r.text)
  return { status, labelsPressed: lb?.getAttribute('aria-pressed'), labels, ah, srCount: sr.length, srText: sr.map((e) => e.textContent.trim().slice(0, 30)), srIn }
})
note(`TC14 globe wait=${waited}ms status=${J(t14.status)} LABELS aria-pressed=${t14.labelsPressed}`)
note(`TC14 globe labels n=${t14.labels.length} missing=${t14.labels.filter((l) => !l.inRuns).length} ${J(t14.labels)}`)
note(`TC14 aria-hidden runs n=${t14.ah.length} missing=${t14.ah.filter((l) => !l.inRuns).length} min=${Math.min(...t14.ah.map((a) => parseFloat(a.size)))} ${J(t14.ah)}`)
note(`TC14 sr-only elements n=${t14.srCount} ${J(t14.srText)} inRuns=${J(t14.srIn)}`)
await shot('tc14-opening-globe')

// TC-19 BUG-0009 threat box at 125
note('## TC-19 Brief threat box at 125')
await onScreen('brief')
await setScale(125); await wait(400); await install()
const t19 = await page.evaluate(() => {
  const R = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, txt: e.textContent.trim().slice(0, 30) } }
  const box = { box: R('.mb-threat'), label: R('.mb-threat-main label'), main: R('.mb-threat-main b'), blocks: R('.mb-threat-blocks'), eta: R('.mb-threat-eta') }
  const ix = (a, b) => a && b ? [Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)), Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t))] : null
  const inside = (a, B) => a && B ? a.l >= B.l - 1 && a.r <= B.r + 1 && a.t >= B.t - 1 && a.b <= B.b + 1 : false
  const sub = document.querySelector('.screen-sub, .screen-subtitle, .screen-head small')?.textContent.trim()
  return { box, sub, ix: { mainEta: ix(box.main, box.eta), mainBlocks: ix(box.main, box.blocks), labelEta: ix(box.label, box.eta), labelBlocks: ix(box.label, box.blocks) },
    inside: { label: inside(box.label, box.box), main: inside(box.main, box.box), blocks: inside(box.blocks, box.box), eta: inside(box.eta, box.box) } }
})
note(`TC19 ${J(t19)}`)
const tb = await page.$('.mb-threat')
if (tb) await tb.screenshot({ path: `${OUT}tc19-brief-threat-125.png` })

// TC-21 header items, TC-22 scrolled overflow — four Screens at 125
for (const phase of ['world', 'research', 'brief', 'team']) {
  await onScreen(phase)
  await setScale(125); await wait(400); await install()
  const h = await page.evaluate((phase) => {
    const P = window.__probe
    const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom } }
    const head = document.querySelector('.screen-head')
    const H = head && R(head)
    const items = phase === 'world' ? [...document.querySelectorAll('.wm-resource')] : [...(document.querySelector('.screen-head-right')?.children || [])]
    const others = ['.screen-title', '.screen-sub', '.screen-subtitle', '.navtabs'].flatMap((s) => [...document.querySelectorAll(s)]).filter(P.visible)
    const inside = (a, B) => a.l >= B.l - 1 && a.r <= B.r + 1 && a.t >= B.t - 1 && a.b <= B.b + 1
    const ix = (a, b) => { const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), hh = Math.min(a.b, b.b) - Math.max(a.t, b.t); return w > 2 && hh > 2 }
    return { head: !!head, othersFound: others.map((o) => o.className), items: items.filter(P.visible).map((e) => {
      const r = R(e)
      const parts = [...e.querySelectorAll('small, b')].map(R)
      const desc = [...e.querySelectorAll('*')].filter((d) => d.scrollWidth > d.clientWidth + 1 && d.clientWidth > 0).map((d) => d.tagName)
      return { t: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), sw: e.scrollWidth, cw: e.clientWidth, trunc: e.scrollWidth > e.clientWidth + 1 || desc.length > 0, partsInside: parts.every((p) => inside(p, r)), inHead: H ? inside(r, H) : null, hits: others.filter((o) => ix(r, R(o))).map((o) => o.className) }
    }) }
  }, phase)
  const badH = h.items.filter((i) => i.trunc || !i.partsInside || i.inHead === false || i.hits.length)
  note(`TC21 ${phase}@125 head=${h.head} others=${J(h.othersFound)} items=${h.items.length} bad=${badH.length} ${J(h.items)}`)

  // TC-22
  const conts = await page.evaluate(() => {
    const P = window.__probe
    return [...document.querySelectorAll('.screen *')].filter((e) => P.visible(e) && /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 1)
      .map((e, i) => { e.dataset.tc22 = String(i); return P.path(e) })
  })
  for (let i = 0; i < conts.length; i++) {
    const res = await page.evaluate(async (i) => {
      const e = document.querySelector(`[data-tc22="${i}"]`)
      e.scrollTop = e.scrollHeight
      await new Promise((r) => setTimeout(r, 150))
      const c = e.getBoundingClientRect()
      // last child that renders
      const kids = [...e.children].filter(window.__probe.visible)
      const last = kids[kids.length - 1]
      const lr = last?.getBoundingClientRect()
      // last text node in container
      const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let lt = null
      for (let t = tw.nextNode(); t; t = tw.nextNode()) if (t.textContent.trim() && window.__probe.visible(t.parentElement)) lt = t
      let ltr = null
      if (lt) { const rg = document.createRange(); rg.selectNodeContents(lt); ltr = rg.getBoundingClientRect() }
      const ok = (r) => r && r.bottom <= c.bottom + 1 && r.top >= c.top - 1
      return { lastPath: last && window.__probe.path(last), lastTop: lr && Math.round(lr.top), contTop: Math.round(c.top), st: e.scrollTop, sh: e.scrollHeight, ch: e.clientHeight, lastChildOk: ok(lr), lastText: lt?.textContent.trim().slice(0, 30), lastTextOk: ok(ltr), lastBottom: lr && Math.round(lr.bottom), contBottom: Math.round(c.bottom) }
    }, i)
    note(`TC22 ${phase}@125 [${i}] ${conts[i]} ${J(res)}`)
    const el = await page.$(`[data-tc22="${i}"]`)
    if (el) await el.screenshot({ path: `${OUT}tc22-${phase}-125-scroll${i}.png` })
  }
  const clip = await page.evaluate(() => window.__probe.clipped('.screen'))
  note(`TC22 ${phase}@125 containers=${conts.length} clippedAtScrolledPos=${J(clip)}`)
}

// TC-23 map-area chrome at 125
note('## TC-23 map area at 125')
await enter('opening')
await setScale(125); await wait(400); await install()
const t23 = await page.evaluate(() => {
  const P = window.__probe
  const wrap = document.querySelector('.wm-map-wrap')
  if (!wrap) return { err: 'no .wm-map-wrap' }
  const W = wrap.getBoundingClientRect()
  const bad = []
  let n = 0
  for (const el of wrap.querySelectorAll('*')) {
    if (!P.visible(el) || el.closest('canvas') || el.closest('svg')) continue
    const own = [...el.childNodes].filter((x) => x.nodeType === 3 && x.textContent.trim())
    const cs = getComputedStyle(el)
    const what = P.path(el) + ' "' + el.textContent.trim().slice(0, 30) + '"'
    if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && el.textContent.trim()) { bad.push('truncated ' + what); continue }
    if (!own.length) continue
    n++
    const scrolls = /(auto|scroll)/.test(cs.overflowY + cs.overflowX)
    if (cs.overflow !== 'visible' && !scrolls && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) bad.push('clip ' + what)
    const er = el.getBoundingClientRect()
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p)
      if (/(auto|scroll)/.test(ps.overflowY + ps.overflowX)) break
      if (ps.overflowY !== 'visible' || ps.overflowX !== 'visible') {
        const pr = p.getBoundingClientRect()
        if (er.bottom > pr.bottom + 1 || er.right > pr.right + 1 || er.top < pr.top - 1 || er.left < pr.left - 1) bad.push('cut ' + what + ' by ' + P.path(p))
        break
      }
    }
    if (cs.display !== 'inline') {
      const rg = document.createRange()
      for (const t of own) { rg.selectNodeContents(t); const tr = rg.getBoundingClientRect(); if (tr.width && (tr.left < er.left - 1.5 || tr.right > er.right + 1.5)) { bad.push('spill ' + what); break } }
    }
  }
  const blocks = [...wrap.querySelectorAll('.wm-ov, .globe-toolbar')].filter(P.visible)
  const R = (e) => e.getBoundingClientRect()
  const inter = []
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
    const a = R(blocks[i]), b = R(blocks[j])
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    if (w > 2 && h > 2) inter.push(P.path(blocks[i]) + ' x ' + P.path(blocks[j]) + ' ' + Math.round(w) + 'x' + Math.round(h))
  }
  const outside = blocks.filter((b) => { const r = R(b); return r.left < W.left - 1 || r.right > W.right + 1 || r.top < W.top - 1 || r.bottom > W.bottom + 1 }).map((b) => P.path(b))
  return { textEls: n, bad, blocks: blocks.map((b) => b.className + ' "' + b.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) + '"'), inter, outside }
})
note(`TC23 ${J(t23)}`)
const mw = await page.$('.wm-map-wrap')
if (mw) await mw.screenshot({ path: `${OUT}tc23-map-125.png` })

note(errs.length ? 'ERRORS ' + J(errs) : 'no console or page errors')
writeFileSync(`${OUT}run.log`, log.join('\n') + '\n')
await browser.close()
