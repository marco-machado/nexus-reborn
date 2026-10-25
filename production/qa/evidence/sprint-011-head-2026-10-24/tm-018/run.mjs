// TM-018 manual cases C1 (AC-2), C2 (AC-3a), C3 (AC-3b), executed headless at
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
const flush = () => writeFileSync(`${OUT}run-output.txt`, log.join('\n') + '\n\nERRORS:\n' + errs.join('\n') + '\n')
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

/* ---------------------------------- C3 + C2 ---------------------------------- */
note('C3.1 tut-1 ' + JSON.stringify(await toasts()))
await shot('tut-1')
await page.keyboard.press('1'); await wait(500)
note('C3.2 selected ' + JSON.stringify(await ev(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().selected)))
note('C3.2 tut-2 ' + JSON.stringify(await toasts()))
await shot('tut-2')
const focus = () => ev(async () => { const f = (await import('/src/game/runtime.ts')).getCameraFocus(); return f && { x: +f.x.toFixed(2), z: +f.z.toFixed(2) } })
const camDist = () => ev(() => { if (!window.__tm) return null; const s = window.__tm.st(); const c = s.camera; const f = window.__tm.rt.getCameraFocus(); return f ? +Math.hypot(c.position.x - f.x, c.position.y, c.position.z - f.z).toFixed(2) : +c.position.length().toFixed(2) })
await page.mouse.move(640, 360)
for (const k of ['w', 'a', 's', 'd']) {
  await clearHold()
  const a = await focus(); await page.keyboard.down(k); await wait(600); await page.keyboard.up(k); await wait(150); const b = await focus()
  note(`C3.3 pan ${k.toUpperCase()} focus ${JSON.stringify(a)} -> ${JSON.stringify(b)} moved=${a && b && Math.hypot(a.x - b.x, a.z - b.z) > 0.05}`)
}
let d0 = await camDist(); await page.mouse.wheel(0, -400); await wait(500); let d1 = await camDist(); await shot('zoom-in')
await page.mouse.wheel(0, 400); await wait(500); let d2 = await camDist(); await shot('zoom-out')
note(`C3.3 wheel camera distance ${d0} -> (wheel -400) ${d1} -> (wheel +400) ${d2}`)
const fBefore = await focus(); await page.keyboard.press('f'); await wait(600); const fAfter = await focus()
const centroid = await ev(async () => { const w = (await import('/src/game/runtime.ts')).getWorld(); const a = w.units.filter((u) => u.kind === 'agent' && u.hp > 0); return { x: +(a.reduce((s, u) => s + u.pos.x, 0) / a.length).toFixed(2), z: +(a.reduce((s, u) => s + u.pos.z, 0) / a.length).toFixed(2) } })
note(`C3.3 F focus ${JSON.stringify(fBefore)} -> ${JSON.stringify(fAfter)}; living squad centroid ${JSON.stringify(centroid)}`)
note('C3.3 toasts after camera keys ' + JSON.stringify(await toasts()))
// Advance to ITEMS through the toasts' X buttons (no SKIP TUTORIAL).
for (const t of ['MOVEMENT', 'ENGAGEMENT', 'STANCES', 'ROLE ABILITY']) {
  await clearHold()
  const x = page.getByRole('button', { name: `Dismiss tutorial step ${t}` })
  if (await x.count()) { await x.first().click(); note(`C3.4 dismissed ${t}`) } else note(`C3.4 no X for ${t}; toasts ${JSON.stringify(await toasts())}`)
  await wait(400)
}
await shot('tut-6')
note('C3.5 tut-6 ' + JSON.stringify(await toasts()))
flush()

// C2 + C3.6: first arming.
await clearHold()
await page.keyboard.press('1'); await wait(300)
const pre = await ev(async () => { const s = (await import('/src/state/missionStore.ts')).useMissionStore.getState(); const r = window.__tm?.ring(); return { selected: s.selected, avail: s.abilities?.grenade?.availability, inventory: s.inventory, targeting: s.grenadeTargeting, ring: r && { visible: r.visible, params: r.geometry.parameters, type: r.material.type, color: r.material.color.getHexString(), opacity: r.material.opacity, renderOrder: r.renderOrder } } })
note('C2.1-2 pre-arm ' + JSON.stringify(pre))
await page.mouse.move(520, 400); await wait(100)
await page.keyboard.press('g'); await wait(400)
note('C2.3 armed ' + JSON.stringify(await ev(async () => ({ targeting: (await import('/src/state/missionStore.ts')).useMissionStore.getState().grenadeTargeting, ringVisible: window.__tm?.ring()?.visible }))))
await shot('hint-grenade')
note('C3.6 hint-grenade toasts ' + JSON.stringify(await toasts()))
note('C3.6 tutorial store ' + JSON.stringify(await ev(async () => { const s = (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState(); return { hints: s.hints, seen: s.seen } })))
const ringAt = async (x, y, name) => {
  await page.mouse.move(x - 20, y - 10); await wait(80); await page.mouse.move(x, y); await wait(300)
  const r = await ev(({ x, y }) => { const P = window.__tm; const m = P.ring(); const g = P.ground(x, y); const c = P.project(m.position.x, m.position.y, m.position.z); const e = P.project(m.position.x + 3.5, m.position.y, m.position.z); const e2 = P.project(m.position.x + 3.35, m.position.y, m.position.z); return { visible: m.visible, pos: [m.position.x, m.position.y, m.position.z].map((v) => +v.toFixed(3)), ground: { x: +g.x.toFixed(3), z: +g.z.toFixed(3) }, dxz: +Math.hypot(m.position.x - g.x, m.position.z - g.z).toFixed(3), centrePx: [+c.sx.toFixed(1), +c.sy.toFixed(1)], edgePx: [+e.sx.toFixed(1), +e.sy.toFixed(1)], innerEdgePx: [+e2.sx.toFixed(1), +e2.sy.toFixed(1)], outerRadiusPx: +Math.hypot(e.sx - c.sx, e.sy - c.sy).toFixed(1) } }, { x, y })
  await shot(name)
  note(`C2 ${name} pointer (${x},${y}) ` + JSON.stringify(r))
  return r
}
await clearHold()
const A = await ringAt(520, 400, 'ring-a')
const B = await ringAt(760, 460, 'ring-b')
// Drawn-radius check on ring-a: scan the screenshot along +x from the centre for the red band.
const scan = await ev(async ({ b64, cx, cy }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
  const g = c.getContext('2d'); g.drawImage(img, 0, 0)
  const row = g.getImageData(0, Math.round(cy), img.width, 1).data
  const hits = []
  for (let x = Math.round(cx); x < img.width; x++) { const i = x * 4; if (row[i] > 180 && row[i + 1] < 140 && row[i + 2] < 130) hits.push(x) }
  return { firstRed: hits[0], lastRedInBand: hits.length ? hits.filter((x) => x - hits[0] < 40).pop() : null, sample: hits.slice(0, 20) }
}, { b64: (await import('fs')).readFileSync(`${OUT}ring-a.png`).toString('base64'), cx: A.centrePx[0], cy: A.centrePx[1] })
note('C2.7 ring-a red scan along +x from centre ' + JSON.stringify(scan) + ` expected outer edge x=${A.edgePx[0]} inner x=${A.innerEdgePx[0]}`)
await page.keyboard.press('g'); await wait(300)
note('C2.8 cancelled ' + JSON.stringify(await ev(async () => ({ targeting: (await import('/src/state/missionStore.ts')).useMissionStore.getState().grenadeTargeting, ringVisible: window.__tm?.ring()?.visible }))))
note('C3.7 toasts after cancel ' + JSON.stringify(await toasts()))
const hx = page.getByRole('button', { name: /Dismiss tutorial step BLAST RADIUS|Dismiss.*BLAST RADIUS/ })
if (await hx.count()) { await hx.first().click(); note('C3.7 dismissed BLAST RADIUS advisory') } else note('C3.7 no dismiss control found for BLAST RADIUS: ' + JSON.stringify(await ev(() => [...document.querySelectorAll('.hud-toast button')].map((b) => b.getAttribute('aria-label')))))
await wait(300)
await page.keyboard.press('g'); await wait(400)
note('C3.7 second arming ' + JSON.stringify(await ev(async () => { const s = (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState(); return { hints: s.hints, seenHasHint: s.seen.includes('hint-grenade'), targeting: (await import('/src/state/missionStore.ts')).useMissionStore.getState().grenadeTargeting } })))
note('C3.7 toasts ' + JSON.stringify(await toasts()))
await shot('hint-grenade-2')
await page.keyboard.press('g'); await wait(200)
flush()

/* ---------------------------------- C1 ---------------------------------- */
await clearHold()
const relays = await ev(() => window.__tm.relays())
note('C1.1 relays ' + JSON.stringify(relays))
const R = relays.find((r) => r.hp > 0)
const others = relays.filter((r) => r.id !== R.id)
note('C1.2 R core before ' + JSON.stringify(await ev(({ x, z }) => window.__tm.coreRead(x, z), R)))
// Framing: default zoom (distance restored by the wheel pair above), camera
// focus put on R by the app's own pan request (runtime.panCameraTo).
const frame = async () => { await ev(({ x, z }) => window.__tm.rt.panCameraTo(x, z), R); await wait(1500); return ev(({ x, z }) => ({ focus: window.__tm.rt.getCameraFocus(), cam: window.__tm.st().camera.position.toArray().map((v) => +v.toFixed(2)), proj: window.__tm.project(x, 1.11, z) }), R) }
const f1 = await frame()
note('C1.3 framing live ' + JSON.stringify(f1))
await shot('relay-live')
const live = await patch('relay-live', f1.proj.sx, f1.proj.sy)
note('C1.3 relay-live patch ' + JSON.stringify(live))
const othersLive = await ev((os) => os.map((o) => ({ id: o.id, ...window.__tm.project(o.x, 1.11, o.z), core: window.__tm.coreRead(o.x, o.z) })), others)
note('C1.3 other relays ' + JSON.stringify(othersLive))
flush()

// Destroy R by play: move the squad next to R (orders through the sim, same as
// a right click) and let free fire (AC-1) work it down. Watch from a rAF loop
// so the core is read in the first frame after the death is observed.
await ev(({ id, x, z }) => {
  const P = window.__tm; window.__tmDeath = null
  let frames = 0
  const loop = () => {
    frames++
    const u = P.w().units.find((v) => v.id === id)
    if (u && (u.hp <= 0 || u.stance === 'dead') && !window.__tmDeath) {
      const at = { frame: frames, simTime: P.w().time, readSameCallback: P.coreRead(x, z) }
      requestAnimationFrame(() => { at.nextFrame = P.coreRead(x, z); requestAnimationFrame(() => { at.frame2 = P.coreRead(x, z); setTimeout(() => { at.after400ms = P.coreRead(x, z); window.__tmDeath = at }, 400) }) })
      return
    }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}, R)
const sendSquad = () => ev(async ({ x, z }) => {
  const w = window.__tm.w(); const ids = w.units.filter((u) => u.kind === 'agent' && u.hp > 0).map((u) => u.id)
  w.orderHoldFire(ids, false); w.orderMove(ids, { x: x + 4, z: z + 4 }); return ids
}, R)
note('C1.5 squad ordered to R (orderMove + free fire): ' + JSON.stringify(await sendSquad()))
let death = null, assist = false
const t0 = Date.now()
while (Date.now() - t0 < 150000) {
  await wait(2500); await clearHold()
  death = await ev(() => window.__tmDeath)
  if (death) break
  const s = await ev(({ id }) => { const w = window.__tm.w(); const u = w.units.find((v) => v.id === id); const a = w.units.filter((v) => v.kind === 'agent'); return { hp: u.hp, stance: u.stance, agents: a.map((v) => ({ id: v.id, hp: Math.round(v.hp), d: +Math.hypot(v.pos.x - u.pos.x, v.pos.z - u.pos.z).toFixed(1), target: v.targetId })) } }, R)
  note(`C1.5 t+${Math.round((Date.now() - t0) / 1000)}s R ${JSON.stringify(s)}`)
  const res = await ev(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().result)
  if (res && res !== 'none') { note('C1.5 mission ended: ' + res); break }
  if ((Date.now() - t0) % 30000 < 2600) await sendSquad()
}
if (!death) {
  note('C1.5 free fire did not destroy R in time; ASSIST: set R hp 0 / stance dead / deathT through the sim object')
  assist = true
  await ev(({ id }) => { const w = window.__tm.w(); const u = w.units.find((v) => v.id === id); u.hp = 0; u.stance = 'dead'; u.deathT = w.time }, R)
  await wait(1500)
  death = await ev(() => window.__tmDeath)
}
note('C1.6 death read ' + JSON.stringify(death))
const f2 = await frame()
note('C1.7 framing dead ' + JSON.stringify(f2))
await shot('relay-dead')
const dead = await patch('relay-dead', f2.proj.sx, f2.proj.sy)
note('C1.7 relay-dead patch ' + JSON.stringify(dead))
note('C1.8 other relays after ' + JSON.stringify(await ev((os) => os.map((o) => { const u = window.__tm.w().units.find((v) => v.id === o.id); return { id: o.id, hp: u.hp, stance: u.stance, core: window.__tm.coreRead(o.x, o.z) } }), others)))
// Other relays' glow in pixels, from a frame centred on each.
for (const o of others) {
  await ev(({ x, z }) => window.__tm.rt.panCameraTo(x, z), o); await wait(1500)
  const p = await ev(({ x, z }) => window.__tm.project(x, 1.11, z), o)
  await shot(`relay-other-${o.id}`)
  note(`C1.8 other relay ${o.id} patch ` + JSON.stringify(await patch(`relay-other-${o.id}`, p.sx, p.sy)))
}
note('ASSIST in C1 destruction: ' + assist)
flush()
await browser.close()
note('done'); flush()
