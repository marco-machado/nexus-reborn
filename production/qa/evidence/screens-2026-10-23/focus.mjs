// Focus probe, 2026-10-23 (same harness as sweep.mjs): the measured base for the UX specs of Research,
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


// Focus / motion / non-colour checks for the deltas the five screen specs
// found (2026-10-23): P-05 restore and trap, Escape, focus after the Debrief
// note, the researched-node check glyph, the overlay fade under reduced
// motion, the Settings selected-segment frame.
let fails = 0
const check = (name, ok, detail = '') => { if (!ok) fails++; note(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' // ' + detail : ''}`) }
const active = () => page.evaluate(() => {
  const el = document.activeElement
  return el ? (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 60) : null
})
const inside = (sel) => page.evaluate((sel) => !!document.activeElement?.closest(sel), sel)

// 1. Pause -> Settings -> close: focus back on SETTINGS.
await fresh()
await store(async () => {
  const { useAppStore } = await import('/src/state/appStore.ts')
  useAppStore.getState().selectMission('m03'); useAppStore.getState().goto('team')
})
await wait(900)
await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission())
await wait(6000)
await store(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().setPaused(true))
await wait(500)
check('Pause opens with focus on RESUME', (await active()) === 'RESUME', String(await active()))
await page.locator('button[aria-label="Open settings"]').click()
await wait(400)
await page.keyboard.press('Escape')
await wait(400)
check('closing Settings from Pause returns focus to SETTINGS', (await active()) === 'Open settings', String(await active()))
await setScale(100)

// 2. Menu Settings -> Balance -> close: focus back on OPEN; trap inside Balance.
await fresh()
await store(async () => {
  const t = await import('/src/state/telemetry.ts')
  t.saveRecords([{ at: Date.now(), missionId: 'm03', outcome: 'aborted', durationSec: 12, seed: 1, squadRoles: ['assault'] }])
  const { useAppStore } = await import('/src/state/appStore.ts')
  useAppStore.getState().goto('menu')
})
await page.reload(); await wait(1500)
await page.locator('button', { hasText: 'SETTINGS' }).first().click()
await wait(400)
const balBtn = page.locator('button[aria-label="Open the balance dashboard"]')
if (await balBtn.count()) {
  await balBtn.click(); await wait(400)
  check('Balance takes focus inside its panel', await inside('.balance-panel'), String(await active()))
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab')
  check('Tab stays inside Balance', await inside('.balance-panel'), String(await active()))
  await page.keyboard.press('Escape'); await wait(400)
  check('closing Balance returns focus to its OPEN control', (await active()) === 'Open the balance dashboard', String(await active()))
} else check('Balance entry visible with a seeded record', false, 'no OPEN control')
// Selected segment: teal + 2px frame, not amber.
const seg = await page.evaluate(() => {
  const b = document.querySelector('.set-scale-btn[aria-pressed="true"]')
  if (!b) return null
  const cs = getComputedStyle(b)
  return { cls: b.className, color: cs.color, border: cs.borderTopWidth + ' ' + cs.borderTopStyle }
})
check('selected segment is framed teal, not amber', seg && /\bsel\b/.test(seg.cls) && !/\bamber\b/.test(seg.cls) && seg.border === '2px solid' && seg.color === 'rgb(126, 240, 212)', JSON.stringify(seg))

// 3. Recruitment Market: focus in, Tab wraps, Escape closes, focus returns.
await fresh()
await store(async () => {
  const { useAppStore } = await import('/src/state/appStore.ts')
  useAppStore.getState().selectMission('m03'); useAppStore.getState().goto('team')
})
await wait(900)
const opener = page.locator('button[aria-label*="OPEN THE RECRUITMENT MARKET"]').first()
await opener.focus(); await page.keyboard.press('Enter'); await wait(400)
check('Recruitment Market takes focus', await inside('.ts-recruit'), String(await active()))
for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')
check('Tab stays inside the Recruitment Market', await inside('.ts-recruit'), String(await active()))
await page.keyboard.press('Escape'); await wait(400)
const gone = await page.evaluate(() => !document.querySelector('.ts-recruit'))
check('Escape closes the Recruitment Market', gone)
check('focus returns to the RECRUIT control', ((await active()) || '').includes('OPEN THE RECRUITMENT MARKET'), String(await active()))

// 4. Debrief research note: UNDERSTOOD -> focus on RETURN TO WORLD NETWORK.
await fresh()
await store(async () => {
  const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
  useTutorialStore.setState({ seen: useTutorialStore.getState().seen.filter((x) => x !== 'hint-debrief-research') })
})
await SURFACES.debrief()
const und = page.locator('button[aria-label^="UNDERSTOOD // DISMISS THE RESEARCH PROMPT"]')
if (await und.count()) {
  await und.focus(); await page.keyboard.press('Enter'); await wait(300)
  check('after UNDERSTOOD focus is on RETURN TO WORLD NETWORK', (await active()) === 'RETURN TO WORLD NETWORK', String(await active()))
} else check('Debrief research note shows on the first Debrief', false, 'no note')
// 4b. Balance from the Debrief: Escape closes it and focus returns to BALANCE DATA.
await store(async () => {
  const t = await import('/src/state/telemetry.ts')
  t.saveRecords([{ at: Date.now(), missionId: 'm03', outcome: 'aborted', durationSec: 12, seed: 1, squadRoles: ['assault'] }])
})
await wait(400)
const balDb = page.locator('button[aria-label^="BALANCE DATA"]')
if (await balDb.count()) {
  await balDb.focus(); await page.keyboard.press('Enter'); await wait(400)
  check('Balance from the Debrief takes focus', await inside('.balance-panel'), String(await active()))
  await page.keyboard.press('Escape'); await wait(300)
  const closed = await page.evaluate(() => !document.querySelector('.balance-panel'))
  check('Escape closes Balance on the Debrief and focus returns to BALANCE DATA', closed && ((await active()) || '').startsWith('BALANCE DATA'), String(await active()))
} else check('BALANCE DATA shows on the Debrief with a record', false, 'no control')
// 4c. The invoice is a named scroll region with the P-15 fade element.
const inv = await page.evaluate(() => {
  const r = document.querySelector('.scroll.db-rows')
  return r ? { role: r.getAttribute('role'), label: r.getAttribute('aria-label'), fade: !!r.parentElement.querySelector('.scroll-fade') } : null
})
check('invoice is a named scroll region with the cut-edge fade', inv && inv.role === 'region' && inv.label === 'Mission invoice' && inv.fade, JSON.stringify(inv))

// 5. Research: a researched node carries the check glyph.
await fresh()
await store(async () => {
  const { useResearchStore } = await import('/src/state/researchStore.ts')
  const s = useResearchStore.getState()
  useResearchStore.setState({ done: [...s.done, 'b-propellants'] })
  const { useAppStore } = await import('/src/state/appStore.ts')
  useAppStore.getState().goto('research')
})
await wait(600)
const done = await page.evaluate(() => [...document.querySelectorAll('.rs-node.researched')].map((n) => !!n.querySelector('.rs-node-done')))
check('every researched node draws the check glyph', done.length > 0 && done.every(Boolean), JSON.stringify(done))

// 6. Reduced motion: overlays print, they do not fade.
await fresh()
await store(async () => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setReducedMotion(true)
  const { useAppStore } = await import('/src/state/appStore.ts')
  useAppStore.getState().goto('menu')
})
await wait(300)
await page.locator('button', { hasText: 'SETTINGS' }).first().click()
await wait(100)
const anim = await page.evaluate(() => { const w = document.querySelector('.hud-menu-wrap'); return w ? getComputedStyle(w).animationName : 'no overlay' })
check('reduced motion: the overlay has no fade-in', anim === 'none', anim)

note(fails ? `FAILED ${fails}` : 'ALL PASS')
writeFileSync(OUT + 'focus-output.txt', log.join('\n') + '\n')
await browser.close()
process.exit(fails ? 1 : 0)
