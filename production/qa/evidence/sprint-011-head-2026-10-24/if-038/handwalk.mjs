// IF-038 hand-walk, Sprint 11 HEAD 131a5c1, 2026-10-24. Helpers, fresh() and SURFACES
// copied verbatim from production/qa/evidence/screens-2026-10-23/sweep.mjs (R2);
// debriefkia from playtest-fixes-2026-10-23/sweep.mjs (R4); R1 states from sprint-011/probe.mjs.
// Run (dev server already on :4200): PROBE_OUT=<this dir>/ node <this dir>/handwalk.mjs
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


/* ---------------- IF-038 additions ---------------- */
const res = {}
const put = (k, v) => { res[k] = v; console.log(k, JSON.stringify(v)) }
const shot = (n) => page.screenshot({ path: `${OUT}${n}.png` })

// R4 debriefkia, verbatim body.
SURFACES.debriefkia = async () => {
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
}

// R1 probe fresh / states (sprint-011/probe.mjs), verbatim logic.
async function r1fresh() {
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
const dismissCard = () => store(async () => { (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().markSeen('hint-worldmap') })
const pause = () => store(async () => { (await import('/src/state/worldStore.ts')).useWorldStore.setState({ paused: true }) })
const R1 = {
  opening: async () => { await r1fresh(); await dismissCard(); await pause() },
  failed: async () => { await R1.opening(); await store(async () => { (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ campaignFailed: true }) }) },
  'influence-note': async () => {
    await r1fresh(); await dismissCard(); await pause()
    await store(async () => { (await import('/src/state/worldStore.ts')).useWorldStore.setState({ influence: 8, selected: 'na' }) })
  },
}

// R2 labelInName expression, verbatim.
const LIN = () => [...document.querySelectorAll('button, a[href], [role="button"], [role="slider"]')].filter(window.__probe.visible).flatMap((el) => {
  const label = el.getAttribute('aria-label')
  const first = (el.innerText || '').split('\n').map((x) => x.trim()).find((x) => /[A-Za-z]/.test(x) && x.length > 1)
  if (!label || !first) return []
  const norm = (x) => ' ' + x.toUpperCase().replace(/[^A-Z0-9%]+/g, ' ').trim() + ' '
  return norm(label).includes(norm(first)) ? [] : [first.slice(0, 30) + ' => ' + label.slice(0, 50)]
})
const lin = async () => { await install(); return page.evaluate(LIN) }

// Controls by aria-label regex: every visible match, its first visible line, and starts-with.
const controls = (pairs) => page.evaluate((pairs) => pairs.map(([name, src]) => {
  const re = new RegExp(src)
  const norm = (x) => x.toUpperCase().replace(/[^A-Z0-9%]+/g, ' ').trim()
  const els = [...document.querySelectorAll('button, a[href], [role="button"], [role="slider"]')].filter((el) => window.__probe.visible(el) && re.test(el.getAttribute('aria-label') || ''))
  return { name, found: els.length, rows: els.map((el) => {
    const label = el.getAttribute('aria-label')
    const first = (el.innerText || '').split('\n').map((x) => x.trim()).find((x) => /[A-Za-z]/.test(x) && x.length > 1) || ''
    return { label, first, starts: !!first && (norm(label) + ' ').startsWith(norm(first) + ' '), disabled: el.disabled === true }
  }) }
}), pairs)

const rect = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].filter(window.__probe.visible).map((el) => { const r = el.getBoundingClientRect(); return { l: +r.left.toFixed(1), r: +r.right.toFixed(1), t: +r.top.toFixed(1), b: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) } }), sel)
const inter = (a, b) => (a && b) ? { w: Math.round((Math.min(a.r, b.r) - Math.max(a.l, b.l)) * 10) / 10, h: Math.round((Math.min(a.b, b.b) - Math.max(a.t, b.t)) * 10) / 10 } : null
const hits = (i) => !!i && i.w > 2 && i.h > 2

const step = async (name, fn) => { try { await fn() } catch (e) { put(name + '.ERROR', String(e).split('\n')[0]) } }

// IF-038-01 presence in R2 world state
await step('01', async () => {
  await SURFACES.world(); await wait(500); await install()
  put('01.lin', await lin())
  put('01.controls', await controls([['UNDERSTOOD orientation', '^UNDERSTOOD // DISMISS THE ORIENTATION$'], ['n UNREAD', '^2 UNREAD']]))
})
// IF-038-02 influence note
await step('02', async () => {
  await R1['influence-note'](); await wait(500); await install()
  put('02.controls', await controls([['UNDERSTOOD influence', '^UNDERSTOOD // DISMISS THE INFLUENCE NOTE$']]))
  put('02.momentBtn', await page.evaluate(() => [...document.querySelectorAll('.wm-moment-btn')].map((e) => ({ vis: window.__probe.visible(e), label: e.getAttribute('aria-label') }))))
  put('02.lin', await lin())
  await shot('if-038-02-influence-note')
})
// IF-038-03 team presence + 04 empty roster
await step('03', async () => {
  await SURFACES.team(); await wait(900); await install()
  put('03.lin', await lin())
  put('03.controls', await controls([['RECRUIT +', '^RECRUIT \\+'], ['Item slots', '// ITEM SLOT \\d+ // CYCLE$'], ['DEPLOY TEAM', '^DEPLOY TEAM // ']]))
  await store(async () => { (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ operatives: [] }) })
  await wait(400); await install()
  put('04.tsNone', await page.evaluate(() => { const n = document.querySelector('.ts-none'); return n ? { vis: window.__probe.visible(n), text: n.innerText.slice(0, 80), btn: [...n.querySelectorAll('button.cta')].map((b) => ({ label: b.getAttribute('aria-label'), text: b.innerText.trim() })) } : null }))
  put('04.controls', await controls([['RECRUIT >>', '^RECRUIT // OPEN THE RECRUITMENT MARKET$']]))
  put('04.lin', await lin())
  await shot('if-038-04-roster-empty')
})
await step('05', async () => {
  await SURFACES.research(); await wait(800); await install()
  put('05.lin', await lin())
  put('05.controls', await controls([['AUTHORIZE PROJECT', '^AUTHORIZE PROJECT // ']]))
})
await step('06', async () => {
  await SURFACES.settings(); await wait(600); await install()
  put('06.lin', await lin())
  put('06.controls', await controls([['RESET ALL', '^RESET ALL // EVERY CONTROL TO ITS DEFAULT KEY$'], ['Quality segments', '^(AUTO|HIGH|MED|LOW) // RENDER QUALITY ']]))
})
await step('07', async () => {
  await SURFACES.balance(); await wait(500); await install()
  put('07.lin', await lin())
  put('07.controls', await controls([['EXPORT JSON', '^EXPORT JSON // THE TELEMETRY RECORDS$']]))
})
// IF-038-08 R2 debrief state, then fallback with the research note unseen; 09 with a record.
await step('08', async () => {
  await SURFACES.debrief(); await wait(500); await install()
  put('08.r2state.lin', await lin())
  put('08.r2state.controls', await controls([['OPEN RESEARCH', '^OPEN RESEARCH // THE RESEARCH TAB$'], ['UNDERSTOOD research', '^UNDERSTOOD // DISMISS THE RESEARCH PROMPT$']]))
  // fallback: team, un-mark hint-debrief-research, then settle the outcome (no fresh() in between)
  await SURFACES.team(); await wait(900)
  await store(async () => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    useTutorialStore.setState({ seen: useTutorialStore.getState().seen.filter((x) => x !== 'hint-debrief-research') })
    const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
    const applyKey = useAppStore.getState().lastAppliedKey + 1
    useAppStore.getState().setOutcome(settleOutcome({ applyKey, won: true, kills: 2, casualties: 0, timeSec: 180, civiliansHit: 0, reward: 85000, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false }))
  })
  await page.waitForSelector('.db-filing', { timeout: 20000 }); await wait(1800); await install()
  put('08.fallback.controls', await controls([['OPEN RESEARCH', '^OPEN RESEARCH // THE RESEARCH TAB$'], ['UNDERSTOOD research', '^UNDERSTOOD // DISMISS THE RESEARCH PROMPT$']]))
  put('08.fallback.lin', await lin())
  await shot('if-038-08-debrief-note')
})
await step('09', async () => {
  await SURFACES.debrief(); await wait(300)
  await store(async () => { (await import('/src/state/telemetry.ts')).saveRecords([{ at: Date.now(), missionId: 'm03', outcome: 'aborted', durationSec: 12, seed: 1, squadRoles: ['assault'] }]) })
  await wait(400); await install()
  put('09.controls', await controls([['BALANCE DATA', '^BALANCE DATA // OPEN THE DASHBOARD OVER THE LOCAL MISSION LOG$']]))
  put('09.lin', await lin())
  await shot('if-038-09-balance-data')
})
await step('10', async () => {
  await SURFACES.mission(); await install()
  put('10.controls', await controls([['SKIP TUTORIAL', '^SKIP TUTORIAL // SKIP THE WHOLE TUTORIAL$']]))
  put('10.toastBtn', await page.evaluate(() => [...document.querySelectorAll('button.hud-toast-btn')].map((b) => ({ vis: window.__probe.visible(b), label: b.getAttribute('aria-label') }))))
  // IF-038-20 step 3: shared parent
  put('20.parents', await page.evaluate(() => {
    const t = document.querySelector('.hud-toasts'), w = document.querySelector('.hud-weapons'), c = document.querySelector('.hud-comms')
    const p = (e) => e ? (e.parentElement.className || e.parentElement.tagName) : null
    return { toasts: !!t, weapons: !!w, comms: !!c, toastsParent: p(t), weaponsParent: p(w), commsParent: p(c), toastsWeapons: !!t && !!w && t.parentElement === w.parentElement, commsWeapons: !!c && !!w && c.parentElement === w.parentElement,
      pos: [t, w, c].map((e) => e ? getComputedStyle(e).position : null) }
  }))
  const direct = {}
  for (const s of SCALES) {
    await setScale(s); await wait(300); await install()
    const [t] = await rect('.hud-toasts'), [w] = await rect('.hud-weapons'), [c] = await rect('.hud-comms')
    direct[s] = { toasts: t, weapons: w, comms: c, toastsXweapons: inter(t, w), commsXweapons: inter(c, w) }
  }
  await setScale(100)
  put('20.direct1280', direct)
})
// IF-038-15 invoice fade at 125 on debriefkia
await step('15', async () => {
  await SURFACES.debriefkia(); await setScale(125); await wait(400); await install()
  const st = () => page.evaluate(() => { const s = document.querySelector('.scroll.db-rows'); const f = s && s.parentElement.querySelector('.scroll-fade'); return s ? { sh: s.scrollHeight, ch: s.clientHeight, top: s.scrollTop, tab: s.tabIndex, role: s.getAttribute('role'), label: s.getAttribute('aria-label'), fade: f ? f.className : null } : null })
  const s0 = await st(); put('15.top', s0); await shot('if-038-15-fade-on')
  // Tab reachability: tab from body until the region is focused
  await page.evaluate(() => document.activeElement?.blur?.())
  let reached = false
  for (let i = 0; i < 30 && !reached; i++) { await page.keyboard.press('Tab'); reached = await page.evaluate(() => document.activeElement?.matches?.('.scroll.db-rows') || false) }
  put('15.tabReached', reached)
  await page.focus('.scroll.db-rows'); await page.keyboard.press('End'); await wait(300)
  let s1 = await st()
  if (s1 && s1.top === 0) { await page.evaluate(() => { const s = document.querySelector('.scroll.db-rows'); s.scrollTop = s.scrollHeight }); await wait(300); s1 = await st(); s1.via = 'scrollTop' } else if (s1) s1.via = 'End'
  put('15.bottom', s1); await shot('if-038-15-fade-off')
  await setScale(100)
})
await step('16', async () => {
  await R1.failed(); await wait(500); await install()
  put('16.banner', await page.evaluate(() => [...document.querySelectorAll('.wm-campaign-fail')].map((e) => ({ vis: window.__probe.visible(e), role: e.getAttribute('role'), text: e.innerText }))))
  await shot('if-038-16-failed-banner')
})
// IF-038-18 Brief recon column
await step('18', async () => {
  await SURFACES.brief(); await wait(800)
  put('18.structure', await page.evaluate(() => { const r = document.querySelectorAll('.mb-recon-labels .mb-rright'); const rr = r[0]; return { rright: r.length, readoutsInside: rr ? rr.querySelectorAll('.mb-rreadout').length : 0, readoutsTotal: document.querySelectorAll('.mb-rreadout').length, calloutInside: rr ? rr.querySelectorAll('.mb-rcallout').length : 0, calloutTotal: document.querySelectorAll('.mb-rcallout').length } }))
  const out = {}
  for (const s of SCALES) {
    await setScale(s); await wait(300); await install()
    const bg = await page.evaluate(() => ({ rbrief: [...document.querySelectorAll('.mb-rbrief')].map((e) => getComputedStyle(e).backgroundColor), rreadout: [...document.querySelectorAll('.mb-rreadout')].map((e) => getComputedStyle(e).backgroundColor), rcallout: [...document.querySelectorAll('.mb-rcallout')].map((e) => getComputedStyle(e).backgroundColor) }))
    const [b] = await rect('.mb-rbrief'), [r] = await rect('.mb-rright')
    out[s] = { bg, rbrief: b, rright: r, intersect: inter(b, r) }
    await shot(`if-038-18-brief-recon-${s}`)
  }
  await setScale(100)
  put('18.scales', out)
})
// IF-038-19 inset tag vs steppers
await step('19', async () => {
  await R1.opening(); await wait(500)
  const one = async () => { const [t] = await rect('.wm-inset-tag'), [l] = await rect('.wm-inset-chev.l'), [r] = await rect('.wm-inset-chev.r'); const text = await page.evaluate(() => document.querySelector('.wm-inset-tag')?.innerText); return { text, tag: t, l, r, xL: inter(t, l), xR: inter(t, r) } }
  const out = {}
  for (const s of SCALES) {
    await setScale(s); await wait(300); await install()
    out[s] = { ...(await one()), clip: (await page.evaluate(() => window.__probe.clipped('.screen'))).filter((x) => x.includes('wm-inset')) }
    await shot(`if-038-19-inset-${s}`)
  }
  put('19.scales', out)
  // step through every sector at 125
  await setScale(125); await wait(300); await install()
  const seen = []
  for (let i = 0; i < 12; i++) {
    const m = await one(); m.clip = (await page.evaluate(() => window.__probe.clipped('.screen'))).filter((x) => x.includes('wm-inset'))
    if (seen.length && seen[0].text === m.text) break
    seen.push(m)
    await page.locator('.wm-inset-chev.r').click(); await wait(350)
  }
  const longest = seen.reduce((a, b) => ((b.text || '').length > (a.text || '').length ? b : a), seen[0])
  put('19.sectors125', seen.map((m) => ({ text: m.text, xL: m.xL, xR: m.xR, clip: m.clip.length, tagH: m.tag && m.tag.h })))
  put('19.longest', longest)
  await setScale(100)
})
// IF-038-23 write failure through writeSave with a throwing localStorage.setItem
const breakStorage = () => page.evaluate(() => {
  window.__origSet = window.__origSet || Storage.prototype.setItem
  Storage.prototype.setItem = function (k, v) { if (k === 'nexus-save-v1') throw new DOMException('quota (harness)', 'QuotaExceededError'); return window.__origSet.call(this, k, v) }
})
const fixStorage = () => page.evaluate(() => { if (window.__origSet) Storage.prototype.setItem = window.__origSet })
const failWrite = () => store(async () => { const save = await import('/src/state/save.ts'); const ok = save.writeSave(); const st = (await import('/src/state/saveStatusStore.ts')).useSaveStatusStore.getState(); return { ok, status: st.status, reason: st.reason } })
const readNotice = (sel) => page.evaluate((sel) => {
  const el = [...document.querySelectorAll(sel)].find(window.__probe.visible)
  if (!el) return { found: false, count: document.querySelectorAll(sel).length }
  const cs = getComputedStyle(el), b = getComputedStyle(el, '::before'), a = getComputedStyle(el, '::after')
  const run = window.__probe.runs('body').find((x) => x.el === el || el.contains(x.el))
  return { found: true, text: el.innerText, color: cs.color, border: [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor], borderW: cs.borderTopWidth, bg: cs.backgroundColor,
    before: { content: b.content, border: [b.borderTopColor, b.borderLeftColor], bg: b.backgroundColor }, after: { content: a.content, border: [a.borderTopColor, a.borderLeftColor], bg: a.backgroundColor }, ratio: run ? run.ratio : null }
}, sel)
await step('23', async () => {
  await R1.opening(); await wait(500)
  await breakStorage(); put('23.write.world', await failWrite()); await wait(300); await install()
  put('23.world', await readNotice('.write-fail-region .write-fail-notice')); await shot('if-038-23-write-fail-world')
  await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().goto('research')); await wait(600); await install()
  put('23.research', await readNotice('.write-fail-region .write-fail-notice')); await shot('if-038-23-write-fail-research')
  await fixStorage(); put('23.write.restored', await failWrite()); await wait(300)
  put('23.afterRestore', await page.evaluate(() => document.querySelectorAll('.write-fail-notice').length))
  // card variant
  await r1fresh(); await pause(); await wait(400)
  await breakStorage(); put('23.write.card', await failWrite()); await wait(300); await install()
  put('23.card', await readNotice('.wm-onboard-fail'))
  put('23.cardRegionHidden', await page.evaluate(() => { const r = document.querySelector('.write-fail-region'); return r ? { vis: window.__probe.visible(r), clipPath: getComputedStyle(r).clipPath } : null }))
  await shot('if-038-23-write-fail-card')
  await fixStorage()
  await store(async () => (await import('/src/state/saveStatusStore.ts')).useSaveStatusStore.getState().reset()); await wait(300)
  put('23.afterReset', await page.evaluate(() => document.querySelectorAll('.write-fail-notice').length))
})

// IF-038-22 comms width at 1360 and 1280
for (const W of [1360, 1280]) {
  await step('22.' + W, async () => {
    await page.setViewportSize({ width: W, height: 720 })
    await SURFACES.mission()
    const out = {}
    for (const s of SCALES) {
      await setScale(s); await wait(300); await install()
      const [c] = await rect('.hud-comms'), [w] = await rect('.hud-weapons')
      out[s] = { commsW: c && c.w, commsR: c && c.r, weaponsL: w && w.l, expected: 286 - (s / 100 - 1) * 80, ok: !!c && !!w && Math.abs(c.w - (286 - (s / 100 - 1) * 80)) <= 1 && c.r <= w.l }
      await shot(`if-038-22-comms-${W}-${s}`)
    }
    await setScale(100)
    put('22.' + W, out)
  })
}
await page.setViewportSize({ width: 1280, height: 720 })

put('errors', errs)
writeFileSync(OUT + 'handwalk.json', JSON.stringify(res, null, 1))
await browser.close()
