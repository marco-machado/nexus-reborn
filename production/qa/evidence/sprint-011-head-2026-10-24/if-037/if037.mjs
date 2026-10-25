// IF-037 hand-walk, Sprint 11 Phase 5 (2026-10-24). Headless Chrome for Testing, 1280x720.
// Lines below up to SURFACES are copied unchanged from screens-2026-10-23/focus.mjs (helpers + fixtures).
// balance/world fixtures copied from screens-2026-10-23/sweep.mjs. Run: node sprint-011-head-2026-10-24/if-037/if037.mjs
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


// Fixtures copied from sweep.mjs (balance, world) plus the market.
SURFACES.balance = async () => {
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
}
SURFACES.world = async () => {
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
}
SURFACES.market = async () => {
  await SURFACES.team(); await wait(900)
  await page.locator('button[aria-label*="OPEN THE RECRUITMENT MARKET"]').first().click(); await wait(400)
}
SURFACES.pauseSettings = async () => {
  await SURFACES.pause()
  await page.locator('button[aria-label="Open settings"]').click(); await wait(400)
}
const setRM = (on) => store(async (on) => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setReducedMotion(on)
}, on)
// Scratch helpers for TC-037-04: overlay() without .hud-menu-wrap.
const HELPERS_SRC = HELPERS.toString()
const installNoWrap = () => page.evaluate('(' + HELPERS_SRC.replace("'.hud-menu-wrap, .tip", "'.tip") + ')()')
if (!HELPERS_SRC.includes("'.hud-menu-wrap, .tip")) throw new Error('overlay selector not found in HELPERS')

// Copied from focus.mjs (its body section).
const active = () => page.evaluate(() => {
  const el = document.activeElement
  return el ? (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 60) : null
})
const inside = (sel) => page.evaluate((sel) => !!document.activeElement?.closest(sel), sel)
const ONLY = process.env.CASES ? process.env.CASES.split(',') : null
const R = {}
const rec = (id, v) => { R[id] = v; console.log(id, JSON.stringify(v).slice(0, 1500)) }
const errAt = () => errs.length
async function caseRun(id, fn) {
  if (ONLY && !ONLY.includes(id)) return
  const e0 = errAt()
  try { await fn() } catch (e) { rec(id + '_exception', String(e).slice(0, 400)) }
  if (errAt() > e0) rec(id + '_pageerrors', errs.slice(e0))
}
const shot = (name, opts = {}) => page.screenshot({ path: OUT + name, ...opts })

// TC-037-03 Research node labels
await caseRun('TC03', async () => {
  await SURFACES.research(); await wait(600)
  const out = {}
  for (const s of [100, 90, 110, 125]) {
    await setScale(s); await wait(300)
    await install()
    out[s] = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('.rs-node-label')]
      const ref = labels[0]
      const fs = parseFloat(getComputedStyle(ref).fontSize)
      const ctm = ref.getScreenCTM()
      const dys = labels.flatMap((l) => [...l.querySelectorAll('tspan')].slice(1).map((t) => t.getAttribute('dy')))
      const texts = new Set(labels.flatMap((l) => [...l.querySelectorAll('tspan')].map((t) => t.textContent.trim().slice(0, 24))))
      const all = window.__probe.clipped('body')
      const ov = all.filter((b) => b.startsWith('textoverlap'))
      const ovLabel = ov.filter((b) => [...texts].some((t) => b.includes('"' + t + '"')))
      let outside = []
      for (const l of labels) {
        const svg = l.ownerSVGElement.getBoundingClientRect(), r = l.getBoundingClientRect()
        if (r.left < svg.left - 0.5 || r.right > svg.right + 0.5 || r.top < svg.top - 0.5 || r.bottom > svg.bottom + 0.5) outside.push(l.textContent.slice(0, 30) + ' ' + [r.left, r.right, r.top, r.bottom].map(Math.round) + ' svg ' + [svg.left, svg.right, svg.top, svg.bottom].map(Math.round))
      }
      return { refText: ref.textContent, labels: labels.length, fs, ctmScale: ctm.a, rendered: Math.round(fs * ctm.a * 1000) / 1000, dys: [...new Set(dys)], dyCount: dys.length, textoverlap: ov, textoverlapLabels: ovLabel.length, clippedAll: all.length, outside }
    })
    if (s === 125) await shot('tc03-research-125.png')
  }
  rec('TC03', out)
  await setScale(100)
})

// TC-037-04 Overlay dialogs with .hud-menu-wrap measured
const scrollAll = (sel) => page.evaluate((sel) => {
  const root = document.querySelector(sel); if (!root) return 0
  let n = 0
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const cs = getComputedStyle(el)
    if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) { el.scrollTop = el.scrollHeight; n++ }
  }
  return n
}, sel)
await caseRun('TC04', async () => {
  const dialogs = { settings: SURFACES.settings, pause: SURFACES.pause, pauseSettings: SURFACES.pauseSettings, balance: SURFACES.balance }
  const out = {}
  for (const [name, reach] of Object.entries(dialogs)) {
    await reach(); await wait(400)
    out[name] = {}
    for (const s of SCALES) {
      await setScale(s); await wait(300); await installNoWrap()
      out[name][s] = await page.evaluate(() => [document.querySelectorAll('.hud-menu-wrap').length, window.__probe.clipped('.hud-menu-wrap')])
    }
    const scrolled = await scrollAll('.hud-menu-wrap'); await wait(200); await installNoWrap()
    out[name]['125-scrolled'] = { scrolledRegions: scrolled, entries: await page.evaluate(() => window.__probe.clipped('.hud-menu-wrap')) }
    await page.evaluate(() => document.querySelectorAll('.hud-menu-wrap *').forEach((e) => { if (e.scrollTop) e.scrollTop = 0 }))
    await shot('tc04-' + name + '-125.png')
    await setScale(100)
  }
  rec('TC04', out)
})

// TC-037-05 Recruitment Market
await caseRun('TC05', async () => {
  await SURFACES.market()
  const out = { present: await page.evaluate(() => !!document.querySelector('.ts-recruit-overlay')) }
  for (const s of SCALES) {
    await setScale(s); await wait(300); await install()
    out[s] = await page.evaluate(() => window.__probe.clipped('.ts-recruit-overlay'))
  }
  out.scrolledRegions = await scrollAll('.ts-recruit-overlay'); await wait(200); await install()
  out['125-scrolled'] = await page.evaluate(() => window.__probe.clipped('.ts-recruit-overlay'))
  out.ellipsisText = await page.evaluate(() => (document.querySelector('.ts-recruit-overlay')?.innerText || '').includes('…'))
  await page.evaluate(() => document.querySelectorAll('.ts-recruit-overlay *').forEach((e) => { if (e.scrollTop) e.scrollTop = 0 }))
  await shot('tc05-market-125.png')
  await setScale(100)
  rec('TC05', out)
})

// TC-037-06 Page-level sideways scroll
await caseRun('TC06', async () => {
  const out = {}
  for (const name of ['menu', 'settings', 'research', 'brief', 'team', 'debrief', 'mission', 'pause', 'balance', 'world', 'market']) {
    await SURFACES[name](); await wait(400)
    out[name] = {}
    for (const s of SCALES) {
      await setScale(s); await wait(300)
      out[name][s] = await page.evaluate(() => { window.scrollTo(10000, 0); return [document.documentElement.scrollWidth, document.body.scrollWidth, window.scrollX] })
    }
    await setScale(100)
  }
  const bad = []
  for (const [n, v] of Object.entries(out)) for (const [s, a] of Object.entries(v)) if (a[0] > 1280 || a[1] > 1280 || a[2] !== 0) bad.push(n + '@' + s + ' ' + a)
  rec('TC06', { bad, max: Math.max(...Object.values(out).flatMap((v) => Object.values(v).flatMap((a) => [a[0], a[1]]))), maxScrollX: Math.max(...Object.values(out).flatMap((v) => Object.values(v).map((a) => a[2]))), out })
})

// TC-037-08 Settings from Pause: focus enters, Tab stays inside
await caseRun('TC08', async () => {
  await SURFACES.team(); await wait(900)
  await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission())
  await wait(6000)
  await store(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().setPaused(true))
  await wait(500)
  const out = { start: await active() }
  await page.locator('button[aria-label="Open settings"]').focus()
  await page.keyboard.press('Enter'); await wait(400)
  const SEL = '.hud-menu-wrap[aria-label="Settings"]'
  out.afterOpen = await active(); out.afterOpenInside = await inside(SEL)
  out.afterOpenTag = await page.evaluate(() => document.activeElement?.tagName)
  const tab = [], stab = []
  for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); tab.push(await inside(SEL)) }
  out.tabLast = await active()
  for (let i = 0; i < 30; i++) { await page.keyboard.press('Shift+Tab'); stab.push(await inside(SEL)) }
  out.stabLast = await active()
  out.tabInside = tab.filter(Boolean).length; out.stabInside = stab.filter(Boolean).length
  out.tabOutIdx = tab.map((v, i) => v ? null : i).filter((x) => x !== null)
  out.stabOutIdx = stab.map((v, i) => v ? null : i).filter((x) => x !== null)
  rec('TC08', out)
})

// TC-037-12 Debrief note (hand-walk per R3 ordering defect)
await caseRun('TC12', async () => {
  await SURFACES.team(); await wait(900)
  await store(async () => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    useTutorialStore.setState({ seen: useTutorialStore.getState().seen.filter((x) => x !== 'hint-debrief-research') })
  })
  const seenBefore = await store(async () => (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().seen.includes('hint-debrief-research'))
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
  const und = page.locator('button[aria-label^="UNDERSTOOD // DISMISS THE RESEARCH PROMPT"]')
  const out = { seenBeforeOutcome: seenBefore, noteCount: await und.count() }
  if (out.noteCount) {
    await shot('tc12-debrief-note.png')
    await und.focus(); out.focusedBefore = await active()
    await page.keyboard.press('Enter'); await wait(300)
    out.after = await active()
    out.afterTag = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 160))
    out.noteGone = (await und.count()) === 0
  }
  rec('TC12', out)
})

// TC-037-13 Mouse open, on-screen close
await caseRun('TC13', async () => {
  const out = {}
  await SURFACES.pause()
  await page.locator('button[aria-label="Open settings"]').click(); await wait(400)
  const sc = page.locator('.hud-menu-wrap[aria-label="Settings"] .hud-menu-actions button', { hasText: /^CLOSE$/ })
  out.s1closeCount = await sc.count()
  await sc.first().focus(); await page.keyboard.press('Enter'); await wait(400)
  out.s1 = await active()
  await SURFACES.balance()
  const bc = page.locator('.balance-panel button', { hasText: /^CLOSE$/ })
  out.s2closeCount = await bc.count()
  await bc.first().focus(); await page.keyboard.press('Enter'); await wait(400)
  out.s2 = await active()
  await SURFACES.team(); await wait(900)
  await page.locator('button[aria-label*="OPEN THE RECRUITMENT MARKET"]').first().click(); await wait(400)
  out.s3inside = await inside('.ts-recruit')
  out.s3open = await active()
  await page.locator('button[aria-label="CLOSE THE RECRUITMENT MARKET"]').focus(); await page.keyboard.press('Enter'); await wait(400)
  out.s3gone = await page.evaluate(() => !document.querySelector('.ts-recruit'))
  out.s3 = await active()
  rec('TC13', out)
})

// TC-037-15 Reduced motion on every other overlay
const armFirst = (sels) => page.evaluate((sels) => {
  window.__first = null
  const read = () => {
    const roots = sels.map((s) => document.querySelector(s)).filter(Boolean)
    if (roots.length < sels.length) return false
    const t = performance.now()
    window.__first = {
      reduceClass: document.documentElement.classList.contains('s-reduce-motion'),
      roots: roots.map((r, i) => {
        const panel = r.querySelector('.hud-menu-panel, .wm-onboard, .ts-recruit') || r
        const desc = [r, ...r.querySelectorAll('*')]
        const anims = desc.flatMap((e) => e.getAnimations().map((a) => ({ name: a.animationName || a.constructor.name, cls: (e.getAttribute('class') || e.tagName) + ' < ' + (e.parentElement?.getAttribute('class') || e.parentElement?.tagName), props: (a.effect?.getKeyframes() || []).flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))) })))
        const opAnims = anims.filter((a) => a.props.some((p) => /opacity|transform|translate|scale/.test(p)))
        return { sel: sels[i], rootAnim: getComputedStyle(r).animationName, rootOpacity: getComputedStyle(r).opacity, panelCls: String(panel.className), panelAnim: getComputedStyle(panel).animationName, panelOpacity: getComputedStyle(panel).opacity, opacityOrTransformAnims: opAnims }
      }),
      at: t,
    }
    return true
  }
  window.__t0 = performance.now()
  if (read()) return
  const mo = new MutationObserver(() => { if (read()) mo.disconnect() })
  mo.observe(document.body, { childList: true, subtree: true })
}, sels)
const getFirst = async () => { await wait(300); return page.evaluate(() => window.__first ? { ...window.__first, msAfterArm: Math.round(window.__first.at - window.__t0) } : null) }
await caseRun('TC15', async () => {
  const out = {}
  // 1 Pause
  await SURFACES.team(); await wait(900); await setRM(true)
  await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission())
  await wait(6000)
  await armFirst(['.hud-menu-wrap[aria-label="Mission paused"]']); await page.keyboard.press('Escape'); out.pause = await getFirst()
  // 2 Settings from Pause
  await armFirst(['.hud-menu-wrap[aria-label="Settings"]']); await page.locator('button[aria-label="Open settings"]').click(); out.pauseSettings = await getFirst()
  // 3 Balance
  await fresh()
  await store(async () => {
    const t = await import('/src/state/telemetry.ts')
    t.saveRecords([{ at: Date.now() - 60000, missionId: 'm03', outcome: 'aborted', durationSec: 42, seed: 7, squadRoles: ['assault'] }])
    const { useAppStore } = await import('/src/state/appStore.ts'); useAppStore.getState().goto('menu')
  })
  await page.reload(); await wait(1500); await setRM(true); await wait(200)
  await page.locator('button', { hasText: 'SETTINGS' }).first().click(); await wait(400)
  await armFirst(['.balance-panel']); await page.locator('button[aria-label="Open the balance dashboard"]').click(); out.balance = await getFirst()
  out.balanceWrap = await page.evaluate(() => { const w = document.querySelector('.balance-panel')?.closest('.hud-menu-wrap'); return w ? { anim: getComputedStyle(w).animationName, opacity: getComputedStyle(w).opacity } : null })
  // 4 Market
  await SURFACES.team(); await wait(900); await setRM(true); await wait(200)
  await armFirst(['.ts-recruit-overlay', '.ts-recruit']); await page.locator('button[aria-label*="OPEN THE RECRUITMENT MARKET"]').first().click(); out.market = await getFirst()
  // 5 World first-visit card
  await fresh(); await setRM(true)
  await store(async () => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    useTutorialStore.setState({ seen: useTutorialStore.getState().seen.filter((x) => x !== 'hint-worldmap') })
  })
  await armFirst(['.wm-onboard-wrap'])
  await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().goto('world'))
  out.world = await getFirst()
  rec('TC15', out)
})

// TC-037-17 Check glyph under reduced motion, grayscale
await caseRun('TC17', async () => {
  await fresh(); await setRM(true)
  await store(async () => {
    const { useResearchStore } = await import('/src/state/researchStore.ts')
    const s = useResearchStore.getState()
    useResearchStore.setState({ done: [...s.done, 'b-propellants'] })
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('research')
  })
  await wait(600)
  const out = await page.evaluate(() => {
    const probe = document.createElement('span'); probe.style.color = 'var(--green)'; document.body.appendChild(probe)
    const green = getComputedStyle(probe).color; probe.remove()
    const res = [...document.querySelectorAll('.rs-node.researched')].map((n) => {
      const d = n.querySelector('.rs-node-done'); const r = d?.getBoundingClientRect()
      return { label: n.querySelector('.rs-node-label')?.textContent, done: !!d, w: r && Math.round(r.width * 10) / 10, h: r && Math.round(r.height * 10) / 10, color: d && getComputedStyle(d).color }
    })
    const unres = [...document.querySelectorAll('.rs-node:not(.researched)')]
    return { reduceClass: document.documentElement.classList.contains('s-reduce-motion'), greenVar: getComputedStyle(document.documentElement).getPropertyValue('--green').trim(), green, researched: res, unresearched: unres.length, unresWithDone: unres.filter((n) => n.querySelector('.rs-node-done')).length }
  })
  const box = await page.evaluate(() => {
    const n = document.querySelector('.rs-node.researched'); const svg = n.ownerSVGElement.getBoundingClientRect()
    return { x: Math.max(0, svg.left), y: Math.max(0, svg.top), width: Math.min(svg.width, 1280 - svg.left), height: Math.min(svg.height, 720 - svg.top) }
  })
  await page.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)' })
  await wait(200)
  await shot('tc17-research-grayscale.png', { clip: box })
  await page.evaluate(() => { document.documentElement.style.filter = '' })
  rec('TC17', out)
})

// TC-037-19 Settings segments and toggles
await caseRun('TC19', async () => {
  await SURFACES.menu(); await setRM(true); await wait(400)
  await page.locator('button', { hasText: 'SETTINGS' }).first().click(); await wait(400)
  const out = await page.evaluate(() => {
    const rd = (b) => { const cs = getComputedStyle(b); return { text: b.textContent.trim().slice(0, 24), aria: b.getAttribute('aria-pressed'), label: (b.getAttribute('aria-label') || '').slice(0, 40), cls: b.className, color: cs.color, bw: cs.borderTopWidth, bs: cs.borderTopStyle, bc: cs.borderTopColor } }
    return { reduceClass: document.documentElement.classList.contains('s-reduce-motion'), selSegs: [...document.querySelectorAll('.set-scale-btn[aria-pressed="true"]')].map(rd), unselSegs: [...document.querySelectorAll('.set-scale-btn[aria-pressed="false"]')].slice(0, 3).map(rd), toggles: [...document.querySelectorAll('.set-toggle-btn')].map(rd) }
  })
  await page.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)' })
  await wait(200)
  await shot('tc19-settings-grayscale.png')
  await page.evaluate(() => { document.documentElement.style.filter = '' })
  rec('TC19', out)
})

// TC-037-20 Debrief rows under reduced motion (and, for Notes, with it off)
const dbRows = async () => {
  await page.waitForSelector('.db-filing', { timeout: 20000 })
  const first = await page.evaluate(() => [...document.querySelectorAll('.db-row')].map((r) => ({ anims: r.getAnimations().map((a) => ({ name: a.animationName, dur: a.effect.getTiming().duration, kf: a.effect.getKeyframes().map((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))) })), rect: (({ x, y }) => ({ x, y }))(r.getBoundingClientRect()) })))
  await wait(2500)
  const end = await page.evaluate(() => [...document.querySelectorAll('.db-row')].map((r) => ({ rect: (({ x, y }) => ({ x, y }))(r.getBoundingClientRect()), opacity: getComputedStyle(r).opacity, running: r.getAnimations().length })))
  return { rows: first.length, first: first.slice(0, 3), firstAnimsAll: [...new Set(first.flatMap((f) => f.anims.map((a) => a.name + ':' + a.dur + ':' + a.kf.flat().join('/'))))], end: end.slice(0, 3), finalOpacities: [...new Set(end.map((e) => e.opacity))] }
}
const reachDebriefNoWait = async (rm) => {
  await SURFACES.team(); await wait(900); await setRM(rm); await wait(200)
  await store(async () => {
    const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
    const applyKey = useAppStore.getState().lastAppliedKey + 1
    useAppStore.getState().setOutcome(settleOutcome({
      applyKey, won: true, kills: 2, casualties: 0, timeSec: 180, civiliansHit: 0,
      reward: 85000, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false,
    }))
  })
}
await caseRun('TC20', async () => {
  await reachDebriefNoWait(true)
  const rm = await dbRows()
  rm.reduceClass = await page.evaluate(() => document.documentElement.classList.contains('s-reduce-motion'))
  await reachDebriefNoWait(false)
  const normal = await dbRows()
  rec('TC20', { reducedMotion: rm, motionOn: normal })
})

rec('pageerrors_total', errs)
writeFileSync(OUT + (ONLY ? 'if037-output-' + ONLY.join('-') + '.json' : 'if037-output.json'), JSON.stringify(R, null, 2))
await browser.close()
