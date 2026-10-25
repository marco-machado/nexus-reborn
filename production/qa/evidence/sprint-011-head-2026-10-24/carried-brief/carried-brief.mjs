// Sprint 11 carried-from-Sprint-10 Brief checks H5-H8 (QA condition 4), HEAD 131a5c1.
// Setup and HELPERS copied verbatim from production/qa/evidence/sprint-011/probe.mjs
// (lines 22-60 setup; HELPERS; fresh/dismissCard/setScale/goto).
// Harness assists, named: localStorage clear; New Operation through
// save.startNewOperation; campaignStore.setState({intelLevel}) where an authored
// contract's gate needs it; worldStore.setState({influence}) to afford Expedite;
// reclient applied with the game's own reclientContract (in play it fires on a
// sector seizure or a city flip); Brief via selectMission; Assembly via goto('team').
// Run: PROBE_URL=http://localhost:4200/ node <this file>
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
const OUT = new globalThis.URL('.', import.meta.url).pathname
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
let page = await ctx.newPage()
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

/* ------------------------------- carried checks ------------------------------ */
const R = { meta: { url: URL, at: new Date().toISOString() }, H5: [], H6: [], H7: [], H8: [] }
const pauseW = () =>
  store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ paused: true })
  })
const phase = () => store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
const missionIdNow = () => store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().missionId)
const neon = () =>
  store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const { contractMission } = await import('/src/game/contracts.ts')
    return useWorldStore.getState().contracts.map((c) => {
      const m = contractMission(c)
      return { id: c.id, codename: m.codename, threat: c.threat, sector: c.sector, client: c.client, cityId: c.cityId, expedited: c.expedited, city: m.city }
    })
  })
const reqOf = (id) => store(async (id) => (await import('/src/state/worldStore.ts')).resolveMission(id)?.intelReq, id)
const setIntel = (n) => store(async (n) => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: n }), n)
const select = (id) => store(async (id) => (await import('/src/state/appStore.ts')).useAppStore.getState().selectMission(id), id)

async function openBrief(id, { scale = 100, intel = null } = {}) {
  await fresh(); await dismissCard(); await pauseW()
  if (intel) await setIntel(intel)
  await setScale(scale)
  await select(id)
  await wait(900)
  await install()
}

// Brief dossier: objectives as printed (tier, label, optional, kit), the threat box, notes.
const briefRead = () =>
  page.evaluate(() => {
    const objs = [...document.querySelectorAll('.mb-obj')].map((o) => {
      const span = o.children[1]
      const tier = span.querySelector(':scope > b')?.textContent.trim()
      const label = [...span.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim()
      const kitEl = span.querySelector('.mb-obj-kit')
      const kit = kitEl ? kitEl.textContent.replace(/^\s*KIT:\s*/, '').trim() : null
      return { tier, label, optional: tier === 'OPTIONAL:', kit }
    })
    const th = document.querySelector('.mb-threat')
    return {
      sub: document.querySelector('.screen-sub')?.textContent.trim(),
      threat: th ? { text: th.textContent.replace(/\s+/g, ' ').trim(), box: window.__probe.box(th) } : null,
      objectives: objs,
      kitBoxes: [...document.querySelectorAll('.mb-obj-kit')].map((k) => ({ t: k.textContent.trim(), ...window.__probe.box(k) })),
      eta: document.querySelector('.mb-reward-eta')?.textContent.trim(),
      collateral: document.querySelector('.mb-collateral')?.textContent.replace(/\s+/g, ' ').trim(),
      notes: [...document.querySelectorAll('.mb-note')].map((n) => n.textContent.trim()),
    }
  })

// H5 rail measure: scroll the rail to its end, then the last row's box vs the rail's visible box and the fade.
async function railMeasure() {
  await page.evaluate(() => { const r = document.querySelector('.mb-tac-rail'); r.scrollTop = r.scrollHeight })
  await wait(450) // fade opacity transition 0.2s
  return page.evaluate(() => {
    const rail = document.querySelector('.mb-tac-rail')
    const rr = rail.getBoundingClientRect()
    const vis = { top: rr.top + rail.clientTop, bottom: rr.top + rail.clientTop + rail.clientHeight, left: rr.left, right: rr.left + rail.clientWidth }
    const rows = [...rail.querySelectorAll('.mb-tac-stat')]
    const last = rows[rows.length - 1]
    const lr = last.getBoundingClientRect()
    const rg = document.createRange(); rg.selectNodeContents(last)
    const tr = rg.getBoundingClientRect()
    const fade = rail.parentElement.querySelector('.scroll-fade')
    const fr = fade.getBoundingClientRect()
    const fop = parseFloat(getComputedStyle(fade).opacity)
    const fadeOn = fade.classList.contains('on')
    // Gradient 0 -> 0.97 alpha over the fade's height: the opaque part (alpha >= 0.5) starts at ~52% down.
    const opaqueTop = fop > 0.02 ? fr.top + fr.height * (0.5 / 0.97) : null
    const r1 = (v) => Math.round(v * 10) / 10
    const inside = lr.top >= vis.top - 0.5 && lr.bottom <= vis.bottom + 0.5 && lr.left >= vis.left - 0.5 && lr.right <= vis.right + 0.5
    const clearOfFade = opaqueTop === null || lr.bottom <= opaqueTop + 0.5
    return {
      lastRow: last.textContent.replace(/\s+/g, ' ').trim(),
      rows: rows.length,
      scrollable: rail.scrollHeight > rail.clientHeight + 1,
      scrollTop: rail.scrollTop, scrollHeight: rail.scrollHeight, clientHeight: rail.clientHeight,
      railVisible: { top: r1(vis.top), bottom: r1(vis.bottom), left: r1(vis.left), right: r1(vis.right) },
      rowBox: { top: r1(lr.top), bottom: r1(lr.bottom), left: r1(lr.left), right: r1(lr.right) },
      textBox: { top: r1(tr.top), bottom: r1(tr.bottom) },
      fade: { on: fadeOn, opacity: fop, top: r1(fr.top), bottom: r1(fr.bottom), opaqueFrom: opaqueTop === null ? null : r1(opaqueTop) },
      inside, clearOfFade, pass: inside && clearOfFade,
    }
  })
}

const railShot = async (name) => {
  const b = await page.evaluate(() => { const r = document.querySelector('.mb-tac').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })
  await page.screenshot({ path: `${OUT}${name}.png`, clip: b })
}

/* ------------------------------------ H5 ------------------------------------ */
for (const id of ['m01', 'm02', 'm03']) {
  const req = await (async () => { await fresh(); return reqOf(id) })()
  for (const scale of SCALES) {
    await openBrief(id, { scale, intel: Math.max(1, req) })
    const ph = await phase()
    if (ph !== 'brief') { R.H5.push({ id, scale, error: 'phase ' + ph }); note(`H5 ${id} ${scale} not on brief (${ph})`); continue }
    const m = await railMeasure()
    await railShot(`h5-${id}-s${scale}-rail`)
    await shot(`h5-${id}-s${scale}-screen`)
    R.H5.push({ id, scale, intel: Math.max(1, req), ...m })
    note(`H5 ${id} s${scale} ${m.pass ? 'PASS' : 'FAIL'} last="${m.lastRow}" row ${m.rowBox.top}-${m.rowBox.bottom} rail ${m.railVisible.top}-${m.railVisible.bottom} scrollable=${m.scrollable} fade=${JSON.stringify(m.fade)}`)
  }
}

/* ------------------------------------ H6 ------------------------------------ */
async function h6(mode) {
  const rec = { mode, steps: [] }
  await fresh(); await dismissCard(); await pauseW()
  const list = await neon()
  const target = list.find((c) => c.codename === 'NEON GARDEN') || list.find((c) => c.threat === 'MODERATE' && c.sector === 'eu')
  rec.contract = target; rec.contracts = list
  await select(target.id); await wait(900); await install()
  rec.before = await briefRead(); await shot(`h6-${mode}-1-brief-before`)
  await goto('world'); await wait(700); await install()
  if (mode === 'expedite') {
    await store(async () => {
      const { useWorldStore } = await import('/src/state/worldStore.ts')
      useWorldStore.setState({ influence: 20, selected: 'eu' })
    })
    await wait(500)
    const btn = page.locator('button', { hasText: 'EXPEDITE' }).first()
    rec.buttonFound = (await btn.count()) > 0
    if (rec.buttonFound) {
      rec.buttonText = (await btn.textContent())?.replace(/\s+/g, ' ').trim()
      rec.buttonDisabled = await btn.isDisabled()
      await shot(`h6-${mode}-2-world-before-click`)
      if (!rec.buttonDisabled) await btn.click()
    }
    await wait(600)
    rec.via = 'UI click on the EXPEDITE button'
  } else {
    rec.via = 'reclientContract (game function) applied to the open record; in play a seizure or city flip calls it'
    rec.reclient = await store(async (id) => {
      const { useWorldStore } = await import('/src/state/worldStore.ts')
      const { reclientContract } = await import('/src/game/contracts.ts')
      const s = useWorldStore.getState()
      const c = s.contracts.find((x) => x.id === id)
      const corps = ['stratos', 'helix', 'omni', 'nexus']
      let out = null
      const tried = []
      for (const corp of corps) {
        if (corp === c.client) continue
        try {
          const r = reclientContract(c, corp, s.owner, s.contractRngState)
          tried.push(corp + '->' + r.contract.client)
          if (r.contract.client !== c.client) { out = r; break }
        } catch (e) { tried.push(corp + ' err ' + e.message) }
      }
      if (!out) return { applied: false, tried, from: c.client }
      useWorldStore.setState({ contracts: s.contracts.map((x) => (x.id === id ? out.contract : x)), contractRngState: out.state })
      return { applied: true, tried, from: c.client, to: out.contract.client, cityFrom: c.cityId, cityTo: out.contract.cityId }
    }, target.id)
  }
  rec.after = (await neon()).find((c) => c.id === target.id)
  await shot(`h6-${mode}-3-world-after`)
  rec.missionIdOnReturn = await missionIdNow()
  await goto('brief'); await wait(900); await install()
  if ((await phase()) !== 'brief') { await select(target.id); await wait(900); await install(); rec.reselected = true }
  rec.brief = await briefRead(); await shot(`h6-${mode}-4-brief-after`)
  await goto('team'); await wait(900)
  await shot(`h6-${mode}-5-assembly`)
  const dep = page.locator('.ts-deploy button').first()
  rec.deployDisabled = await dep.isDisabled()
  if (!rec.deployDisabled) await dep.click()
  await wait(4000)
  rec.phaseAfterDeploy = await phase()
  rec.hud = await page.evaluate(() => [...document.querySelectorAll('.hud-objectives-body .hud-obj')].map((o) => ({
    label: o.querySelector('.hud-obj-text')?.textContent.trim() ?? o.textContent.trim(),
    optional: !!o.querySelector('.hud-obj-opt'),
  })))
  rec.simKits = await store(async () => {
    const { useMissionStore } = await import('/src/state/missionStore.ts')
    const { kitLine } = await import('/src/ui/kitLine.ts')
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { resolveMission } = await import('/src/state/worldStore.ts')
    const live = useMissionStore.getState().objectives || []
    const def = resolveMission(useAppStore.getState().missionId)
    return {
      live: live.map((o) => ({ id: o.id, label: o.label, optional: !!o.optional, kind: o.kind })),
      defKits: def ? def.objectives.map((o) => ({ label: o.label, kit: kitLine(o) || null })) : null,
    }
  }).catch((e) => ({ error: String(e) }))
  await shot(`h6-${mode}-6-hud`)
  const b = rec.brief.objectives, h = rec.hud
  rec.labelsMatch = b.length === h.length && b.every((o, i) => o.label.replace(/\s*\(\+[\d,]+ CR\)\s*$/, '') === h[i].label && o.optional === h[i].optional)
  rec.kitsMatch = !!rec.simKits.defKits && rec.simKits.defKits.length === b.length && rec.simKits.defKits.every((d, i) => (d.kit || null) === b[i].kit)
  rec.beforeEqualsAfter = JSON.stringify(rec.before.objectives) === JSON.stringify(rec.brief.objectives)
  rec.actionApplied = mode === 'expedite' ? !!rec.after?.expedited : !!rec.reclient?.applied
  rec.pass = rec.actionApplied && rec.phaseAfterDeploy === 'mission' && rec.labelsMatch && rec.kitsMatch
  note(`H6 ${mode} ${rec.pass ? 'PASS' : 'FAIL'} applied=${rec.actionApplied} phase=${rec.phaseAfterDeploy} labels=${rec.labelsMatch} kits=${rec.kitsMatch} before==after=${rec.beforeEqualsAfter}`)
  R.H6.push(rec)
}
try { await h6('expedite') } catch (e) { note('H6 expedite error ' + e); R.H6.push({ mode: 'expedite', error: String(e) }) }
try { await h6('reclient') } catch (e) { note('H6 reclient error ' + e); R.H6.push({ mode: 'reclient', error: String(e) }) }

/* ------------------------------------ H7 ------------------------------------ */
await fresh()
const NEON = (await neon()).find((c) => c.codename === 'NEON GARDEN')
R.neon = NEON
note('NEON ' + JSON.stringify(NEON))
for (const scale of SCALES) {
  await openBrief(NEON.id, { scale })
  const ph = await phase()
  const read = await briefRead()
  const clip = await page.evaluate(() => window.__probe.clipped('.screen'))
  await shot(`h7-neon-s${scale}`)
  // dossier scrolled to end too (KIT lines / notes may sit below the fold)
  await page.evaluate(() => { const d = document.querySelector('.mb-dossier-scroll'); if (d) d.scrollTop = d.scrollHeight })
  await wait(400)
  const clipEnd = await page.evaluate(() => window.__probe.clipped('.screen'))
  await shot(`h7-neon-s${scale}-dossier-end`)
  const overlaps = [...clip, ...clipEnd].filter((x) => /overlap/.test(x))
  const rec = { scale, phase: ph, ...read, clipped: clip, clippedDossierEnd: clipEnd, overlaps, pass: ph === 'brief' && clip.length === 0 && clipEnd.length === 0 && !!read.threat && read.kitBoxes.length > 0 }
  R.H7.push(rec)
  note(`H7 s${scale} ${rec.pass ? 'PASS' : 'FAIL'} phase=${ph} kits=${read.kitBoxes.length} clipped=${clip.length}/${clipEnd.length} ${[...clip, ...clipEnd].join(' | ')}`)
}

/* ------------------------------------ H8 ------------------------------------ */
const layoutOf = () =>
  page.evaluate(() => {
    const q = (s) => { const e = document.querySelector(s); return e ? window.__probe.box(e) : null }
    const rail = document.querySelector('.mb-tac-rail')
    return {
      screen: q('.screen'), main: q('.mb-main'), left: q('.mb-left'), recon: q('.mb-recon'), tac: q('.mb-tac'), plate: q('.mb-tac-plate'),
      dossier: q('.mb-dossier'), foot: q('.mb-foot'),
      railScrolls: rail ? rail.scrollHeight > rail.clientHeight + 1 : null,
      dossierScrolls: (() => { const d = document.querySelector('.mb-dossier-scroll'); return d ? d.scrollHeight > d.clientHeight + 1 : null })(),
      docOverflow: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
    }
  })
const base = {}
for (const [id, intel] of [['m03', Math.max(1, await reqOf('m03'))], [NEON.id, null]]) {
  await openBrief(id, { intel }); base[id] = await layoutOf()
}
await ctx.close()
const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
page = await ctx2.newPage()
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
for (const [id, intel, name] of [['m03', Math.max(1, await (async () => { await fresh(); return reqOf('m03') })()), 'm03'], [NEON.id, null, 'neon']]) {
  await openBrief(id, { intel })
  const ph = await phase()
  const lay = await layoutOf()
  const clip = await page.evaluate(() => window.__probe.clipped('.screen'))
  await shot(`h8-${name}-1920x1080`)
  const b = base[id]
  const grew = ['main', 'left', 'tac', 'plate', 'dossier'].map((k) => ({ k, w1280: b[k]?.w, h1280: b[k]?.h, w1920: lay[k]?.w, h1920: lay[k]?.h, ok: !!lay[k] && !!b[k] && lay[k].w >= b[k].w - 0.5 && lay[k].h >= b[k].h - 0.5 }))
  const fills = lay.screen && lay.screen.w >= 1900 && lay.screen.h >= 1060 && lay.docOverflow.w <= 1920 && lay.docOverflow.h <= 1080
  const rec = { id, name, phase: ph, clipped: clip, layout1920: lay, layout1280: b, grew, fills, pass: ph === 'brief' && clip.length === 0 && grew.every((g) => g.ok) && fills }
  R.H8.push(rec)
  note(`H8 ${name} ${rec.pass ? 'PASS' : 'FAIL'} clipped=${clip.length} ${clip.join(' | ')} grew=${JSON.stringify(grew)} fills=${fills} screen=${JSON.stringify(lay.screen)}`)
}

R.errors = errs
note('page errors: ' + errs.length + (errs.length ? ' :: ' + errs.slice(0, 8).join(' || ') : ''))
writeFileSync(OUT + 'results.json', JSON.stringify(R, null, 2))
writeFileSync(OUT + 'output.txt', log.join('\n') + '\n')
await browser.close()
