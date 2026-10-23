// Sprint 11 shared probe: the World Network screen against its approved UX
// spec (design/ux/world-network.md) for IF-016 to IF-035, plus the shared
// header/nav on Research, Brief and Assembly.
//
// Measures, at exactly 1280x720 in headless Chrome for Testing:
//   - every visible text run: computed font-size, colour, effective alpha
//     (ancestor opacity x colour alpha) and the WCAG ratio composited over its
//     ancestors' solid backgrounds on Void #04070a;
//   - every pointer target's box, plus the SC 2.5.8 spacing test;
//   - clip / overlap per panel (each panel's boxes against each other).
// Each check prints PASS / FAIL with the story id. The run writes
// probe-output.txt and the PNGs into OUT.
//
// Harness assists, named: localStorage clear; New Operation through
// save.startNewOperation; state set through the stores' own setState / actions
// (sector Control / Unrest, crisis list, campaign flags, intel, influence,
// events, review pin, text scale, high contrast); Brief reached through
// selectMission, Assembly through goto('team').
//
// Run: preview_start "dev" (port 4200), then
//      PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011/probe.mjs
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

note('# Sprint 11 probe — ' + new Date().toISOString())

// IF-026: type floors in every state.
for (const name of Object.keys(STATES)) {
  await enter(name)
  await shot('state-' + name)
  const runs = await runsIn('.screen')
  const small = runs.filter((r) => r.size < 9.95)
  check('IF-026', `${name}: every text run >= 10 px`, small.length === 0,
    small.length ? small.slice(0, 6).map((r) => `${r.size}px "${r.text}" ${r.path}`).join(' | ') : `min ${Math.min(...runs.map((r) => r.size))}px over ${runs.length} runs`)
  const ro = await page.evaluate((sels) => {
    const out = []
    for (const s of sels) for (const el of document.querySelectorAll(s)) {
      if (!window.__probe.visible(el)) continue
      out.push({ sel: s, size: parseFloat(getComputedStyle(el).fontSize), text: el.textContent.trim().slice(0, 20) })
    }
    return out
  }, readoutSel)
  const lowRo = ro.filter((r) => r.size < 11.95)
  check('IF-026', `${name}: readouts >= 12 px`, lowRo.length === 0,
    lowRo.length ? lowRo.slice(0, 6).map((r) => `${r.sel} ${r.size}px "${r.text}"`).join(' | ') : `${ro.length} readouts, min ${Math.min(...ro.map((r) => r.size))}px`)
  // IF-027 / IF-028: no Ink Dim or Ink Faint text; every run >= 4.5:1.
  const dim = runs.filter((r) => r.color === INK_DIM)
  check('IF-027', `${name}: no text in Ink Dim`, dim.length === 0, dim.slice(0, 5).map((r) => `"${r.text}" ${r.path}`).join(' | '))
  const faint = runs.filter((r) => r.color === INK_FAINT)
  check('IF-028', `${name}: no text in Ink Faint`, faint.length === 0, faint.slice(0, 5).map((r) => `"${r.text}" ${r.path}`).join(' | '))
  const low = runs.filter((r) => r.ratio < 4.5)
  check('IF-027', `${name}: every text run >= 4.5:1 as rendered`, low.length === 0,
    low.length ? low.slice(0, 6).map((r) => `${r.ratio}:1 "${r.text}" ${r.color} a${r.alpha}`).join(' | ') : `min ${Math.min(...runs.map((r) => r.ratio))}:1`)
}

// IF-016: failed banner line; IF-017: failed row reasons.
await enter('failed')
{
  const line = await page.evaluate(() => document.querySelector('.wm-campaign-fail i')?.textContent)
  check('IF-016', 'failed banner line', line === 'ROSTER EMPTY // NO CONTRACT CAN BE TAKEN', JSON.stringify(line))
  for (const sec of ['eu', 'na', 'as']) {
    await sector(sec, {})
    await wait(150)
    const rows = await page.evaluate(() => [...document.querySelectorAll('.wm-op')].map((b) => ({
      reason: b.querySelector('.wm-op-main i')?.textContent, label: b.getAttribute('aria-label'),
    })))
    const bad = rows.filter((r) => r.reason !== 'CAMPAIGN LOST' || !r.label.endsWith('// LOCKED // CAMPAIGN LOST'))
    check('IF-017', `failed: every row in ${sec} reads CAMPAIGN LOST`, rows.length > 0 ? bad.length === 0 : true, rows.length ? JSON.stringify(bad) : 'no rows in sector')
  }
  await page.locator('.wm-op').first().click({ force: true })
  await wait(200)
  const phase = await page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
  check('IF-017', 'failed: clicking a row stays on the World Network', phase === 'world', phase)
  await shot('if-016-017-failed')
}
await enter('opening')
{
  await sector('eu', {})
  await wait(150)
  const rows = await page.evaluate(() => [...document.querySelectorAll('.wm-op.locked .wm-op-main i')].map((i) => i.textContent))
  check('IF-017', 'not failed: intel-locked rows read REQUIRES INTEL LVL n', rows.length > 0 && rows.every((r) => /^REQUIRES INTEL LVL \d$/.test(r)), JSON.stringify(rows))
}
await store(async () => {
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  useCampaignStore.setState({ campaignWon: true, contractsWon: ['m01', 'm02', 'm03'] })
})
await wait(200)
{
  const win = await page.evaluate(() => ({
    b: document.querySelector('.wm-campaign-win b')?.textContent,
    i: document.querySelector('.wm-campaign-win i')?.textContent,
    n: document.querySelector('.wm-campaign-win strong')?.textContent,
  }))
  check('IF-016', 'complete banner unchanged', win.b === 'CAMPAIGN COMPLETE' && win.i === 'ALL THREE AUTHORED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE' && win.n === '3 / 3', JSON.stringify(win))
  await shot('if-016-complete')
}

// IF-018: the card is not aria-modal; focus; Tab / Shift+Tab; Esc.
await enter('opening-card')
{
  const modal = await page.evaluate(() => document.querySelector('.wm-onboard-wrap')?.getAttribute('aria-modal'))
  check('IF-018', 'card has no aria-modal="true"', modal !== 'true', String(modal))
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim())
  check('IF-018', 'UNDERSTOOD has initial focus', first === 'UNDERSTOOD', String(first))
  await page.keyboard.press('Tab')
  const inNav = await page.evaluate(() => !!document.activeElement?.closest('.navtabs'))
  check('IF-018', 'Tab from UNDERSTOOD reaches the nav', inNav)
  await page.keyboard.press('Shift+Tab')
  const back = await page.evaluate(() => document.activeElement?.textContent?.trim())
  check('IF-018', 'Shift+Tab returns to UNDERSTOOD', back === 'UNDERSTOOD', String(back))
  await page.keyboard.press('Escape')
  await wait(200)
  const still = await page.evaluate(() => !!document.querySelector('.wm-onboard-wrap'))
  check('IF-018', 'Esc leaves the card in place', still)
  await page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.setState({ overlay: null })
  }).catch(() => {})
}

// IF-019 in the browser: each of the five transport buttons, clicked under
// the card, applies its clock action and dismisses the card (the wiring in
// TimeControl, which the unit tests cannot reach). AC-2: a Feed row click
// under the card focuses its sector and leaves the card up.
for (const [label, want] of [['PAUSE', { paused: true }], ['1X', { speed: 1, paused: false }], ['2X', { speed: 2, paused: false }], ['4X', { speed: 4, paused: false }], ['8X', { speed: 8, paused: false }]]) {
  await enter('opening-card')
  await store(async (label) => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    // Start from a state the click must change.
    useWorldStore.setState(label === 'PAUSE' ? { paused: false, speed: 2 } : { paused: true, speed: label === '1X' ? 2 : 1 })
  }, label)
  await wait(150)
  const btn = label === 'PAUSE' ? page.locator('.wm-tbtn').first() : page.locator('.wm-tbtn', { hasText: label })
  await btn.click({ timeout: 3000 })
  await wait(200)
  const st = await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const { paused, speed } = useWorldStore.getState()
    return { paused, speed, card: !!document.querySelector('.wm-onboard-wrap') }
  })
  const ok = Object.entries(want).every(([k, v]) => st[k] === v) && !st.card
  check('IF-019', `${label} under the card applies and dismisses it`, ok, JSON.stringify(st))
}
await enter('opening-card')
{
  const before = await page.evaluate(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().selected)
  await page.locator('.wm-feed-line').nth(1).click({ timeout: 3000 })
  await wait(200)
  const st = await page.evaluate(async () => ({
    selected: (await import('/src/state/worldStore.ts')).useWorldStore.getState().selected,
    card: !!document.querySelector('.wm-onboard-wrap'),
  }))
  check('IF-019', 'a Feed row click under the card focuses its sector and leaves the card up', st.card && st.selected !== undefined, `${before} -> ${st.selected}, card ${st.card}`)
}

// IF-020: Garrison tones.
for (const [state, want, label] of [['garrison-secure', TEAL, 'SECURE'], ['garrison-strained', PRINT_WHITE, 'STRAINED'], ['garrison-critical', RED_HOT, 'CRITICAL']]) {
  await enter(state)
  const g = await page.evaluate(() => {
    const kv = [...document.querySelectorAll('.wm-right .kv')].find((k) => k.querySelector('span')?.textContent === 'GARRISON CONDITION')
    const b = kv?.querySelector('b')
    return b ? { text: b.textContent, color: getComputedStyle(b).color, amber: b.classList.contains('amber') } : null
  })
  check('IF-020', `${label} prints ${want}`, g && g.text === label && g.color === want && !g.amber, JSON.stringify(g))
}
{
  await enter('garrison-strained')
  const credits = await colorOf('.wm-resource b.amber')
  check('IF-020', 'Credits stay Ledger Amber', credits === AMBER, String(credits))
  await page.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)' })
  await shot('if-020-grayscale-strained')
  await page.evaluate(() => { document.documentElement.style.filter = '' })
}

// IF-021: Unrest ink and bar by state, row and Focus panel.
for (const [state, patch, want, bar] of [
  ['opening', { unrest: 50 }, INK, ''],
  ['opening', { unrest: 60 }, INK, ''],
  ['pressure', { unrest: 61 }, PRINT_WHITE, 'notice'],
  ['crisis', { unrest: 80 }, RED_HOT, 'red'],
  ['crisis', { unrest: 40 }, RED_HOT, 'red'],
]) {
  await enter(state)
  await sector('eu', patch, state === 'crisis')
  await wait(150)
  const u = await page.evaluate(() => {
    const row = [...document.querySelectorAll('.wm-sector.sel .wm-sector-reading')].find((r) => r.querySelector('span')?.textContent === 'UNREST')?.querySelector('b')
    const panel = document.querySelectorAll('.wm-cu > div')[1]
    const pb = panel?.querySelector('b')
    const seg = panel?.querySelector('.segbar')
    const chip = document.querySelector('.wm-sector.sel .wm-sector-warning')?.textContent
    const panelChip = panel?.textContent.includes('UNREST PRESSURE')
    return { row: row && getComputedStyle(row).color, panel: pb && getComputedStyle(pb).color, seg: seg?.className, chip, panelChip }
  })
  const rRow = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.wm-sector.sel .wm-sector-reading')].find((r) => r.querySelector('span')?.textContent === 'UNREST')?.querySelector('b')
    return window.__probe.runs('.wm-left').find((x) => x.el === b)?.ratio
  })
  const rPanel = await page.evaluate(() => {
    const pb = document.querySelectorAll('.wm-cu > div')[1]?.querySelector('b')
    return window.__probe.runs('.wm-cu').find((x) => x.el === pb)?.ratio
  })
  const barOk = bar === '' ? !/ (red|notice|amber|green)( |$)/.test(u.seg) : u.seg.includes(bar)
  check('IF-021', `${state} unrest ${patch.unrest}: row and panel ink`, u.row === want && u.panel === want && barOk && rRow >= 4.5 && rPanel >= 4.5,
    `${JSON.stringify(u)} row ${rRow}:1 panel ${rPanel}:1`)
  if (state === 'pressure') check('IF-021', 'pressure chip on the row only', u.chip?.includes('UNREST PRESSURE') && !u.panelChip, JSON.stringify(u))
  await shot(`if-021-${state}-${patch.unrest}`)
}

// IF-022: empty Feed token.
await enter('opening')
{
  await store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ events: [], unread: 0 })
  })
  await wait(200)
  const body = await page.evaluate(() => document.querySelector('.wm-feed-body')?.textContent.trim())
  check('IF-022', 'empty Feed prints -- CHANNEL OPEN --', body === '-- CHANNEL OPEN --', JSON.stringify(body))
  const head = await page.evaluate(() => document.querySelector('.wm-feed')?.textContent.includes('FEED CLEAR'))
  check('IF-022', 'empty Feed header shows FEED CLEAR', head)
  await shot('if-022-empty')
  await setScale(125)
  await wait(200)
  await install()
  const clip = await page.evaluate(() => window.__probe.clipped('.wm-feed'))
  check('IF-022', 'empty token not clipped at 125', clip.length === 0, clip.join(' | '))
  await shot('if-022-empty-125')
  await setScale(100)
  await enter('opening')
  const withEv = await page.evaluate(() => document.querySelector('.wm-feed-body')?.textContent.includes('CHANNEL OPEN'))
  check('IF-022', 'token absent with events', !withEv)
}

// IF-023 / IF-024: left column and INTEL panel at four scales; layout clip on
// the World Network at each scale (TR-interface-002).
await enter('opening')
for (const scale of SCALES) {
  await setScale(scale)
  await wait(250)
  await install()
  const left = await page.evaluate(() => [...document.querySelectorAll('.wm-left .panel-title')].map((t) => t.textContent.trim()))
  const leftPanels = await page.evaluate(() => document.querySelectorAll('.wm-left > *').length)
  const hdr = await page.evaluate(() => [...document.querySelectorAll('.wm-resource')].map((r) => r.textContent.trim()))
  check('IF-023', `scale ${scale}: left column holds SECTORS only; header prints Influence`, leftPanels === 1 && left.join(' ').includes('SECTORS') && !left.join(' ').includes('INFLUENCE') && hdr.some((h) => h.startsWith('INFLUENCE')), `${leftPanels} panel(s) ${JSON.stringify(left)} header ${JSON.stringify(hdr)}`)
  const pool = await page.evaluate(() => document.querySelector('.wm-intel-panel')?.innerText.replace(/\s+/g, ' ').trim())
  check('IF-024', `scale ${scale}: INTEL panel`, /^INTEL LEVEL 1 PROGRESS \d+ \/ 100$/.test(pool) && !/CREDITS|INFLUENCE|ROSTER/.test(pool), JSON.stringify(pool))
  const clip = await page.evaluate(() => window.__probe.clipped('.screen'))
  check('IF-026', `world network scale ${scale}: nothing clips`, clip.length === 0, clip.slice(0, 5).join(' | '))
  await shot(`if-023-024-world-${scale}`)
}
await setScale(100)
// IF-023 AC-2: header Influence after a spend, same frame as the status word.
await enter('opening')
{
  await store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ influence: 8, selected: 'na' })
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    useTutorialStore.getState().markSeen('hint-influence')
  })
  await wait(200)
  const before = await page.evaluate(() => [...document.querySelectorAll('.wm-resource')].find((r) => r.textContent.includes('INFLUENCE'))?.textContent)
  const after = await page.evaluate(async () => {
    const btn = [...document.querySelectorAll('.wm-act')].find((b) => !b.disabled)
    btn.click()
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    return {
      header: [...document.querySelectorAll('.wm-resource')].find((r) => r.textContent.includes('INFLUENCE'))?.textContent,
      status: btn.querySelector('.wm-act-status')?.textContent,
    }
  })
  check('IF-023', 'header Influence debits in the frame the action turns ACTIVE', before !== after.header && after.status === 'ACTIVE', `${before} -> ${after.header}, status ${after.status}`)
}

// IF-024 AC-2: level-up wraps progress; matches the header Intel.
await enter('opening')
{
  await store(async () => {
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const c = useCampaignStore.getState()
    useCampaignStore.setState({ intelProgress: 90 })
    c.awardIntel?.(25)
  })
  await wait(200)
  const v = await page.evaluate(() => ({
    pool: document.querySelector('.wm-intel-panel')?.innerText.replace(/\s+/g, ' ').trim(),
    hdr: [...document.querySelectorAll('.wm-resource')].find((r) => r.textContent.includes('INTEL'))?.textContent,
  }))
  const m = v.pool?.match(/LEVEL (\d+) PROGRESS (\d+) \/ 100/)
  check('IF-024', 'level and progress agree with the header', m && v.hdr?.includes(m[1]) && Number(m[2]) < 100, JSON.stringify(v))
}

// IF-025: effect line under each action, five action states x four scales.
for (const scale of SCALES) {
  await enter('opening')
  await setScale(scale)
  await wait(250)
  await install()
  const eff = await page.evaluate(() => [...document.querySelectorAll('.wm-act-wrap')].map((w) => {
    const btn = w.querySelector('.wm-act')
    const e = w.querySelector('.wm-act-effect')
    const st = w.querySelector('.wm-act-status')
    const b = btn?.getBoundingClientRect(), r = e?.getBoundingClientRect(), s = st?.getBoundingClientRect()
    const overlap = r && s && !(r.bottom <= s.top || s.bottom <= r.top || r.right <= s.left || s.right <= r.left)
    return { text: e?.textContent, below: r && b ? r.top >= b.bottom - 0.5 : false, visible: e ? window.__probe.visible(e) : false, overlap, disabled: btn?.disabled }
  }))
  check('IF-025', `scale ${scale}: each action prints its effect below the button`, eff.length === 3 && eff.every((e) => e.text && e.below && e.visible && !e.overlap), JSON.stringify(eff))
  const clip = await page.evaluate(() => window.__probe.clipped('.wm-right'))
  check('IF-025', `scale ${scale}: right column does not clip`, clip.length === 0, clip.slice(0, 4).join(' | '))
  await shot(`if-025-actions-${scale}`)
}

// IF-029: locked rows: effective opacity 1, >= 4.5:1, Red Hot reason, frame
// dimmed vs an open row, default and high contrast.
for (const hc of [false, true]) {
  await enter('opening')
  await sector('eu', {})
  await setHC(hc)
  await wait(250)
  await install()
  const lr = await page.evaluate(() => {
    const locked = [...document.querySelectorAll('.wm-op.locked')]
    const runs = window.__probe.runs('.wm-ops-list').filter((r) => locked.some((l) => l.contains(r.el)))
    const reason = locked[0]?.querySelector('.wm-op-main i')
    const open = document.querySelector('.wm-op:not(.locked)')
    const fr = (el) => el && { border: getComputedStyle(el).borderColor, bg: getComputedStyle(el).backgroundColor, op: getComputedStyle(el).opacity }
    return {
      n: locked.length,
      minAlpha: Math.min(...runs.map((r) => r.alpha)),
      minRatio: Math.min(...runs.map((r) => r.ratio)),
      low: runs.filter((r) => r.ratio < 4.5).map((r) => `${r.ratio} "${r.text}"`),
      reason: reason && getComputedStyle(reason).color,
      redDim: !!locked[0]?.querySelector('.red-dim'),
      lockedFrame: fr(locked[0]),
      openFrame: fr(open),
      glyph: !!locked[0]?.querySelector('.wm-op-glyph svg'),
      disabled: locked.every((l) => l.getAttribute('aria-disabled') === 'true'),
      openDisabled: open?.getAttribute('aria-disabled'),
    }
  })
  const frameDiffers = JSON.stringify([lr.lockedFrame.border, lr.lockedFrame.bg]) !== JSON.stringify([lr.openFrame.border, lr.openFrame.bg])
  check('IF-029', `${hc ? 'high contrast' : 'default'}: locked-row text opacity 1 and >= 4.5:1`, lr.n > 0 && lr.minAlpha === 1 && lr.minRatio >= 4.5, `n ${lr.n} alpha ${lr.minAlpha} ratio ${lr.minRatio} ${lr.low.join(' | ')}`)
  check('IF-029', `${hc ? 'high contrast' : 'default'}: reason in Red Hot, frame dimmed, glyph and aria-disabled`, lr.reason === RED_HOT && !lr.redDim && frameDiffers && lr.lockedFrame.op === '1' && lr.glyph && lr.disabled && lr.openDisabled === null, JSON.stringify(lr))
  if (!hc) {
    await page.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)' })
    await shot('if-029-grayscale-locked-vs-open')
    await page.evaluate(() => { document.documentElement.style.filter = '' })
  }
  await shot(`if-029-locked-${hc ? 'hc' : 'default'}`)
}
await setHC(false)

// IF-030: idle nav labels on four Screens x two modes; HC remap; aria-current.
// IF-026 AC-2: 125% on four Screens; nav labels not truncated.
const SCREENS = [['world', 'World Network'], ['research', 'Research'], ['brief', 'Brief'], ['team', 'Assembly']]
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
for (const [phase, label] of SCREENS) {
  const colors = {}
  for (const hc of [false, true]) {
    await onScreen(phase)
    await setHC(hc)
    await wait(200)
    await install()
    const nav = await page.evaluate(() => {
      const runs = window.__probe.runs('.navtabs')
      return [...document.querySelectorAll('.navtab')].map((t) => {
        const lab = t.querySelector('.navtab-label')
        const r = runs.find((x) => x.el === lab)
        return { label: lab?.textContent, active: t.classList.contains('active'), current: t.getAttribute('aria-current'), color: lab && getComputedStyle(lab).color, ratio: r?.ratio, trunc: lab ? lab.scrollWidth > lab.clientWidth + 1 : null }
      })
    })
    colors[hc] = nav.filter((n) => !n.active).map((n) => n.color)
    const idle = nav.filter((n) => !n.active)
    check('IF-030', `${label} ${hc ? 'high contrast' : 'default'}: idle labels >= 4.5:1`, idle.length > 0 && idle.every((n) => n.ratio >= 4.5), JSON.stringify(idle))
    const cur = nav.filter((n) => n.current === 'page')
    check('IF-030', `${label} ${hc ? 'high contrast' : 'default'}: one tab aria-current="page"`, cur.length === 1 && cur[0].active, JSON.stringify(cur))
    if (hc) await shot(`if-030-nav-${phase}-hc`)
  }
  check('IF-030', `${label}: idle labels take the high-contrast remap`, JSON.stringify(colors[false]) !== JSON.stringify(colors[true]), JSON.stringify(colors))
  await setHC(false)
  await setScale(125)
  await wait(300)
  await install()
  const clip = await page.evaluate(() => window.__probe.clipped('.screen'))
  const trunc = await page.evaluate(() => [...document.querySelectorAll('.navtab-label')].filter((l) => l.scrollWidth > l.clientWidth + 1).map((l) => l.textContent))
  check('IF-026', `${label} at 125: nothing clips; nav labels not truncated`, clip.length === 0 && trunc.length === 0, [...clip.slice(0, 4), ...trunc].join(' | '))
  await shot(`if-026-${phase}-125`)
  await setScale(100)
}

// IF-031 to IF-035: hit targets at 100%.
await enter('opening')
{
  // Seed 14 Feed events so the rows exist.
  await store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const s = useWorldStore.getState()
    const base = s.events[0]
    const events = Array.from({ length: 14 }, (_, i) => ({ ...base, id: 9000 + i, t: i * 60 }))
    useWorldStore.setState({ events, unread: 3 })
  })
  await wait(250)
  await install()
  const feed = await boxes('.wm-feed-line')
  check('IF-031', 'every Feed row >= 24 px high', feed.length > 0 && feed.every((b) => b.h >= 24), `${feed.length} rows, min h ${Math.min(...feed.map((b) => b.h))}`)
  const overlapRows = feed.some((b, i) => i > 0 && b.y < feed[i - 1].y + feed[i - 1].h - 0.5)
  check('IF-031', 'Feed rows do not overlap', !overlapRows)
  // The drawn track may stay 12 px; the hit area is what the pointer reaches,
  // measured by hit-testing a column through the track's centre.
  const band = await page.evaluate(() => {
    const el = document.querySelector('.wm-tl-track')
    const r = el.getBoundingClientRect()
    const x = r.left + r.width / 2
    let top = null, bottom = null
    for (let y = Math.floor(r.top) - 20; y <= Math.ceil(r.bottom) + 20; y++) {
      if (document.elementFromPoint(x, y)?.closest('.wm-tl-track') === el) {
        if (top === null) top = y
        bottom = y
      }
    }
    return { drawn: r.height, hit: top === null ? 0 : bottom - top + 1 }
  })
  check('IF-032', 'Timeline slider pointer hit area >= 24 px high', band.hit >= 24, JSON.stringify(band))
  const tlProbe = await page.evaluate(() => {
    const el = document.querySelector('.wm-tl-track')
    const r = el.getBoundingClientRect()
    const cy = r.top + r.height / 2
    const hit = (dy) => document.elementFromPoint(r.left + r.width / 2, cy + dy)?.closest('.wm-tl-track') === el
    const tb = [...document.querySelectorAll('.wm-tbtn')].map((b) => {
      const q = b.getBoundingClientRect()
      return document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2)?.closest('.wm-tbtn') === b
    })
    return { up: hit(-11), down: hit(11), transport: tb.every(Boolean) }
  })
  check('IF-032', 'pointer hits the slider at +-11 px; transport centres hit their buttons', tlProbe.up && tlProbe.down && tlProbe.transport, JSON.stringify(tlProbe))
  const speeds = await page.evaluate(() => [...document.querySelectorAll('.wm-tbtn')].filter((b) => /X$/.test(b.textContent.trim())).map((b) => ({ t: b.textContent.trim(), ...window.__probe.box(b) })))
  check('IF-033', '1X-8X each >= 24x24', speeds.length === 4 && speeds.every((b) => b.w >= 24 && b.h >= 24), JSON.stringify(speeds))
  const steppers = await boxes('.wm-inset-chev')
  check('IF-034', 'inset steppers each >= 24x24', steppers.length === 2 && steppers.every((b) => b.w >= 24 && b.h >= 24), JSON.stringify(steppers))
  // IF-035: the remaining targets.
  const rest = await page.evaluate(() => {
    const q = (sel) => [...document.querySelectorAll(sel)].filter(window.__probe.visible).map((el) => ({ sel, t: (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 24), ...window.__probe.box(el) }))
    return [
      ...q('.wm-tbtn:first-child'),
      ...q('.wm-unread'),
      ...q('.globe-toolbar button'),
      ...q('.globe-credit'),
      ...q('.navtab'),
    ]
  })
  const under = rest.filter((b) => b.w < 24 || b.h < 24)
  check('IF-035', 'pause, unread, view controls, credit link, nav tabs >= 24x24', rest.length >= 9 && under.length === 0, under.length ? JSON.stringify(under) : `${rest.length} targets`)
  await shot('if-031-035-targets')
}
// Review at four scales: the fixed bottom strip must hold TIME CODE's
// REVIEW line and > GO LIVE (UI review finding, 2026-10-23).
for (const scale of SCALES) {
  await enter('review')
  await setScale(scale)
  await wait(250)
  await install()
  const clip = await page.evaluate(() => window.__probe.clipped('.screen'))
  check('IF-026', `review at ${scale}: nothing clips`, clip.length === 0, clip.slice(0, 4).join(' | '))
  await shot(`if-026-review-${scale}`)
}
await setScale(100)
// IF-035: GO LIVE and both UNDERSTOOD buttons.
await enter('review')
{
  const gl = await boxes('.wm-live.review')
  check('IF-035', '> GO LIVE button >= 24x24', gl.length === 1 && gl[0].w >= 24 && gl[0].h >= 24, JSON.stringify(gl))
}
await enter('opening-card')
{
  const u = await boxes('.wm-onboard .hud-btn')
  check('IF-035', 'card UNDERSTOOD >= 24x24', u.length === 1 && u[0].w >= 24 && u[0].h >= 24, JSON.stringify(u))
}
await enter('influence-note')
{
  const u = await boxes('.wm-moment-btn')
  check('IF-035', 'Influence note UNDERSTOOD >= 24x24', u.length === 1 && u[0].w >= 24 && u[0].h >= 24, JSON.stringify(u))
  const st = await boxes('.wm-inset-chev')
  check('IF-034', 'steppers absent while the Influence note is up', st.length === 0, JSON.stringify(st))
  await shot('if-035-influence-note')
}

note(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no console or page errors')
note(fails ? `FAILED ${fails}` : 'ALL PASS')
writeFileSync(OUT + 'probe-output.txt', log.join('\n') + '\n')
await browser.close()
process.exit(fails ? 1 : 0)
