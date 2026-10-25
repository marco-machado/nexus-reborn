// IF-036 hand-walk, Sprint 11 /team-qa Phase 5, 2026-10-24, build HEAD 131a5c1.
// Cases: TC-036-09 (exempt controls disabled), -10 (SVG text fill), -11 (card
// opacity settled), -12 (World Network mid-fade freeze), -15 (Settings at four
// scales, inside .hud-menu-wrap), -21 (Pause, same), -22 (Assembly stat labels
// line boxes), -23 (mid-word breaks, eight surfaces x four scales).
// Headless Chrome for Testing, 1280x720. Navigation and HELPERS copied from
// production/qa/evidence/playtest-fixes-2026-10-23/sweep.mjs (R4); the
// .hud-menu-wrap overlay exclusion is removed in a string copy only.
// Run: PROBE_OUT=<this folder>/ node <this folder>/if036-handwalk.mjs
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
const R = {}

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

// Same helpers with .hud-menu-wrap no longer a declared overlay (TC-15/21).
const HELPERS_OPEN_SRC = '(' + HELPERS.toString().replace("'.hud-menu-wrap, .tip, .globe-view, .wm-map-wrap'", "'.tip, .globe-view, .wm-map-wrap'") + ')()'
if (HELPERS_OPEN_SRC === '(' + HELPERS.toString() + ')()') throw new Error('overlay selector not replaced')
const install = () => page.evaluate(HELPERS)
const installOpen = () => page.evaluate(HELPERS_OPEN_SRC)
const store = (fn, arg) => page.evaluate(fn, arg)
const setScale = (scale) => store(async (scale) => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setTextScale(scale)
}, scale)
const settle = () => page.evaluate(() => Promise.all(document.getAnimations()
  .filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity)
  .map((a) => a.finished.catch(() => {}))))

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
}

// ---------- in-page probes ----------
const lowRuns = () => page.evaluate(() => {
  const wrap = document.querySelector('.wm-onboard-wrap')
  const wrapOp = wrap ? parseFloat(getComputedStyle(wrap).opacity) : null
  return window.__probe.runs('body').filter((r) => r.ratio < 4.5).map(({ el, ...r }) => {
    let noWrap = 1
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) if (n !== wrap) noWrap *= parseFloat(getComputedStyle(n).opacity)
    const colA = window.__probe.parse(getComputedStyle(el).color).a
    return { ...r, inCard: !!(wrap && wrap.contains(el)), wrapOp, alphaNoWrap: Math.round(noWrap * colA * 1000) / 1000,
      explained: !!(wrap && wrap.contains(el) && Math.abs(r.alpha - wrapOp * noWrap * colA) < 0.01 && wrapOp < 1) }
  })
})
const fadeAnim = () => page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('wm-onboard-wrap')).map((a) => ({ name: a.animationName, state: a.playState, t: a.currentTime })))

const svgFill = () => page.evaluate(({ INK_DIM, INK_FAINT }) => {
  const all = [...document.querySelectorAll('svg text, svg tspan')].filter((el) => {
    if (el.tagName === 'text' && el.querySelector('tspan')) return false
    if (!el.textContent.trim()) return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && window.__probe.visible(el.closest('svg'))
  }).map((el) => {
    const f = window.__probe.parse(getComputedStyle(el).fill)
    const rgb = f ? `rgb(${f.r}, ${f.g}, ${f.b})` : getComputedStyle(el).fill
    return { text: el.textContent.trim().slice(0, 30), fill: rgb, host: el.closest('svg').parentElement?.className || '' }
  })
  return { n: all.length, fills: [...new Set(all.map((x) => x.fill))], hits: all.filter((x) => x.fill === INK_DIM || x.fill === INK_FAINT) }
}, { INK_DIM, INK_FAINT })

const exemptCheck = () => page.evaluate(() => {
  const runs = window.__probe.runs('body').filter((r) => r.ratio < 4.5)
  return runs.map(({ el, ...r }) => {
    const ctl = el.closest('button, [role="button"], input, select, a')
    return { text: r.text, ratio: r.ratio, path: r.path,
      control: ctl ? (ctl.getAttribute('aria-label') || ctl.textContent.trim()).slice(0, 60) : null,
      disabled: ctl ? ctl.disabled === true : null, ariaDisabled: ctl ? ctl.getAttribute('aria-disabled') : null,
      inactive: !!el.closest(':disabled, [aria-disabled="true"]'),
      anims: el.getAnimations().map((a) => a.animationName + (a.effect.getComputedTiming().iterations === Infinity ? '(inf)' : '')) }
  })
})

const midWord = () => page.evaluate(() => {
  const isWord = (c) => /[\p{L}\p{N}]/u.test(c)
  const hits = []
  let multi = 0
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let t = tw.nextNode(); t; t = tw.nextNode()) {
    const host = t.parentElement
    if (!t.textContent.trim() || !host || host.closest('svg, script, style') || !window.__probe.visible(host)) continue
    const rg = document.createRange()
    rg.selectNodeContents(t)
    const rects = [...rg.getClientRects()].filter((r) => r.width > 0.5)
    if (rects.length < 2) continue
    multi++
    const s = t.textContent
    let prevTop = null, prevIdx = -1
    for (let i = 0; i < s.length; i++) {
      rg.setStart(t, i); rg.setEnd(t, i + 1)
      const rr = [...rg.getClientRects()].filter((r) => r.width > 0.5)
      if (!rr.length) continue
      const top = rr[rr.length - 1].top, h = rr[rr.length - 1].height
      if (prevTop !== null && top > prevTop + h * 0.5) {
        const a = s[prevIdx], b = s[i]
        // Zero-width characters at a line end (a collapsed space) are skipped by
        // the rect filter: the gap between the two sides must hold only letters
        // or digits for the boundary to be mid-word (fix after run 1).
        if (isWord(a) && isWord(b) && /^[\p{L}\p{N}]*$/u.test(s.slice(prevIdx + 1, i))) {
          const b0 = host.getBoundingClientRect()
          hits.push({ text: s.trim().slice(0, 60), at: s.slice(Math.max(0, prevIdx - 8), prevIdx + 1) + '|' + s.slice(i, i + 8),
            lines: rects.length, path: window.__probe.path(host), box: { x: b0.x, y: b0.y, w: b0.width, h: b0.height } })
        }
      }
      prevTop = top; prevIdx = i
    }
  }
  return { multi, hits }
})

const statLabels = () => page.evaluate(() => [...document.querySelectorAll('.ts-stats label')].map((l) => {
  const rg = document.createRange(); rg.selectNodeContents(l)
  const t = [...l.childNodes].find((n) => n.nodeType === 3)
  const r2 = document.createRange(); if (t) r2.selectNodeContents(t)
  return { text: l.textContent.trim(), lineBoxes: [...(t ? r2 : rg).getClientRects()].filter((r) => r.width > 0.5).length,
    labelW: Math.round(l.getBoundingClientRect().width * 10) / 10, textW: Math.round(rg.getBoundingClientRect().width * 10) / 10,
    fontPx: parseFloat(getComputedStyle(l).fontSize) }
}))

const wrapClip = async () => {
  await installOpen()
  const res = await page.evaluate(() => {
    const top = window.__probe.clipped('.hud-menu-wrap')
    const body = window.__probe.clipped('body')
    const wrap = document.querySelector('.hud-menu-wrap')
    const sc = wrap ? [...wrap.querySelectorAll('*')].filter((el) => /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1) : []
    const hs = wrap ? [...wrap.querySelectorAll('*')].filter((el) => /(auto|scroll)/.test(getComputedStyle(el).overflowX + getComputedStyle(el).overflowY) && el.scrollWidth > el.clientWidth + 1).map((el) => window.__probe.path(el) + ' ' + el.scrollWidth + ' in ' + el.clientWidth) : []
    sc.forEach((el) => { el.scrollTop = el.scrollHeight })
    return { top, bodyCount: body.length, body: body.slice(0, 10), scrollers: sc.map((el) => window.__probe.path(el) + ' ' + el.scrollHeight + '/' + el.clientHeight), hscroll: hs }
  })
  await wait(150)
  res.end = await page.evaluate(() => window.__probe.clipped('.hud-menu-wrap'))
  await page.evaluate(() => { const w = document.querySelector('.hud-menu-wrap'); if (w) [...w.querySelectorAll('*')].forEach((el) => { el.scrollTop = 0 }) })
  return res
}

// ---------- TC-036-12 / TC-036-11: World Network, first in this batch ----------
async function worldGoto(reduced) {
  await fresh()
  return page.evaluate(async (reduced) => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setReducedMotion(reduced)
    useTutorialStore.setState({ seen: useTutorialStore.getState().seen.filter((x) => x !== 'hint-worldmap' && x !== 'hint-influence') })
    useWorldStore.setState({ influence: 8, selected: 'na', unread: 2 })
    useAppStore.getState().goto('world')
    await new Promise((r) => requestAnimationFrame(() => r()))
    const w = document.querySelector('.wm-onboard-wrap')
    const an = document.getAnimations().find((a) => a.effect?.target === w && a.animationName === 'fade-in')
    if (an) an.pause()
    return { wrap: !!w, anim: !!an, reduceClass: document.documentElement.classList.contains('s-reduce-motion') }
  }, reduced)
}
try {
  const g = await worldGoto(false)
  note('## world mid-fade: ' + JSON.stringify(g))
  R.midfade = { goto: g, steps: {} }
  await install()
  for (const ms of [40, 80, 120]) {
    await page.evaluate((ms) => { const w = document.querySelector('.wm-onboard-wrap'); const an = document.getAnimations().find((a) => a.effect?.target === w && a.animationName === 'fade-in'); if (an) an.currentTime = ms }, ms)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())))
    const low = await lowRuns()
    R.midfade.steps[ms] = { anim: await fadeAnim(), low }
    await page.screenshot({ path: `${OUT}world-midfade-${Math.round(ms / 1.6)}.png` })
    note(`  @${ms}ms: anim ${JSON.stringify(R.midfade.steps[ms].anim)} low ${low.length}; inCard ${low.filter((x) => x.inCard).length}; explained ${low.filter((x) => x.explained).length}`)
    for (const x of low.filter((x) => !x.inCard || !x.explained)) note(`    NOT EXPLAINED ${JSON.stringify(x)}`)
  }
  await page.evaluate(() => { const w = document.querySelector('.wm-onboard-wrap'); document.getAnimations().filter((a) => a.effect?.target === w).forEach((a) => a.finish()) })
  await settle()
  const settled = await lowRuns()
  const op = await page.evaluate(() => { let a = 1; const card = document.querySelector('.wm-onboard'); if (!card) return null; for (let n = card; n && n !== document.documentElement; n = n.parentElement) a *= parseFloat(getComputedStyle(n).opacity); return { product: a, understood: [...document.querySelectorAll('.wm-onboard button')].map((b) => b.textContent.trim()) } })
  await page.screenshot({ path: `${OUT}world-midfade-settled.png` })
  R.midfade.settled = settled; R.midfade.opacity = op
  note(`  settled: low ${settled.length} ${JSON.stringify(settled.map((x) => x.text + ' ' + x.ratio + ' ' + x.path))}; .wm-onboard->body opacity product ${JSON.stringify(op)}`)
  const g2 = await worldGoto(true)
  await install(); await wait(100)
  const rm = await lowRuns()
  R.midfade.reduced = { goto: g2, anim: await fadeAnim(), low: rm }
  await page.screenshot({ path: `${OUT}world-reduced-motion.png` })
  note(`  reduced motion: ${JSON.stringify(g2)} fade anims ${JSON.stringify(R.midfade.reduced.anim)} low ${rm.length}`)
  await store(async () => (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setReducedMotion(false))
} catch (e) { note('## world: NOT MEASURED // ' + String(e).split('\n')[0]) }

// ---------- eight surfaces ----------
for (const name of (process.env.SURFACES || Object.keys(SURFACES).join(',')).split(',')) {
  try {
    await SURFACES[name]()
    await wait(500); await settle(); await install()
    const out = (R[name] = { svg: await svgFill(), exempt: await exemptCheck(), scales: {} })
    if (name === 'mission' || name === 'pause') {
      out.zoom = await page.evaluate(() => [...document.querySelectorAll('.hud-mm-zoom button')].map((b) => ({ label: b.getAttribute('aria-label'), text: b.textContent.trim(), disabled: b.disabled })))
    }
    if (name === 'settings') {
      out.resets = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /^RESET( ALL)?$/.test(b.textContent.trim())).map((b) => ({ text: b.textContent.trim(), disabled: b.disabled, aria: b.getAttribute('aria-disabled') })))
    }
    note(`## ${name}: svg ${out.svg.n} runs, fills ${out.svg.fills.join(' / ')}; Ink Dim/Faint svg ${out.svg.hits.length}`)
    note(`  sub-4.5 runs (exempt candidates): ${JSON.stringify(out.exempt)}`)
    if (out.zoom) note(`  minimap zoom: ${JSON.stringify(out.zoom)}`)
    if (out.resets) note(`  resets: ${JSON.stringify(out.resets)}`)
    for (const s of SCALES) {
      await setScale(s); await wait(300); await install()
      const sc = (out.scales[s] = { mw: await midWord() })
      note(`  @${s}: multi-line text nodes ${sc.mw.multi}; mid-word breaks ${sc.mw.hits.length}`)
      let k = 0
      for (const h of sc.mw.hits) {
        note(`    BREAK "${h.at}" in "${h.text}" (${h.lines} lines) ${h.path}`)
        if (k++ < 12) {
          const c = { x: Math.max(0, h.box.x - 8), y: Math.max(0, h.box.y - 8), width: Math.min(1280 - Math.max(0, h.box.x - 8), h.box.w + 16), height: Math.min(720 - Math.max(0, h.box.y - 8), h.box.h + 16) }
          if (c.width > 1 && c.height > 1) await page.screenshot({ path: `${OUT}break-${name}-${s}-${k}.png`, clip: c })
        }
      }
      if (name === 'team') {
        sc.stats = await statLabels()
        note(`  stats @${s}: ${JSON.stringify(sc.stats)}`)
        const b = await page.locator('.ts-stats').first().boundingBox()
        if (b) await page.screenshot({ path: `${OUT}team-stats-${s}.png`, clip: b })
      }
      if (name === 'settings' || name === 'pause') {
        sc.wrap = await wrapClip()
        note(`  wrap clip @${s}: top ${sc.wrap.top.length} ${JSON.stringify(sc.wrap.top)}; end-of-scroll ${sc.wrap.end.length} ${JSON.stringify(sc.wrap.end)}; scrollers ${JSON.stringify(sc.wrap.scrollers)}; hscroll ${JSON.stringify(sc.wrap.hscroll)}; body(no exclusion) ${sc.wrap.bodyCount} ${JSON.stringify(sc.wrap.body)}`)
        await page.screenshot({ path: `${OUT}${name === 'settings' ? 'settings-panel' : 'pause-menu'}-${s}.png` })
      }
    }
    await setScale(100)
  } catch (e) { note(`## ${name}: NOT MEASURED // ${String(e).split('\n')[0]}`) }
}
note(errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' | ') : 'no page errors')
writeFileSync(OUT + 'handwalk.json', JSON.stringify(R, null, 1))
writeFileSync(OUT + 'handwalk-output.txt', log.join('\n') + '\n')
await browser.close()
