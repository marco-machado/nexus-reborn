// IF-023 hand-walks (Sprint 11 Phase 5, HEAD 131a5c1). Headless Chrome for Testing, 1280x720.
// Lines 22-60, HELPERS and fixtures/STATES copied verbatim from production/qa/evidence/sprint-011/probe.mjs.
// Run: PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011-head-2026-10-24/if-023/handwalk.mjs
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

/* ------------------------------- IF-023 walks -------------------------------- */
// Everything below is new for IF-023 (not in probe.mjs).
const J = (o) => JSON.stringify(o)
const hdrInf = () => page.evaluate(() => [...document.querySelectorAll('.wm-resource')].find((r) => r.textContent.includes('INFLUENCE'))?.textContent ?? null)
const leftState = () => page.evaluate(() => ({
  titles: [...document.querySelectorAll('.wm-left .panel-title')].map((t) => t.textContent.trim()),
  children: document.querySelectorAll('.wm-left > *').length,
  header: [...document.querySelectorAll('.wm-resource')].map((r) => r.textContent.trim()),
  clip: window.__probe.clipped('.screen'),
}))
const balanceRuns = (num) => page.evaluate((num) => {
  const re = new RegExp('\\bINFLUENCE\\b|\\b' + num + '\\s*PTS\\b')
  return window.__probe.runs('body').filter((r) => re.test(r.text)).map((r) => ({ text: r.text, path: r.path, inHeader: !!r.el.closest('.wm-resource'), inLeft: !!r.el.closest('.wm-left') }))
}, num)
note('# IF-023 hand-walks — ' + new Date().toISOString())
note('viewport ' + J(page.viewportSize()))
if (!process.env.ONLY_TC10) {

// TC-05: SECTORS fills the column; list scrolls to Antarctica.
await enter('opening')
{
  let ok = true
  for (const scale of SCALES) {
    await setScale(scale); await wait(250); await install()
    const r = await page.evaluate(async () => {
      const left = document.querySelector('aside.wm-left').getBoundingClientRect()
      const sec = document.querySelector('.wm-sectors').getBoundingClientRect()
      const list = document.querySelector('.wm-sector-list')
      const lr = list.getBoundingClientRect()
      const inside = () => [...list.querySelectorAll('.wm-sector')].filter((b) => { const x = b.getBoundingClientRect(); return x.top >= lr.top - 0.5 && x.bottom <= lr.bottom + 0.5 }).length
      const visibleRows = inside()
      const total = list.querySelectorAll('.wm-sector').length
      const ch = list.clientHeight, sh = list.scrollHeight
      list.scrollTop = list.scrollHeight
      await new Promise((r) => requestAnimationFrame(r))
      const lr2 = list.getBoundingClientRect()
      const ant = [...list.querySelectorAll('.wm-sector')].find((b) => b.getAttribute('aria-label') === 'ANTARCTICA // NO SURVEY DATA')
      const a = ant?.getBoundingClientRect()
      return { leftBottom: left.bottom, sectorsBottom: sec.bottom, gap: Math.round((left.bottom - sec.bottom) * 10) / 10, clientHeight: ch, scrollHeight: sh, scrollTop: list.scrollTop, visibleRows, total, ant: a ? { top: a.top, bottom: a.bottom } : null, list: { top: lr2.top, bottom: lr2.bottom }, antInside: a ? a.top >= lr2.top - 0.5 && a.bottom <= lr2.bottom + 0.5 : false }
    })
    const pass = r.gap <= 2 && r.antInside
    if (!pass) ok = false
    check('IF-023 TC-05', `scale ${scale}: SECTORS gap <= 2 px and Antarctica fully visible after scroll`, pass, J(r))
    await shot(`if-023-sectors-scrolled-${scale}`)
  }
  await setScale(100)
}

// TC-06: first-visit card up, four scales.
await enter('opening-card')
for (const scale of SCALES) {
  await setScale(scale); await wait(250); await install()
  const s = await leftState()
  const card = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('UNDERSTOOD') && window.__probe.visible(b)))
  const pass = s.children === 1 && J(s.titles) === '["SECTORS"]' && s.header.some((h) => h.startsWith('INFLUENCE') && h.endsWith('PTS')) && s.clip.length === 0 && card
  check('IF-023 TC-06', `card up, scale ${scale}: SECTORS only, header Influence, no clip, card visible`, pass, J({ ...s, card }))
  await shot(`if-023-card-${scale}`)
}
await setScale(100)

// TC-07: banners at 125.
await enter('failed')
await setScale(125); await wait(250); await install()
{
  const banner = await page.evaluate(() => document.querySelector('.screen').innerText.includes('ROSTER EMPTY // NO CONTRACT CAN BE TAKEN'))
  const s = await leftState()
  const pass = banner && s.children === 1 && J(s.titles) === '["SECTORS"]' && s.header.some((h) => /^INFLUENCE.*PTS$/.test(h)) && s.clip.length === 0
  check('IF-023 TC-07', 'failed banner at 125: SECTORS only, header Influence, no clip', pass, J({ banner, ...s }))
  await shot('if-023-banner-failed-125')
}
await setScale(100)
await enter('opening')
await store(async () => {
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  useCampaignStore.setState({ campaignWon: true, contractsWon: ['m01', 'm02', 'm03'] })
})
await setScale(125); await wait(250); await install()
{
  const win = await page.evaluate(() => document.querySelector('.wm-campaign-win b')?.textContent ?? null)
  const s = await leftState()
  const pass = win === 'CAMPAIGN COMPLETE' && s.children === 1 && J(s.titles) === '["SECTORS"]' && s.header.some((h) => /^INFLUENCE.*PTS$/.test(h)) && s.clip.length === 0
  check('IF-023 TC-07', 'complete banner at 125: SECTORS only, header Influence, no clip', pass, J({ win, ...s }))
  await shot('if-023-banner-complete-125')
}
await setScale(100)

// TC-09: named STABILIZE spend from 10.
await enter('opening')
await store(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  useWorldStore.setState({ influence: 10, selected: 'na' })
  const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
  useTutorialStore.getState().markSeen('hint-influence')
})
await wait(200); await install()
{
  const before = await hdrInf()
  const statusBefore = await page.evaluate(() => [...document.querySelectorAll('.wm-act')].find((b) => b.querySelector('.wm-act-name')?.textContent.includes('STABILIZE'))?.querySelector('.wm-act-status')?.textContent ?? null)
  const after = await page.evaluate(async () => {
    const btn = [...document.querySelectorAll('.wm-act')].find((b) => b.querySelector('.wm-act-name')?.textContent.includes('STABILIZE'))
    btn.click()
    await new Promise((r) => requestAnimationFrame(r))
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    return {
      header: [...document.querySelectorAll('.wm-resource')].find((r) => r.textContent.includes('INFLUENCE'))?.textContent,
      status: btn.querySelector('.wm-act-status')?.textContent,
      store: useWorldStore.getState().influence,
    }
  })
  await shot('if-023-spend-active')
  await install()
  const runs = await balanceRuns(2)
  const others = runs.filter((r) => !r.inHeader)
  note('TC-09 runs matching INFLUENCE|2 PTS: ' + J(runs))
  const pass = before === 'INFLUENCE10 PTS' && statusBefore === 'CLEAR' && after.header === 'INFLUENCE2 PTS' && after.status === 'ACTIVE' && after.store === 2 && !runs.some((r) => r.inLeft)
  check('IF-023 TC-09', 'STABILIZE from 10: header 2 PTS, ACTIVE, store 2 in one frame; no left-column match', pass, J({ before, statusBefore, after, nonHeaderMatches: others }))
}

// TC-11: seeded clean-win Debrief, first frame of the return.
await fresh(); await dismissCard()
{
  await store(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const k = useAppStore.getState().lastAppliedKey
    useAppStore.setState({ missionId: 'm03', phase: 'debrief', outcome: { applyKey: k + 1, won: true, civiliansHit: 0, quietReplay: false, kills: 0, casualties: 0, timeSec: 600, reward: 0, bonus: 0, collateral: 0, netPayout: 0, deadIds: [], survivorHp: {} } })
  })
  await wait(500); await install()
  const deb = await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const chips = window.__probe.runs('body').filter((r) => /^INFLUENCE/.test(r.text)).map((r) => (r.el.parentElement?.textContent ?? r.text).replace(/\s+/g, ' ').trim())
    return { chips, store: useWorldStore.getState().influence, text: document.body.innerText.split('\n').filter((l) => /INFLUENCE/.test(l)) }
  })
  await shot('if-023-seeded-debrief')
  const ret = await page.evaluate(async () => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'RETURN TO WORLD NETWORK')
    if (!btn) return { error: 'no RETURN TO WORLD NETWORK button' }
    btn.click()
    await new Promise((r) => requestAnimationFrame(r))
    const { useAppStore } = await import('/src/state/appStore.ts')
    return {
      phase: useAppStore.getState().phase,
      header: [...document.querySelectorAll('.wm-resource')].find((r) => r.textContent.includes('INFLUENCE'))?.textContent ?? null,
      left: document.querySelectorAll('.wm-left > *').length,
    }
  })
  await shot('if-023-seeded-return-first-frame')
  await install()
  const runs = await balanceRuns(8)
  note('TC-11 runs matching INFLUENCE|8 PTS: ' + J(runs))
  const pass = deb.store === 8 && ret.phase === 'world' && ret.header === 'INFLUENCE8 PTS' && ret.left === 1 && !runs.some((r) => !r.inHeader && /\b8\s*PTS\b/.test(r.text))
  check('IF-023 TC-11', 'seeded: first frame after RETURN reads INFLUENCE8 PTS, phase world, 1 left child', pass, J({ deb, ret }))
}

} // end static walks

// TC-10: played clean win on Rust Haven from a Menu New Operation. Navigation
// by real mouse clicks; in the mission, orders through the sim's own order
// calls and the game's Pause (docs/mission-playbook.md). No store field is
// written in this section.
const clickEl = async (sel, text) => {
  const h = await page.evaluateHandle(({ sel, text }) => [...document.querySelectorAll(sel)].find((e) => (!text || (e.getAttribute('aria-label') || '').includes(text) || e.textContent.includes(text)) && e.getBoundingClientRect().width > 0) ?? null, { sel, text })
  const el = h.asElement()
  if (!el) throw new Error('no element ' + sel + ' ' + (text || ''))
  const b = await el.boundingBox()
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
}
const phase = () => page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
async function playRustHaven(attempt) {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload(); await wait(1500)
  await clickEl('button', 'NEW OPERATION'); await wait(400)
  if ((await phase()) === 'menu') { await clickEl('button', 'NEW OPERATION'); await wait(400) }
  await wait(1000); await install()
  note(`TC-10 a${attempt} phase after NEW OPERATION: ${await phase()}`)
  const card = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'UNDERSTOOD'))
  if (card) { await clickEl('button', 'UNDERSTOOD'); await wait(300) }
  const start = await hdrInf()
  await shot(`if-023-played-a${attempt}-world-start`)
  await clickEl('.wm-sector', 'NORTH AMERICA'); await wait(400)
  await clickEl('.wm-op', 'RUST HAVEN'); await wait(700)
  note(`TC-10 a${attempt} after RUST HAVEN row: ${await phase()}`)
  if ((await phase()) === 'world') { await clickEl('button', 'BRIEF'); await wait(600) }
  await clickEl('button', 'ACCEPT CONTRACT'); await wait(800)
  note(`TC-10 a${attempt} after ACCEPT: ${await phase()}`)
  await clickEl('button', 'DEPLOY TEAM'); await wait(800)
  note(`TC-10 a${attempt} after DEPLOY: ${await phase()}`)
  // wait for the sim
  for (let i = 0; i < 60; i++) {
    const ready = await page.evaluate(async () => !!(await import('/src/game/runtime.ts')).getWorld())
    if (ready) break
    await wait(500)
  }
  await page.evaluate(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().setPaused(true))
  const board = await page.evaluate(async () => {
    const w = (await import('/src/game/runtime.ts')).getWorld()
    return { lm: w.city.landmarks, ext: w.city.extraction, units: w.units.filter((u) => u.kind !== 'civilian').map((u) => [u.id, u.kind, u.tag, u.operative?.role, Math.round(u.pos.x), Math.round(u.pos.z)]) }
  })
  note(`TC-10 a${attempt} board ${J(board)}`)
  let res = 'none'
  const MAXSTEP = Number(process.env.MAXSTEP || 700)
  for (let step = 0; step < MAXSTEP; step++) {
    await page.evaluate(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().setPaused(false))
    await wait(400)
    const s = await page.evaluate(async (step) => {
      const ms = (await import('/src/state/missionStore.ts')).useMissionStore
      const pre = { paused: ms.getState().paused, live: ms.getState().live, wt: (await import('/src/game/runtime.ts')).getWorld()?.time }
      ms.getState().setPaused(true)
      const w = (await import('/src/game/runtime.ts')).getWorld()
      const st = ms.getState()
      if (!w) return { result: st.result, civ: st.civiliansHit }
      const ag = w.units.filter((u) => u.kind === 'agent' && u.stance !== 'dead')
      const ids = ag.map((u) => u.id)
      const row = (id) => st.objectives.find((o) => o.id === id) || {}
      const cen = ag.length ? { x: ag.reduce((a, u) => a + u.pos.x, 0) / ag.length, z: ag.reduce((a, u) => a + u.pos.z, 0) / ag.length } : { x: 0, z: 0 }
      const d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
      const go = (p, r = 3) => { if (ag.some((u) => d(u.pos, p) > r) && (step % 5 === 0 || ag.every((u) => u.stance === 'idle'))) w.orderMove(ids, p) }
      if (ag.some((u) => u.hp / u.maxHp < 0.45)) w.orderUseMed(ids)
      const relays = w.units.filter((u) => u.kind === 'device' && u.tag === 'relay' && u.stance !== 'dead')
      let phaseName
      if (!row('rh1').done) { phaseName = 'yard'; go(w.city.landmarks['yard-a']) }
      else if (relays.length) {
        phaseName = 'relays'
        const r = relays.sort((a, b) => d(a.pos, cen) - d(b.pos, cen))[0]
        if (d(cen, r.pos) > 6) go(r.pos, 6)
        else { w.orderAbility(ids); w.orderGrenade(ids, r.pos) }
      } else if (!row('rh3').done) { phaseName = 'hold'; go(w.city.landmarks.target, 2.5) }
      else { phaseName = 'extract'; go(w.city.extraction, 2) }
      return { pre, errs: document.querySelectorAll('[role=dialog],[role=alertdialog]').length, t: Math.round(w.time), phaseName, result: st.result, civ: st.civiliansHit, ag: ag.map((u) => u.id + ':' + Math.round(u.hp)).join(','), relays: relays.map((r) => r.id + ':' + Math.round(r.hp)).join(','), rows: st.objectives.map((o) => o.id + (o.done ? '+' : o.active ? '*' : '-') + (o.progress ? Math.round(o.progress * 100) : '')).join(' ') }
    }, step)
    if (step % 15 === 0 || s.result !== 'none' || process.env.VERBOSE) note(`TC-10 a${attempt} step ${step} ${J(s)}`)
    if (s.civ > 0) { note(`TC-10 a${attempt} civilian hit (${s.civ}): win would not be clean; attempt void`); return { start, res: 'civ' } }
    if (s.result && s.result !== 'none') { res = s.result; break }
  }
  await page.evaluate(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().setPaused(false))
  for (let i = 0; i < 40 && (await phase()) !== 'debrief'; i++) await wait(500)
  note(`TC-10 a${attempt} result ${res}, phase ${await phase()}`)
  if (res !== 'won' || (await phase()) !== 'debrief') return { start, res }
  await wait(800); await install()
  const deb = await page.evaluate(() => document.body.innerText.split('\n').filter((l) => /INFLUENCE|CIVILIAN|COLLATERAL/i.test(l)))
  const civ = await page.evaluate(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().civiliansHit)
  await shot('if-023-debrief-award')
  await clickEl('button', 'RETURN TO WORLD NETWORK')
  await wait(120)
  await shot('if-023-return-award')
  const after = await hdrInf()
  const lines = await page.evaluate(() => document.body.innerText.split('\n').filter((l) => /INFLUENCE|\b8\s*PTS\b/.test(l)))
  await install()
  const runs = await balanceRuns(8)
  return { start, res, deb, civ, after, lines, runs, phaseAfter: await phase() }
}
{
  let out = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { out = await playRustHaven(attempt) } catch (e) { note(`TC-10 a${attempt} error ${String(e).split('\n')[0]}`); await shot(`if-023-played-a${attempt}-error`); out = null; continue }
    if (out.res === 'won') break
  }
  if (out && out.res === 'won') {
    const pass = out.start === 'INFLUENCE0 PTS' && out.civ === 0 && out.after === 'INFLUENCE8 PTS' && !out.runs.some((r) => !r.inHeader && /\b8\s*PTS\b/.test(r.text))
    check('IF-023 TC-10', 'played clean win: return header reads start + 8 PTS; no other balance figure', pass, J(out))
  } else note('TC-10 NO CLEAN WIN PRODUCED ' + J(out))
}

note('page errors: ' + errs.length + (errs.length ? ' ' + J(errs.slice(0, 5)) : ''))
note(`# ${fails} FAIL`)
writeFileSync(OUT + 'handwalk-output.txt', log.join('\n') + '\n')
await browser.close()
