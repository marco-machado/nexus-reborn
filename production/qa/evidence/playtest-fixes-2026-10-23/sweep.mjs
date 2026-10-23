// Screen sweep, 2026-10-23: the measured base for the UX specs of Research,
// Brief, Assembly, Debrief and Settings, and the accessibility audit of every
// surface against the Standard tier (art bible §7.5 floors: text >= 10 px,
// body/readout text >= 4.5:1, Ink Faint never carries text; WCAG 2.2 SC 2.5.8
// 24x24 targets, owner 2026-10-23).
// Measurement helpers are copied from production/qa/evidence/sprint-011/probe.mjs.
//
// For each surface, at exactly 1280x720 in headless Chrome for Testing:
// text runs under 10 px, under 4.5:1 as rendered (default and high contrast),
// Ink Dim / Ink Faint text, pointer targets under 24x24, the Tab order, and
// clip / truncation / spill / overlap at text scales 90 / 100 / 110 / 125.
// Writes sweep-<surface>.json, PNGs and sweep-output.txt here.
//
// Harness assists, named: localStorage clear; New Operation through
// save.startNewOperation; Brief through selectMission('m03'); Assembly through
// goto('team'); Debrief through setOutcome(settleOutcome(...)) after a Screen
// visit; the mission through startMission; Pause through the Escape key;
// Balance through Settings with one seeded abort record (telemetry.saveRecords);
// Settings through the menu's SETTINGS button; text scale and high contrast
// through the settings store.
//
// Run: preview_start "dev" (port 4200), then
//      node production/qa/evidence/screens-2026-10-23/sweep.mjs
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME =
  process.env.PROBE_CHROME ||
  process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.PROBE_URL || 'http://localhost:4200/'
const OUT = process.env.PROBE_OUT || new globalThis.URL('.', import.meta.url).pathname
const SCALES = [90, 100, 110, 125]
const INK_DIM = 'rgb(93, 125, 117)'
const INK_FAINT = 'rgb(53, 80, 74)'

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
const wait = (ms) => page.waitForTimeout(ms)
const log = []
const note = (s) => { log.push(s); console.log(s) }

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
        // HUD panels too (2026-10-23: a HUD panel head ran past its panel and
        // off the viewport at 125% and no host was listed for it).
        const host = el.parentElement?.closest('button, .panel-body, .kv, .hud-panel')
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
          // Text past the viewport edge is cut by the screen itself.
          if (tr.width && (tr.right > innerWidth + 1 || tr.left < -1)) {
            bad.push('offscreen ' + what + ' text ' + Math.round(tr.left) + '-' + Math.round(tr.right))
            break
          }
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
const store = (fn, arg) => page.evaluate(fn, arg)
const setScale = (scale) => store(async (scale) => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setTextScale(scale)
}, scale)
const setHC = (on) => store(async (on) => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setHighContrast(on)
}, on)

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await store(async () => {
    (await import('/src/state/save.ts')).startNewOperation()
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    for (const id of ['hint-worldmap', 'hint-influence', 'hint-debrief-research']) useTutorialStore.getState().markSeen(id)
  })
}

const SURFACES = {
  world: async () => {
    await fresh()
    await store(async () => {
      const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
      useTutorialStore.setState({ seen: useTutorialStore.getState().seen.filter((x) => x !== 'hint-worldmap') })
      const { useWorldStore } = await import('/src/state/worldStore.ts')
      useWorldStore.setState({ influence: 8, selected: 'na', unread: 2 })
      useTutorialStore.setState({ seen: useTutorialStore.getState().seen.filter((x) => x !== 'hint-influence') })
      const { useAppStore } = await import('/src/state/appStore.ts')
      useAppStore.getState().goto('world')
    })
    await wait(800)
  },
  menu: async () => { await fresh(); await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().goto('menu')) },
  settings: async () => {
    await SURFACES.menu(); await wait(400)
    await page.locator('button', { hasText: 'SETTINGS' }).first().click()
  },
  research: async () => { await fresh(); await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().goto('research')) },
  brief: async () => { await fresh(); await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().selectMission('m03')) },
  team: async () => {
    await fresh()
    await store(async () => {
      const { useAppStore } = await import('/src/state/appStore.ts')
      useAppStore.getState().selectMission('m03')
      useAppStore.getState().goto('team')
    })
  },
  debrief: async () => {
    await SURFACES.team(); await wait(900)
    await store(async () => {
      const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
      const applyKey = useAppStore.getState().lastAppliedKey + 1
      useAppStore.getState().setOutcome(settleOutcome({
        applyKey, won: true, kills: 2, casualties: 0, timeSec: 180, civiliansHit: 0,
        reward: 85000, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false,
      }))
    })
    await page.waitForSelector('.db-filing', { timeout: 20000 })
    await wait(1800)
  },
  mission: async () => {
    await SURFACES.team(); await wait(900)
    await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission())
    await wait(6000)
  },
  pause: async () => { await SURFACES.mission(); await page.keyboard.press('Escape'); await wait(600) },
  // TM-019: the casualty hold banner over the live HUD.
  hold: async () => {
    await SURFACES.mission()
    await store(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().setHeld(true, 'GHOST AT 27%'))
    await wait(400)
  },
  // IF-039 / WN-021: a won Debrief with a KIA cost row and the sector move rows.
  debriefkia: async () => {
    await SURFACES.team(); await wait(900)
    await store(async () => {
      const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
      const applyKey = useAppStore.getState().lastAppliedKey + 1
      useAppStore.getState().setOutcome(settleOutcome({
        applyKey, won: true, kills: 6, casualties: 1, timeSec: 72, civiliansHit: 1,
        reward: 37000, bonus: 0, deadIds: ['op3'], survivorHp: { op1: 0.9, op2: 0.3, op4: 0.8 }, quietReplay: false,
      }))
    })
    await page.waitForSelector('.db-filing', { timeout: 20000 })
    await wait(2500)
  },
  balance: async () => {
    await fresh()
    await store(async () => {
      const t = await import('/src/state/telemetry.ts')
      t.saveRecords([
        { at: Date.now() - 60000, missionId: 'm03', outcome: 'aborted', durationSec: 42, seed: 7, squadRoles: ['assault', 'recon'] },
      ])
      const { useAppStore } = await import('/src/state/appStore.ts')
      useAppStore.getState().goto('menu')
    })
    await page.reload(); await wait(1500)
    await page.locator('button', { hasText: 'SETTINGS' }).first().click(); await wait(400)
    await page.locator('button[aria-label="Open the balance dashboard"]').click(); await wait(500)
  },
}

const targetSel = 'button, a[href], [role="button"], [role="slider"], input, select, [tabindex="0"]'
async function measure() {
  // Let every finite animation end first: measured mid fade-in, the World
  // Network orientation card read 14 low-contrast runs that a settled card
  // does not have (ancestor opacity under 1). Looping animations never end.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  )
  await install()
  return page.evaluate(({ targetSel, INK_DIM, INK_FAINT }) => {
    const runs = window.__probe.runs('body').map(({ el, ...r }) => ({ ...r, inactive: !!el.closest(':disabled, [aria-disabled="true"]'), blink: el.getAnimations().some((a) => a.animationName === 'cursor-blink' || a.animationName === 'blink'), key: el.tagName.toLowerCase() + ([...el.classList].length ? '.' + [...el.classList].join('.') : '') + ' < ' + (el.parentElement ? el.parentElement.tagName.toLowerCase() + ([...el.parentElement.classList].length ? '.' + [...el.parentElement.classList].join('.') : '') : ''), w: Math.round(el.getBoundingClientRect().width) }))
    // A slider's hit area may extend past its drawn box (a transparent band):
    // measure what the pointer reaches through its centre column.
    const hitHeight = (el) => {
      const r = el.getBoundingClientRect()
      const x = r.left + r.width / 2
      let top = null, bottom = null
      for (let y = Math.floor(r.top) - 20; y <= Math.ceil(r.bottom) + 20; y++) {
        if (document.elementFromPoint(x, y)?.closest('[role="slider"]') === el) { if (top === null) top = y; bottom = y }
      }
      return top === null ? r.height : bottom - top + 1
    }
    const targets = [...document.querySelectorAll(targetSel)].filter(window.__probe.visible).map((el) => {
      const b = window.__probe.box(el)
      if (el.getAttribute('role') === 'slider') b.h = Math.max(b.h, hitHeight(el))
      return { name: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), ...b }
    })
    // SVG text: rendered size is the computed font-size times the element's
    // screen scale; ink is its fill (times fill-opacity and ancestor opacity)
    // over the backgrounds under the <svg>.
    const svgRuns = [...document.querySelectorAll('svg text, svg tspan')].filter((el) => {
      if (el.tagName === 'text' && el.querySelector('tspan')) return false
      if (!el.textContent.trim()) return false
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && window.__probe.visible(el.closest('svg'))
    }).map((el) => {
      const cs = getComputedStyle(el)
      const m = el.getScreenCTM()
      const scale = m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : 1
      const fill = window.__probe.parse(cs.fill) || { r: 0, g: 0, b: 0, a: 1 }
      let a = fill.a * parseFloat(cs.fillOpacity || '1')
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) a *= parseFloat(getComputedStyle(n).opacity)
      const bg = window.__probe.bgOf(el.closest('svg'))
      const fg = window.__probe.over({ ...fill, a }, bg)
      const host = el.closest('svg')
      return {
        text: el.textContent.trim().slice(0, 40),
        size: Math.round(parseFloat(cs.fontSize) * scale * 10) / 10,
        ratio: Math.round(window.__probe.ratio(fg, bg) * 100) / 100,
        alpha: Math.round(a * 1000) / 1000,
        key: 'svg ' + el.tagName + ([...el.classList].length ? '.' + [...el.classList].join('.') : '') + ' < ' + (host.parentElement ? host.parentElement.className : ''),
      }
    }).filter((r) => r.alpha > 0)
    return {
      svgRuns: svgRuns.length,
      svgSmall: svgRuns.filter((r) => r.size < 9.95),
      svgLow: svgRuns.filter((r) => r.ratio < 4.5),
      runs: runs.length,
      small: runs.filter((r) => r.size < 9.95),
      // Inactive controls are exempt from the text-contrast floor (WCAG
      // 1.4.3), as is a caret mid-blink (decorative animation); both are
      // listed separately so the exemption stays visible.
      low: runs.filter((r) => r.ratio < 4.5 && !r.inactive && !r.blink),
      exempt: runs.filter((r) => r.ratio < 4.5 && (r.inactive || r.blink)).map((r) => r.text + (r.inactive ? ' [inactive]' : ' [blink]')),
      dim: runs.filter((r) => r.color === INK_DIM),
      faint: runs.filter((r) => r.color === INK_FAINT),
      targets: targets.length,
      underTargets: targets.filter((t) => t.w < 24 || t.h < 24),
      // WCAG 2.5.3 Label in Name: a control's visible label (its first
      // visible line that has a letter) must appear, as whole words, in its
      // accessible name (case and punctuation ignored).
      labelInName: [...document.querySelectorAll('button, a[href], [role="button"], [role="slider"]')].filter(window.__probe.visible).flatMap((el) => {
        const label = el.getAttribute('aria-label')
        // A one-character glyph (a key cap, a close X) is not a text label.
        const first = (el.innerText || '').split('\n').map((x) => x.trim()).find((x) => /[A-Za-z]/.test(x) && x.length > 1)
        if (!label || !first) return []
        const norm = (x) => ' ' + x.toUpperCase().replace(/[^A-Z0-9%]+/g, ' ').trim() + ' '
        return norm(label).includes(norm(first)) ? [] : [first.slice(0, 30) + ' => ' + label.slice(0, 50)]
      }),
      textBoxes: runs.map((r) => ({ text: r.text, size: r.size, w: r.w, key: r.key })),
    }
  }, { targetSel, INK_DIM, INK_FAINT })
}
async function tabOrder() {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0) })
  const seen = []
  for (let i = 0; i < 70; i++) {
    await page.keyboard.press('Tab')
    const a = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      return { tag: el.tagName.toLowerCase(), name: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50), dis: el.getAttribute('aria-disabled') }
    })
    if (!a) break
    if (seen.length && seen[0].name === a.name && seen[0].tag === a.tag && i > 1) break
    seen.push(a)
  }
  return seen
}
const group = (list) => {
  const m = new Map()
  for (const r of list) { const k = r.key + ' ' + (r.size !== undefined ? r.size + 'px' : '') + (r.ratio !== undefined ? ' ' + r.ratio : ''); if (!m.has(k)) m.set(k, []); m.get(k).push(r.text) }
  return [...m].map(([k, v]) => k + ' :: ' + [...new Set(v)].slice(0, 3).join(' | '))
}

for (const name of (process.env.SURFACES || Object.keys(SURFACES).join(',')).split(',')) {
  try {
    await SURFACES[name]()
    await wait(500)
    const def = await measure()
    await page.screenshot({ path: `${OUT}${name}-100.png` })
    const tab = name === 'mission' || name === 'hold' ? [] : await tabOrder()
    await setHC(true); await wait(250)
    const hc = await measure()
    await page.screenshot({ path: `${OUT}${name}-hc.png` })
    await setHC(false)
    const clips = {}
    for (const s of SCALES) {
      await setScale(s); await wait(300); await install()
      clips[s] = await page.evaluate(() => window.__probe.clipped('body'))
      if (s !== 100) await page.screenshot({ path: `${OUT}${name}-${s}.png` })
    }
    await setScale(100)
    writeFileSync(`${OUT}sweep-${name}.json`, JSON.stringify({ def, hcLow: hc.low, tab, clips }, null, 1))
    note(`## ${name}: ${def.runs} runs, ${def.targets} targets`)
    note(`  <10px: ${def.small.length}` + (def.small.length ? '\n    ' + group(def.small).join('\n    ') : ''))
    note(`  <4.5:1 default: ${def.low.length}` + (def.low.length ? '\n    ' + group(def.low).join('\n    ') : ''))
    note(`  <4.5:1 high contrast: ${hc.low.length}`)
    if (def.exempt.length) note(`  exempt (inactive / blinking): ${[...new Set(def.exempt)].slice(0, 6).join(' | ')}`)
    note(`  Ink Dim text: ${def.dim.length}; Ink Faint text: ${def.faint.length}`)
    note(`  svg text: ${def.svgRuns} runs; <10px: ${def.svgSmall.length}; <4.5:1: ${def.svgLow.length}` + (def.svgSmall.length + def.svgLow.length ? '\n    ' + group([...def.svgSmall, ...def.svgLow]).slice(0, 12).join('\n    ') : ''))
    note(`  label-in-name: ${def.labelInName.length}` + (def.labelInName.length ? '\n    ' + def.labelInName.slice(0, 12).join('\n    ') : ''))
    note(`  targets <24: ${def.underTargets.length}` + (def.underTargets.length ? '\n    ' + def.underTargets.map((t) => `${t.name} ${t.w}x${t.h}`).join('\n    ') : ''))
    for (const s of SCALES) note(`  clip @${s}: ${clips[s].length}` + (clips[s].length ? '\n    ' + clips[s].slice(0, 8).join('\n    ') : ''))
    note(`  tab stops: ${tab.length}`)
  } catch (e) {
    note(`## ${name}: NOT MEASURED // ${String(e).split('\n')[0]}`)
  }
}
note(errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' | ') : 'no page errors')
writeFileSync(OUT + 'sweep-output.txt', log.join('\n') + '\n')
await browser.close()
