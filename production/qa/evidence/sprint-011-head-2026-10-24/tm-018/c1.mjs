// TM-018 second pass: C1 (AC-2) with a fixed, unobstructed framing and no wheel input
// (default zoom); C2.7 drawn-radius rescan of ring-a.png along the projected +x axis;
// C3.3 F recenter re-read after the camera settles. First pass: run.mjs.
// Original header:, executed headless at
// 1280x720 in Chrome for Testing (swiftshader WebGL) against the running dev
// server. Launch pattern copied from production/qa/evidence/sprint-011/probe.mjs.
//
// Path to the mission: real clicks where the UI has them (NEW OPERATION on the
// menu, the RUST HAVEN contract, ACCEPT CONTRACT, DEPLOY TEAM). Each fallback to
// a store call is logged as ASSIST.
// Scene reads: the app's own @react-three/fiber module instance (URL taken from
// performance resource entries) and its `_roots` map.
// Run: node production/qa/evidence/sprint-011-head-2026-10-24/tm-018/c1.mjs
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
const flush = () => writeFileSync(`${OUT}c1-output.txt`, log.join('\n') + '\n\nERRORS:\n' + errs.join('\n') + '\n')
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


/* ---------------- C2.7 rescan: ring-a.png along centre -> projected +3.5 m ---------------- */
{
  const C = [519.9, 399.2], E = [575.4, 447.5] // from run-output.txt (ring-a reads)
  const r = await ev(async ({ b64, C, E }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, img.width, img.height).data
    const L = Math.hypot(E[0] - C[0], E[1] - C[1]); const ux = (E[0] - C[0]) / L, uy = (E[1] - C[1]) / L
    const hits = []
    for (let t = 0; t <= L * 1.6; t += 0.25) {
      const x = Math.round(C[0] + ux * t), y = Math.round(C[1] + uy * t); const i = (y * img.width + x) * 4
      if (d[i] > 180 && d[i + 1] < 150 && d[i + 2] < 140) hits.push(+t.toFixed(2))
    }
    return { expectedOuterPx: +L.toFixed(1), redAt: hits.length ? [hits[0], hits[hits.length - 1]] : null, n: hits.length }
  }, { b64: (await import('fs')).readFileSync(`${OUT}ring-a.png`).toString('base64'), C, E })
  note('C2.7 rescan ring-a along projected +x: ' + JSON.stringify(r))
}

/* ---------------- C3.3 F recenter, settled ---------------- */
await page.keyboard.press('1'); await wait(300)
const focus = () => ev(async () => { const f = (await import('/src/game/runtime.ts')).getCameraFocus(); return f && { x: +f.x.toFixed(2), z: +f.z.toFixed(2) } })
const centroid = () => ev(async () => { const w = (await import('/src/game/runtime.ts')).getWorld(); const a = w.units.filter((u) => u.kind === 'agent' && u.hp > 0); return { x: +(a.reduce((s, u) => s + u.pos.x, 0) / a.length).toFixed(2), z: +(a.reduce((s, u) => s + u.pos.z, 0) / a.length).toFixed(2) } })
await page.mouse.move(640, 300)
await page.keyboard.down('a'); await wait(800); await page.keyboard.up('a'); await page.keyboard.down('w'); await wait(800); await page.keyboard.up('w'); await wait(300)
const fa = await focus(); await page.keyboard.press('f'); await wait(600); const fb = await focus(); await wait(1600); const fc = await focus()
note(`C3.3 F recenter: before ${JSON.stringify(fa)} -> +600ms ${JSON.stringify(fb)} -> +2200ms ${JSON.stringify(fc)}; living squad centroid ${JSON.stringify(await centroid())}`)

/* ---------------- C1 ---------------- */
// Clear the tutorial toasts off the play field (SKIP TUTORIAL; C3 ran in run.mjs).
const skip = page.getByRole('button', { name: /SKIP TUTORIAL/ })
if (await skip.count()) { await skip.first().click(); note('C1 pre: clicked SKIP TUTORIAL to clear toasts from the capture') }
await wait(300)
const camDist = () => ev(() => { const c = window.__tm.st().camera; const f = window.__tm.rt.getCameraFocus(); return +Math.hypot(c.position.x - f.x, c.position.y, c.position.z - f.z).toFixed(2) })
note('C1 pre: camera distance (no wheel input this session) ' + await camDist())
const relays = await ev(() => window.__tm.relays())
note('C1.1 relays ' + JSON.stringify(relays))
const R = relays[0]
const others = relays.filter((r) => r.id !== R.id)
note('C1.2 R core before ' + JSON.stringify(await ev(({ x, z }) => window.__tm.coreRead(x, z), R)))
// Fixed framing: focus = relay + (-3.5, +15.4) puts it upper right, clear of HUD panels and toasts.
const OFF = { x: -3.5, z: 15.4 }
const frame = async (u) => {
  await ev(({ x, z }) => window.__tm.rt.panCameraTo(x, z), { x: u.x + OFF.x, z: u.z + OFF.z })
  for (let i = 0; i < 20; i++) { await wait(250); const f = await focus(); if (Math.hypot(f.x - (u.x + OFF.x), f.z - (u.z + OFF.z)) < 0.02) break }
  await wait(400)
  const a = await ev(({ x, z }) => ({ focus: window.__tm.rt.getCameraFocus(), cam: window.__tm.st().camera.position.toArray().map((v) => +v.toFixed(3)), proj: window.__tm.project(x, 1.11, z) }), u)
  return a
}
const capture = async (u, name) => {
  await clearHold()
  const f = await frame(u)
  await shot(name)
  const f2 = await ev(({ x, z }) => ({ cam: window.__tm.st().camera.position.toArray().map((v) => +v.toFixed(3)), proj: window.__tm.project(x, 1.11, z) }), u)
  const p8 = await patch(name, f2.proj.sx, f2.proj.sy, 8)
  const p14 = await patch(name, f2.proj.sx, f2.proj.sy, 14)
  note(`${name} framing ${JSON.stringify(f)} after-shot cam ${JSON.stringify(f2.cam)} proj (${f2.proj.sx.toFixed(1)}, ${f2.proj.sy.toFixed(1)}) patch16 ${JSON.stringify(p8)} patch28 ${JSON.stringify(p14)}`)
  return { f, f2, p8, p14 }
}
const liveCap = await capture(R, 'relay-live')
flush()
await ev(({ id, x, z, others }) => {
  const P = window.__tm; window.__tmDeath = null
  let frames = 0
  const loop = () => {
    frames++
    const u = P.w().units.find((v) => v.id === id)
    if (u && (u.hp <= 0 || u.stance === 'dead') && !window.__tmDeath) {
      const at = { frame: frames, simTime: P.w().time, readSameCallback: P.coreRead(x, z) }
      requestAnimationFrame(() => { at.nextFrame = P.coreRead(x, z); at.othersNextFrame = others.map((o) => ({ id: o.id, hp: P.w().units.find((v) => v.id === o.id).hp, core: P.coreRead(o.x, o.z) })); requestAnimationFrame(() => { at.frame2 = P.coreRead(x, z); setTimeout(() => { at.after400ms = P.coreRead(x, z); window.__tmDeath = at }, 400) }) })
      return
    }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}, { ...R, others })
const sendSquad = () => ev(async ({ x, z }) => {
  const w = window.__tm.w(); const ids = w.units.filter((u) => u.kind === 'agent' && u.hp > 0).map((u) => u.id)
  w.orderHoldFire(ids, false); w.orderMove(ids, { x: x + 4, z: z + 4 }); return ids
}, R)
note('C1.5 squad ordered next to R (orderMove = right-click order; free fire on): ' + JSON.stringify(await sendSquad()))
let death = null, assist = false
const t0 = Date.now()
while (Date.now() - t0 < 150000) {
  await wait(1500); await clearHold()
  death = await ev(() => window.__tmDeath)
  if (death) break
  const s = await ev(({ id }) => { const w = window.__tm.w(); const u = w.units.find((v) => v.id === id); return { hp: u.hp, stance: u.stance, targeting: w.units.filter((v) => v.kind === 'agent' && v.targetId === id).map((v) => v.id) } }, R)
  note(`C1.5 t+${Math.round((Date.now() - t0) / 1000)}s R ${JSON.stringify(s)}`)
}
if (!death) {
  note('C1.5 ASSIST: free fire did not destroy R in 150 s; set hp 0 / stance dead / deathT on the sim unit')
  assist = true
  await ev(({ id }) => { const w = window.__tm.w(); const u = w.units.find((v) => v.id === id); u.hp = 0; u.stance = 'dead'; u.deathT = w.time }, R)
  await wait(1500); death = await ev(() => window.__tmDeath)
}
note('C1.6 death read ' + JSON.stringify(death))
await wait(1000)
const deadCap = await capture(R, 'relay-dead')
const alive = await ev((os) => os.map((o) => { const u = window.__tm.w().units.find((v) => v.id === o.id); return { ...o, hp: u.hp, stance: u.stance, core: window.__tm.coreRead(o.x, o.z) } }), others)
note('C1.8 other relays after ' + JSON.stringify(alive))
for (const o of alive) await capture(o, `relay-other-${o.id}-${o.hp > 0 ? 'alive' : 'dead'}`)
note('ASSIST in C1 destruction: ' + assist)
flush()
await browser.close()
note('done'); flush()
