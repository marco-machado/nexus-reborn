// IF-027 hand-walk (Sprint 11 Phase 5, HEAD 131a5c1). Headless Chrome for Testing, 1280x720.
// Launch (probe.mjs lines 22-60), HELPERS and fixtures copied verbatim from production/qa/evidence/sprint-011/probe.mjs.
// Run: PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011-head-2026-10-24/if-027/handwalk.mjs
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


/* ------------------------------- IF-027 hand-walk ---------------------------- */
// Cases TC-IF027-03, -04, -05 (production/qa/test-cases/if-027-...-cases.md).
// Helpers and fixtures above are copied verbatim from
// production/qa/evidence/sprint-011/probe.mjs (lines 22-60, HELPERS, fixtures).
// Assists, named: the probe's fixtures; useWorldStore.setState({selected}) to
// pick a sector; influence: 0 only if nothing is disabled (TC-04 step 1).
const dump = {}
const cardGone = async () => {
  // If the orientation card is still up after markSeen, click UNDERSTOOD.
  const btn = page.getByRole('button', { name: /UNDERSTOOD/i })
  if (await btn.count()) { note('card still up: clicking UNDERSTOOD'); await btn.first().click(); await wait(600); await install() }
  note('card present after dismiss: ' + (await page.locator('.wm-onboard').count()))
}
const select = (id) => store(async (id) => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  useWorldStore.setState({ selected: id })
}, id)
const TARGETS = [
  ['sector reading label', (r) => /span\.wm-sector-reading > span$/.test(r.path)],
  ['CONTROL/UNREST label (.wm-cu)', (r) => /div\.wm-cu > div > label$/.test(r.path)],
  ['key-value label (.kv > span)', (r) => /div\.kv[^>]* > span$/.test(r.path)],
  ['TAX PAID NO // NOT NEXUS-HELD value', (r) => /NOT NEXUS-HELD/.test(r.text)],
  ['Influence status word (non ACTIVE/CLEAR)', (r) => /wm-act-status/.test(r.path.split(' > ').pop()) && !/^(ACTIVE|CLEAR)$/.test(r.text)],
  ['EVENT FORECAST label', (r) => r.text === 'EVENT FORECAST'],
  ['forecast gate (.wm-fc-lock)', (r) => /wm-fc-lock/.test(r.path)],
  ['contract TYPE // CITY (.wm-op-main i)', (r) => /span\.wm-op-main > i/.test(r.path) && !/\bred\b/.test(r.path.split(' > ').pop())],
  ['contract chip (.wm-op-meta .chip)', (r) => /wm-op-meta/.test(r.path) && /chip/.test(r.path)],
  ['contracts n / m count', (r) => /^\d+\s*\/\s*\d+$/.test(r.text)],
  ['SECTOR UNDER PASSIVE MONITORING', (r) => /PASSIVE MONITORING/.test(r.text)],
  ['CLOCK SPEED label', (r) => /^CLOCK SPEED/.test(r.text)],
  ['Control key head SECTORS', (r) => r.text === 'SECTORS' && /wm-key-head/.test(r.path)],
  ['Control key name (.wm-key-name)', (r) => /wm-key-name/.test(r.path)],
  ['Scan chrome SAT-16E // LIVE', (r) => /SAT-16E/.test(r.text)],
  ['focus holder name (.wm-ov.tc .dim)', (r) => /div\.wm-ov\.tc > span\.dim$/.test(r.path)],
  ['screen subtitle (.screen-sub)', (r) => /screen-sub/.test(r.path)],
  ['FEED CLEAR', (r) => r.text === 'FEED CLEAR'],
]
let t3bad = 0
const walkTargets = async (label, only) => {
  const runs = await runsIn('.screen')
  dump[label] = runs
  for (const [name, m] of TARGETS) {
    if (only && !only.includes(name)) continue
    const hit = runs.filter(m)
    if (!hit.length) { note(`TC03 ${label} | ${name} | ABSENT`); continue }
    for (const r of hit) {
      const ok = r.color === INK && r.ratio >= 4.5
      if (!ok) t3bad++
      note(`TC03 ${label} | ${name} | ${ok ? 'OK' : 'NOT-INK-OR-LOW'} | "${r.text}" ${r.color} a=${r.alpha} ${r.ratio}:1 ${r.size}px | ${r.path}`)
    }
  }
}

// TC-IF027-03
await enter('opening'); await cardGone()
note('opening selected sector: ' + (await store(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().selected)))
await sector('eu', {})
await wait(400); await install()
const ops = await page.evaluate(() => [...document.querySelectorAll('.wm-op')].map((e) => e.className + ' :: ' + e.textContent.trim().slice(0, 80)))
note('eu contracts: ' + JSON.stringify(ops))
await walkTargets('opening/eu')
// generated offer: find which sector holds it if not eu
const genSector = await store(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const s = useWorldStore.getState()
  return JSON.stringify(Object.keys(s).filter((k) => /gen|offer|contract/i.test(k)).map((k) => [k, JSON.stringify(s[k]).slice(0, 300)]))
})
note('world store contract-like keys: ' + genSector)
await shot('if-027-ink-runs-opening')
// Every other sector, for TAX PAID NO, generated chips and passive monitoring.
const ids = await store(async () => Object.keys((await import('/src/state/worldStore.ts')).useWorldStore.getState().sectors))
note('sectors: ' + ids.join(','))
for (const id of ids.filter((x) => x !== 'eu')) {
  await select(id); await wait(300); await install()
  await walkTargets('opening/' + id, ['key-value label (.kv > span)', 'TAX PAID NO // NOT NEXUS-HELD value', 'contract TYPE // CITY (.wm-op-main i)', 'contract chip (.wm-op-meta .chip)', 'contracts n / m count', 'SECTOR UNDER PASSIVE MONITORING', 'Influence status word (non ACTIVE/CLEAR)', 'focus holder name (.wm-ov.tc .dim)'])
}
await enter('intel2'); await cardGone()
await walkTargets('intel2', ['EVENT FORECAST label', 'forecast gate (.wm-fc-lock)'])
await shot('if-027-ink-runs-intel2')
note(`TC03 targets not Ink or <4.5: ${t3bad}`)

// TC-IF027-04
const actRead = () => page.evaluate(() => [...document.querySelectorAll('.wm-act')].map((b) => {
  const st = b.querySelector('.wm-act-status')
  const chain = []
  for (let n = st; n && !n.classList.contains('screen'); n = n.parentElement) chain.push((n.className || n.tagName) + '=' + getComputedStyle(n).opacity)
  const r = window.__probe.runs('.screen').find((x) => x.el === st)
  return { disabled: b.disabled, aria: b.getAttribute('aria-disabled'), status: st && st.textContent.trim(), color: st && getComputedStyle(st).color, chain: chain.join(' | '), alpha: r ? Math.round(r.alpha * 1000) / 1000 : null, ratio: r ? Math.round(r.ratio * 100) / 100 : null }
}))
let t4bad = 0, t4dis = 0
const t4 = async (label) => {
  for (const a of await actRead()) {
    const scope = !/^(ACTIVE|CLEAR)$/.test(a.status)
    if (a.disabled) t4dis++
    const ok = !scope || (a.color === INK && a.ratio >= 4.5)
    if (!ok) t4bad++
    note(`TC04 ${label} | disabled=${a.disabled} | "${a.status}" ${a.color} a=${a.alpha} ${a.ratio}:1 | ${scope ? (ok ? 'OK' : 'NOT-INK-OR-LOW') : 'out of scope'} | opacity chain: ${a.chain}`)
  }
}
await enter('opening'); await cardGone()
note('TC04 opening influence: ' + (await store(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().influence)))
note('TC04 opening selected: ' + (await store(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().selected)))
let acts = await actRead()
if (!acts.some((a) => a.disabled)) {
  note('TC04 assist: no disabled action at start value; setting influence 0')
  await store(async () => (await import('/src/state/worldStore.ts')).useWorldStore.setState({ influence: 0 }))
  await wait(300); await install()
}
await t4('opening')
await shot('if-027-influence-disabled')
await enter('influence-note'); await cardGone()
await t4('influence-note')
await shot('if-027-influence-note')
note(`TC04 disabled measured: ${t4dis}; out-of-spec status words: ${t4bad}`)

// TC-IF027-05
let t5bad = 0
const t5 = async (label) => {
  const svg = await page.evaluate(() => [...document.querySelectorAll('.screen svg text, .screen svg tspan')].map((n) => n.textContent.trim() + ' fill=' + getComputedStyle(n).fill))
  note(`TC05 ${label} svg text count: ${svg.length} ${JSON.stringify(svg)}`)
  for (const s of svg) if (/rgb\(93, 125, 117\)|#5d7d75/i.test(s)) t5bad++
  const outside = await page.evaluate(() => {
    const out = []
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let t = tw.nextNode(); t; t = tw.nextNode()) {
      const el = t.parentElement
      if (!t.textContent.trim() || !el || el.closest('.screen') || el.closest('script,style')) continue
      if (!window.__probe.visible(el)) continue
      out.push(t.textContent.trim().slice(0, 40) + ' ' + getComputedStyle(el).color + ' ' + window.__probe.path(el))
    }
    return out
  })
  note(`TC05 ${label} visible text outside .screen: ${outside.length} ${JSON.stringify(outside)}`)
  for (const s of outside) if (/rgb\(93, 125, 117\)/.test(s)) t5bad++
  const tips = await page.evaluate(() => [...document.querySelectorAll('.screen .tip')].map((t, i) => { t.dataset.q027 = String(i); const o = t.parentElement.getBoundingClientRect(); return { i, text: t.textContent.trim().slice(0, 60), owner: window.__probe.path(t.parentElement), x: o.x + o.width / 2, y: o.y + o.height / 2, w: o.width, h: o.height } }))
  note(`TC05 ${label} .tip count: ${tips.length}`)
  let shown = 0
  for (const tp of tips.slice(0, 5)) {
    await page.mouse.move(tp.x, tp.y); await wait(500)
    const m = await page.evaluate((i) => {
      const tip = document.querySelector(`[data-q027="${i}"]`)
      const all = []
      for (let n = tip; n; n = n.parentElement) all.push(getComputedStyle(n).opacity)
      const rs = window.__probe.runs('.screen').filter((r) => tip.contains(r.el)).map(({ el, ...r }) => r)
      return { opacityChain: all.slice(0, 3).join(','), runs: rs }
    }, tp.i)
    note(`TC05 ${label} tip ${tp.i} "${tp.text}" owner ${tp.owner} box ${Math.round(tp.w)}x${Math.round(tp.h)} at ${Math.round(tp.x)},${Math.round(tp.y)} opacity ${m.opacityChain} runs ${m.runs.length}`)
    for (const r of m.runs) {
      const ok = r.color !== INK_DIM && r.ratio >= 4.5
      if (!ok) t5bad++
      note(`TC05   "${r.text}" ${r.color} a=${r.alpha} ${r.ratio}:1 ${ok ? 'OK' : 'BAD'}`)
    }
    if (m.runs.length && !shown) { shown = 1; await shot('if-027-tip-hover') }
  }
  await page.mouse.move(5, 715)
}
await enter('opening'); await cardGone()
await t5('opening')
await enter('intel2'); await cardGone()
await t5('intel2')
note(`TC05 bad runs: ${t5bad}`)

writeFileSync(OUT + 'runs-dump.json', JSON.stringify(dump, null, 1))
note(errs.length ? 'ERRORS ' + JSON.stringify(errs) : 'no console or page errors')
writeFileSync(OUT + 'run.log', log.join('\n') + '\n')
await browser.close()
