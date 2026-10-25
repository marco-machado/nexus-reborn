// TM-018 third pass: C2.7 drawn radius. In run.mjs the ring-a outer edge along
// projected +x fell under the tutorial toast, so this pass clears the toasts
// (SKIP TUTORIAL), arms at an unobstructed pointer and checks the red band at the
// projected 3.5 m edge along 8 world directions.
// Original header:, executed headless at
// 1280x720 in Chrome for Testing (swiftshader WebGL) against the running dev
// server. Launch pattern copied from production/qa/evidence/sprint-011/probe.mjs.
//
// Path to the mission: real clicks where the UI has them (NEW OPERATION on the
// menu, the RUST HAVEN contract, ACCEPT CONTRACT, DEPLOY TEAM). Each fallback to
// a store call is logged as ASSIST.
// Scene reads: the app's own @react-three/fiber module instance (URL taken from
// performance resource entries) and its `_roots` map.
// Run: node production/qa/evidence/sprint-011-head-2026-10-24/tm-018/run.mjs
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
const OUT = new globalThis.URL('.', import.meta.url).pathname

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const log = []
const note = (s) => { const line = typeof s === 'string' ? s : JSON.stringify(s); log.push(line); console.log(line) }
const flush = () => writeFileSync(`${OUT}radius-output.txt`, log.join('\n') + '\n\nERRORS:\n' + errs.join('\n') + '\n')
const ev = (fn, arg) => page.evaluate(fn, arg)

async function clickText(re, label) {
  const loc = page.getByText(re).first()
  if (await loc.count()) { await loc.click(); note(`CLICK ${label}`); return true }
  note(`NO-TARGET ${label}`); return false
}
// TM-019 casualty hold: press Space whenever the hold banner is up.
async function clearHold() {
  const held = await ev(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().held)
  if (held) { await page.keyboard.press('Space'); note('HOLD seen -> Space'); await wait(200) }
}
const toasts = () => ev(() => [...document.querySelectorAll('.hud-toast')].map((t) => {
  const r = t.getBoundingClientRect()
  const over = [...t.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).map((e) => e.className)
  return { text: t.innerText.replace(/\s+/g, ' ').trim(), box: [r.x, r.y, r.width, r.height].map(Math.round), inViewport: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, overflow: over }
}))

// In-page scene helpers, installed after the mission mounts.
const SCENE = async () => {
  const ent = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('@react-three_fiber'))
  if (!ent) return { ok: false, why: 'no @react-three_fiber resource entry' }
  const fib = await import(new URL(ent).pathname + new URL(ent).search)
  const roots = fib._roots
  if (!roots) return { ok: false, why: '_roots not exported', ent }
  const canvas = document.querySelector('canvas')
  const root = roots.get(canvas) || [...roots.values()][0]
  if (!root) return { ok: false, why: `_roots empty (size ${roots.size})`, ent }
  const st = () => root.store.getState()
  const V = st().camera.position.constructor
  const rt = await import('/src/game/runtime.ts')
  const P = {}
  P.st = st
  P.w = () => rt.getWorld()
  P.rt = rt
  P.project = (x, y, z) => {
    const s = st(); const v = new V(x, y, z).project(s.camera)
    const r = canvas.getBoundingClientRect()
    return { sx: r.left + (v.x + 1) / 2 * r.width, sy: r.top + (1 - v.y) / 2 * r.height, ndcZ: v.z }
  }
  P.ground = (sx, sy) => {
    const s = st(); const r = canvas.getBoundingClientRect()
    const nx = ((sx - r.left) / r.width) * 2 - 1, ny = -((sy - r.top) / r.height) * 2 + 1
    const a = new V(nx, ny, -1).unproject(s.camera), b = new V(nx, ny, 1).unproject(s.camera)
    const t = (0 - a.y) / (b.y - a.y)
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }
  }
  P.ring = () => {
    let f = null
    st().scene.traverse((o) => { if (o.isMesh && o.geometry?.type === 'RingGeometry' && Math.abs(o.geometry.parameters.outerRadius - 3.5) < 1e-6) f = o })
    return f
  }
  P.coreOf = (x, z) => {
    let core = null, rootObj = null
    st().scene.traverse((o) => {
      if (core || !o.isGroup) return
      if (Math.abs(o.position.x - x) < 0.01 && Math.abs(o.position.y) < 0.01 && Math.abs(o.position.z - z) < 0.01) {
        o.traverse((m) => {
          const p = m.geometry?.parameters
          if (!core && m.isMesh && p && Math.abs(p.width - 0.55) < 1e-6 && Math.abs(p.height - 0.22) < 1e-6 && Math.abs(p.depth - 0.55) < 1e-6 && Math.abs(m.position.y - 1.11) < 1e-6) { core = m; rootObj = o }
        })
      }
    })
    return core ? { core, root: rootObj } : null
  }
  P.coreRead = (x, z) => {
    const f = P.coreOf(x, z)
    if (!f) return null
    const c = f.core
    let worldVisible = true
    for (let n = c; n; n = n.parent) if (!n.visible) worldVisible = false
    return { visible: c.visible, worldVisible, emissiveIntensity: c.material.emissiveIntensity, emissive: c.material.emissive.getHexString(), matType: c.material.type, rigScaleY: c.parent?.scale?.y, faction: f.root.children.filter((k) => k !== c.parent).map((k) => ({ type: k.type, visible: k.visible })) }
  }
  P.relays = () => rt.getWorld().units.filter((u) => u.kind === 'device' && u.tag === 'relay').map((u) => ({ id: u.id, x: u.pos.x, z: u.pos.z, hp: u.hp, maxHp: u.maxHp, stance: u.stance }))
  window.__tm = P
  return { ok: true, ent, rootsSize: roots.size, camera: st().camera.type, fov: st().camera.fov }
}

// Pixel stats from a PNG (base64) in a square around (cx, cy).
async function patch(file, cx, cy, half = 14) {
  const b64 = (await import('fs')).readFileSync(`${OUT}${file}.png`).toString('base64')
  return ev(async ({ b64, cx, cy, half }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const d = g.getImageData(Math.round(cx - half), Math.round(cy - half), half * 2, half * 2).data
    let n = 0, sum = 0, ice = 0, maxL = 0, red = 0
    for (let i = 0; i < d.length; i += 4) {
      const [r, gg, b] = [d[i], d[i + 1], d[i + 2]]
      const L = 0.2126 * r + 0.7152 * gg + 0.0722 * b
      n++; sum += L; maxL = Math.max(maxL, L)
      if (b > 180 && gg > 170 && r < gg && b >= gg - 10) ice++ // VIP Ice #9be8ff family, bright
      if (r > 200 && gg < 150 && b < 130) red++
    }
    return { meanL: +(sum / n).toFixed(1), maxL: +maxL.toFixed(1), icePx: ice, redPx: red, px: n }
  }, { b64, cx, cy, half })
}

/* ---------------------------------- S0 ---------------------------------- */
await page.goto(URL)
await ev(() => localStorage.clear())
await page.reload()
await wait(2000)
note('S0 menu buttons: ' + JSON.stringify(await ev(() => [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).filter(Boolean).slice(0, 12))))
if (!(await clickText(/NEW OPERATION/i, 'NEW OPERATION'))) {
  await ev(async () => (await import('/src/state/save.ts')).startNewOperation()); note('ASSIST startNewOperation')
}
await wait(1500)
note('S0 phase after new op: ' + await ev(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase))
// Clear any first-visit card.
for (let i = 0; i < 3; i++) { const l = page.locator('button:visible', { hasText: /UNDERSTOOD|GOT IT/ }).or(page.locator('button[aria-label*="DISMISS"]:visible')); if (await l.count()) { const lab = await l.first().getAttribute('aria-label'); await l.first().click({ timeout: 5000 }).catch((e) => note('card click failed ' + e.message.split('\n')[0])); note('cleared card ' + lab); await wait(500) } }
await shot('s0-world')
let phase = await ev(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
if (phase === 'world') {
  const row = page.locator('button:visible, [role=button]:visible, li:visible, tr:visible').filter({ hasText: /RUST HAVEN/i }).first()
  if (await row.count()) { const lab = await row.evaluate((e) => e.tagName + ' ' + (e.getAttribute('aria-label') || e.innerText.slice(0, 60))); await row.click({ timeout: 5000 }).then(() => note('CLICK RUST HAVEN row: ' + lab)).catch((e) => note('RUST HAVEN click failed ' + e.message.split('\n')[0])) } else note('NO-TARGET RUST HAVEN row')
  await wait(1000)
  phase = await ev(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
  if (phase !== 'brief') {
    await ev(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().selectMission('m03')); note(`ASSIST selectMission(m03) (phase was ${phase})`)
    await wait(1000)
  }
}
await shot('s0-brief')
const accept = page.getByRole('button', { name: /ACCEPT CONTRACT/ })
if (await accept.count()) { await accept.first().click(); note('CLICK ACCEPT CONTRACT') } else note('NO-TARGET ACCEPT CONTRACT')
await wait(1200)
const deploy = page.getByRole('button', { name: /DEPLOY TEAM/ })
if (await deploy.count()) { await deploy.first().click(); note('CLICK DEPLOY TEAM') } else note('NO-TARGET DEPLOY TEAM')
await wait(1000)
phase = await ev(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
if (phase !== 'mission') { await ev(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission()); note(`ASSIST startMission (phase was ${phase})`) }
await wait(7000)
const ms0 = await ev(async () => { const s = (await import('/src/state/missionStore.ts')).useMissionStore.getState(); const w = (await import('/src/game/runtime.ts')).getWorld(); return { phase: (await import('/src/state/appStore.ts')).useAppStore.getState().phase, live: s.live, held: s.held, mission: w?.mission?.id, codename: w?.mission?.codename } })
note('S0 state ' + JSON.stringify(ms0))
await clearHold()
const sc = await ev(SCENE)
note('SCENE ' + JSON.stringify(sc))
flush()


const skip = page.getByRole('button', { name: /SKIP TUTORIAL/ })
if (await skip.count()) { await skip.first().click(); note('pre: SKIP TUTORIAL clicked to clear toasts') }
await page.keyboard.press('1'); await wait(300)
await page.mouse.move(600, 240); await wait(100); await page.mouse.move(640, 250); await wait(200)
await page.keyboard.press('g'); await wait(400)
await page.mouse.move(645, 252); await page.mouse.move(640, 250); await wait(300)
await clearHold()
const geo = await ev(() => {
  const P = window.__tm; const m = P.ring(); const c = P.project(m.position.x, m.position.y, m.position.z)
  const dirs = []
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4
    const o = P.project(m.position.x + 3.5 * Math.cos(a), m.position.y, m.position.z + 3.5 * Math.sin(a))
    const i = P.project(m.position.x + 3.35 * Math.cos(a), m.position.y, m.position.z + 3.35 * Math.sin(a))
    dirs.push({ deg: k * 45, outer: [o.sx, o.sy], inner: [i.sx, i.sy] })
  }
  return { visible: m.visible, pos: m.position.toArray(), ground: P.ground(640, 250), centre: [c.sx, c.sy], dirs }
})
note('ring geometry ' + JSON.stringify({ visible: geo.visible, pos: geo.pos.map((v) => +v.toFixed(3)), ground: geo.ground, centre: geo.centre.map((v) => +v.toFixed(1)) }))
await shot('ring-radius')
const res = await ev(async ({ b64, geo }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
  const g = c.getContext('2d'); g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, img.width, img.height).data
  const red = (x, y) => { const i = (Math.round(y) * img.width + Math.round(x)) * 4; return d[i] > 170 && d[i + 1] < 150 && d[i + 2] < 140 && d[i] - d[i + 1] > 60 }
  const [cx, cy] = geo.centre
  return geo.dirs.map((q) => {
    const L = Math.hypot(q.outer[0] - cx, q.outer[1] - cy); const ux = (q.outer[0] - cx) / L, uy = (q.outer[1] - cy) / L
    let last = null, first = null
    for (let t = 0; t <= L + 12; t += 0.25) if (red(cx + ux * t, cy + uy * t)) { if (first === null) first = t; last = t }
    return { deg: q.deg, projectedOuterPx: +L.toFixed(1), projectedInnerPx: +Math.hypot(q.inner[0] - cx, q.inner[1] - cy).toFixed(1), redBandPx: first === null ? null : [+first.toFixed(2), +last.toFixed(2)], outerEdgeErrPx: last === null ? null : +(last - L).toFixed(2) }
  })
}, { b64: (await import('fs')).readFileSync(`${OUT}ring-radius.png`).toString('base64'), geo })
for (const r of res) note('C2.7 ' + JSON.stringify(r))
await page.keyboard.press('g')
flush(); await browser.close(); note('done'); flush()
