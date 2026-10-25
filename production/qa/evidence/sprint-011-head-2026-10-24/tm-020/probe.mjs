// TM-020 objective markers: headless probe for cases TM-020-01..08
// (production/qa/test-cases/tm-020-objective-markers-in-the-3d-view-cases.md).
// Headless Chrome for Testing, 1280x720, WebGL via --use-angle=swiftshader.
// Assists (named): localStorage clear; harness `fixture` state set through the
// stores; Brief/Assembly/mission through selectMission / goto('team') /
// startMission; squad moved with getWorld().orderMove; devices killed by
// setting stance 'dead' + hp 0; reduced motion via setReducedMotion; casualty
// hold (TM-019) released with Space; camera via panCameraTo.
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

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader'],
})
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const R = {}
const PART = process.env.PART || 'all' // all | hc8 | rh
const log = []
const note = (s) => { log.push(s); console.log(s) }
const dump = () => {
  writeFileSync(OUT + PART + '-probe-output.json', JSON.stringify({ R, errs }, null, 1))
  writeFileSync(OUT + PART + '-probe-output.txt', log.join('\n') + '\n\nERRORS:\n' + errs.join('\n'))
}
const ev = (fn, arg) => page.evaluate(fn, arg)
let holds = 0

async function releaseHold() {
  const held = await ev(async () => (await import('/src/state/missionStore.ts')).useMissionStore.getState().held)
  if (held) { holds++; note('  hold seen -> Space'); await page.keyboard.press('Space'); await wait(300) }
}
async function waitUntil(label, fn, arg, timeoutMs = 120000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    await releaseHold()
    const v = await ev(fn, arg)
    if (v) { note(`  ${label}: met after ${((Date.now() - t0) / 1000).toFixed(1)}s`); return true }
    await wait(500)
  }
  note(`  ${label}: TIMEOUT ${timeoutMs / 1000}s`)
  return false
}

const HELPERS = async () => {
  const runtime = await import('/src/game/runtime.ts')
  const om = await import('/src/game/objectiveMarks.ts')
  const ms = await import('/src/state/missionStore.ts')
  const ss = await import('/src/state/settingsStore.ts')
  const tok = await import('/src/ui/tokens.ts')
  const types = await import('/src/game/types.ts')
  const fibUrl = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('@react-three_fiber.js'))
  const t = { fibUrl, runtime, om, ms, ss, tok }
  t.scene = async () => {
    const fib = await import(fibUrl)
    const roots = fib._roots
    if (!roots) return { err: 'no _roots export' }
    for (const [canvas, root] of roots) {
      if (!canvas.isConnected) continue
      return { scene: root.store.getState().scene, canvas }
    }
    return { err: 'no connected root (' + roots.size + ' roots)' }
  }
  t.pool = async () => {
    const s = await t.scene()
    if (s.err) return s
    let pool = null
    s.scene.traverse((o) => {
      if (pool || !o.isGroup || o.children.length !== 16) return
      const ok = o.children.every((c, i) => c.geometry && c.geometry.type === (i % 2 ? 'CylinderGeometry' : 'RingGeometry'))
      if (ok) pool = o
    })
    return pool ? { pool } : { err: 'pool group not found' }
  }
  t.slots = async () => {
    const p = await t.pool()
    if (p.err) return p
    const out = []
    for (let i = 0; i < 8; i++) {
      const ring = p.pool.children[i * 2]
      const beam = p.pool.children[i * 2 + 1]
      if (!ring.visible) { if (beam.visible) out.push({ i, orphanBeam: true }); continue }
      const r3 = (v) => Math.round(v * 1000) / 1000
      out.push({
        i, x: r3(ring.position.x), y: r3(ring.position.y), z: r3(ring.position.z), scale: r3(ring.scale.x),
        scaleZ: r3(ring.scale.z), inner: ring.geometry.parameters.innerRadius, color: ring.material.color.getHexString(),
        opacity: r3(ring.material.opacity), beam: beam.visible, bx: r3(beam.position.x), by: r3(beam.position.y), bz: r3(beam.position.z),
      })
    }
    return { slots: out }
  }
  t.oracle = () => {
    const w = runtime.getWorld()
    return om.objectiveMarks(w.mission.objectives, ms.useMissionStore.getState().objectives, w.units, w.city)
      .map((m) => ({ x: Math.round(m.x * 1000) / 1000, z: Math.round(m.z * 1000) / 1000, r: m.r, optional: m.optional }))
  }
  t.rows = () => ms.useMissionStore.getState().objectives.map((o) => ({ id: o.id, active: o.active, done: o.done, failed: !!o.failed, optional: !!o.optional }))
  t.row = (id) => ms.useMissionStore.getState().objectives.find((o) => o.id === id)
  t.city = () => {
    const c = runtime.getWorld().city
    return { landmarks: c.landmarks, checkpoint: c.checkpoint, extraction: c.extraction, size: c.size }
  }
  t.agents = () => runtime.getWorld().units.filter((u) => u.kind === 'agent' && u.stance !== 'dead').map((u) => u.id)
  t.move = (x, z) => runtime.getWorld().orderMove(t.agents(), { x, z })
  t.devices = () => runtime.getWorld().units.filter((u) => u.kind === 'device').map((u) => ({ id: u.id, tag: u.tag, x: Math.round(u.pos.x * 1000) / 1000, z: Math.round(u.pos.z * 1000) / 1000, stance: u.stance, hp: u.hp }))
  t.kill = (id) => { const u = runtime.getWorld().units.find((x) => x.id === id); u.stance = 'dead'; u.hp = 0 }
  t.sample = async (n) => {
    const p = await t.pool()
    if (p.err) return p
    const per = {}
    for (let f = 0; f < n; f++) {
      await new Promise((r) => requestAnimationFrame(r))
      for (let i = 0; i < 8; i++) {
        const ring = p.pool.children[i * 2]
        if (!ring.visible) continue
        const k = per[i] || (per[i] = { inner: ring.geometry.parameters.innerRadius, op: [], sc: [] })
        k.op.push(ring.material.opacity); k.sc.push(ring.scale.x)
      }
    }
    const res = {}
    for (const [i, k] of Object.entries(per)) {
      res[i] = { inner: k.inner, frames: k.op.length, opMin: Math.min(...k.op), opMax: Math.max(...k.op), opSpread: Math.max(...k.op) - Math.min(...k.op),
        scMin: Math.min(...k.sc), scMax: Math.max(...k.sc) }
    }
    return res
  }
  t.decal = async () => {
    const s = await t.scene()
    if (s.err) return s
    const found = []
    s.scene.traverse((o) => {
      if (o.isInstancedMesh && o.count === 20 && o.geometry.type === 'BoxGeometry') {
        const m = new o.matrixWorld.constructor()
        let cx = 0, cz = 0
        const v = { x: 0, z: 0 }
        for (let i = 0; i < 20; i++) { o.getMatrixAt(i, m); cx += m.elements[12]; cz += m.elements[14] }
        v.x = cx / 20; v.z = cz / 20
        found.push({ count: o.count, visible: o.visible, pos: [o.position.x, o.position.y, o.position.z], instCentre: v,
          color: o.material.color && o.material.color.getHexString(), emissive: o.material.emissive && o.material.emissive.getHexString() })
      }
    })
    return found
  }
  t.minimap = (zx, zz, zr) => {
    const cv = document.querySelector('.minimap-canvas')
    if (!cv) return { err: 'no .minimap-canvas' }
    const w = cv.clientWidth, h = cv.clientHeight
    const city = runtime.getWorld().city
    const size = city.size
    const Y = tok.CAMERA_YAW ?? null
    return { w, h, size, dprX: cv.width / w, dprY: cv.height / h, Y }
  }
  t.mmScan = (Y, zx, zz, zr) => {
    const cv = document.querySelector('.minimap-canvas')
    // The draw frame: Minimap sizes the backing store as width*dpr, so the
    // layout's width/height are canvas.width / dpr (the CSS box may be smaller
    // by its border).
    const dprWin = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
    const w = cv.width / dprWin, h = cv.height / dprWin
    const size = runtime.getWorld().city.size
    const sY = Math.sin(Y), cY = Math.cos(Y)
    const span = size * (sY + cY)
    const s = Math.min(w, h) / span
    const originX = -size * sY
    const ox = span * s <= w ? (w - span * s) / 2 : NaN
    const oy = span * s <= h ? (h - span * s) / 2 : NaN
    const px = (zx * cY - zz * sY - originX) * s + ox
    const py = (zx * sY + zz * cY) * s + oy
    const rad = Math.max(4, zr * s)
    const d = dprWin
    const img = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)
    const isVip = (X, Yp) => {
      const xi = Math.round(X * d), yi = Math.round(Yp * d)
      if (xi < 0 || yi < 0 || xi >= cv.width || yi >= cv.height) return false
      const o = (yi * cv.width + xi) * 4
      const r = img.data[o], g = img.data[o + 1], b = img.data[o + 2]
      return b > 120 && b >= g && g > r && b - r > 40
    }
    const hitFrac = (cx, cy, rr) => {
      let hit = 0
      for (let a = 0; a < 72; a++) {
        const ang = (a / 72) * Math.PI * 2
        let any = false
        for (const dr of [-0.75, 0, 0.75]) if (isVip(cx + (rr + dr) * Math.cos(ang), cy + (rr + dr) * Math.sin(ang))) any = true
        if (any) hit++
      }
      return hit / 72
    }
    let best = { f: -1 }
    for (let dx = -5; dx <= 5; dx += 0.5) for (let dy = -5; dy <= 5; dy += 0.5) {
      const f = hitFrac(px + dx, py + dy, rad)
      if (f > best.f || (f === best.f && Math.hypot(dx, dy) < Math.hypot(best.dx, best.dy))) best = { f, dx, dy }
    }
    return { w, h, cssW: cv.clientWidth, cssH: cv.clientHeight, s, ox, oy, px, py, rad, dpr: d, fracAtExpected: hitFrac(px, py, rad), best, bestOffset: Math.hypot(best.dx, best.dy) }
  }
  window.__t = t
  return { fibUrl, VIP: tok.VIP, CAMERA_YAW: types.CAMERA_YAW }
}

async function enterMission(id) {
  await page.goto(URL)
  await ev(() => localStorage.clear())
  await page.reload()
  await wait(1500)
  await ev(async () => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    useCampaignStore.setState({ intelLevel: 2, intelProgress: 20, contractsWon: ['m03'] })
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.setState({ credits: 141000 })
    const { useResearchStore } = await import('/src/state/researchStore.ts')
    useResearchStore.setState({ done: ['b-propellants', 'b-coating', 'c-interface'] })
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ influence: 14 })
    const tut = await import('/src/game/tutorial.ts')
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    useTutorialStore.setState({ seen: [...tut.SEEN_IDS] })
    save.writeSave()
    useAppStore.getState().goto('menu')
  })
  await page.reload()
  await wait(1500)
  await ev(async (id) => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().selectMission(id)
    useAppStore.getState().goto('team')
  }, id)
  await wait(900)
  await ev(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission())
  await page.waitForFunction(async () => {
    const r = await import('/src/game/runtime.ts')
    const m = await import('/src/state/missionStore.ts')
    return !!r.getWorld() && m.useMissionStore.getState().live
  }, null, { timeout: 30000 })
  await wait(4000)
  const h = await ev(HELPERS)
  note(`[${id}] mission live; fiber url ${h.fibUrl}; VIP ${h.VIP}; CAMERA_YAW ${h.CAMERA_YAW}`)
  return h
}
const snap = async (label) => {
  await wait(600)
  const r = await ev(async () => ({ rows: window.__t.rows(), slots: await window.__t.slots(), oracle: window.__t.oracle() }))
  note(`  [${label}] rows ${JSON.stringify(r.rows)}`)
  note(`  [${label}] slots ${JSON.stringify(r.slots)}`)
  note(`  [${label}] oracle ${JSON.stringify(r.oracle)}`)
  return r
}
const shot = async (name, x, z) => {
  await ev(({ x, z }) => window.__t.runtime.panCameraTo(x, z), { x, z })
  await wait(1000)
  await page.screenshot({ path: OUT + name + '.png' })
  note(`  captured ${name}.png (camera on ${x.toFixed(2)}, ${z.toFixed(2)})`)
}
const setRM = (on) => ev((on) => window.__t.ss.useSettingsStore.getState().setReducedMotion(on), on)
const mm = async (label, Y, zone) => {
  await wait(400)
  const r = await ev(({ Y, zone }) => window.__t.mmScan(Y, zone.x, zone.z, zone.r), { Y, zone })
  note(`  [${label}] minimap ${JSON.stringify(r)}`)
  const box = await page.locator('.minimap-canvas').boundingBox()
  return { r, box }
}

try {
  /* ============================ HOLLOW CROWN ============================ */
  if (PART !== 'rh') {
  const h = await enterMission('m02')
  for (let i = 0; i < 2; i++) { await page.getByRole('button', { name: 'Zoom minimap out' }).click(); await wait(200) }
  note('  UI: clicked Zoom minimap out x2 (zoom 0); out-button disabled: ' + await page.getByRole('button', { name: 'Zoom minimap out' }).isDisabled())
  const Y = h.CAMERA_YAW
  const city = await ev(() => window.__t.city())
  R.hcCity = city
  note(`  city landmarks ${JSON.stringify(city.landmarks)} checkpoint ${JSON.stringify(city.checkpoint)} extraction ${JSON.stringify(city.extraction)} size ${city.size}`)
  const L = city.landmarks

  // TM-01 + TM-06a
  R.t01 = await snap('TM-01')
  await shot('tm-020-01-required-gate', L.gate.x, L.gate.z)
  R.t06aDecal = await ev(() => window.__t.decal())
  note(`  [TM-06a] decal ${JSON.stringify(R.t06aDecal)}`)
  await shot('tm-020-06-extraction-start', city.extraction.x, city.extraction.z)

  // TM-08 state 1 (reduced motion on)
  await setRM(true)
  await wait(600)
  const ring1 = (R.t01.slots.slots || [])[0]
  R.t08a = await mm('TM-08a', Y, ring1 ? { x: ring1.x, z: ring1.z, r: ring1.scale } : L.gate)
  await page.screenshot({ path: OUT + 'tm-020-08-minimap-hc1.png' })
  if (R.t08a.box) await page.screenshot({ path: OUT + 'tm-020-08-minimap-hc1-crop.png', clip: R.t08a.box })
  await setRM(false)

  // TM-02: complete hc1
  await ev(({ x, z }) => window.__t.move(x, z), L.gate)
  note('  assist: orderMove squad -> gate')
  R.t02reach = await waitUntil('hc1 done', () => window.__t.row('hc1').done)
  R.t02 = await snap('TM-02')
  await shot('tm-020-02-console-required', L.console.x, L.console.z)
  await shot('tm-020-02-server-optional', L.server.x, L.server.z)

  // TM-07 reduced motion
  await setRM(false)
  R.t07a = await ev(() => window.__t.sample(60))
  note(`  [TM-07 off] ${JSON.stringify(R.t07a)}`)
  await setRM(true)
  note('  assist: setReducedMotion(true) via settings store')
  await wait(500)
  R.t07b = await ev(() => window.__t.sample(60))
  note(`  [TM-07 on] ${JSON.stringify(R.t07b)}`)
  await shot('tm-020-07-reduced', L.console.x, L.console.z)

  // TM-08 state 2 (still reduced motion on)
  const s2 = (await ev(async () => await window.__t.slots())).slots || []
  const req2 = s2.find((s) => s.inner === 0.88)
  R.t08b = await mm('TM-08b', Y, req2 ? { x: req2.x, z: req2.z, r: req2.scale } : L.console)
  R.t08bServer = await ev(({ Y, zone }) => window.__t.mmScan(Y, zone.x, zone.z, zone.r), { Y, zone: L.server })
  note(`  [TM-08b server check] frac ${R.t08bServer.fracAtExpected}`)
  await page.screenshot({ path: OUT + 'tm-020-08-minimap-hc2.png' })
  if (R.t08b.box) await page.screenshot({ path: OUT + 'tm-020-08-minimap-hc2-crop.png', clip: R.t08b.box })
  await setRM(false)
  R.t07c = await ev(() => window.__t.sample(60))
  note(`  [TM-07 off again] ${JSON.stringify(R.t07c)}`)

  if (PART === 'hc8') throw new Error('PART hc8 done')
  // TM-04: complete hc2
  R.t04before = await snap('TM-04 before')
  await shot('tm-020-04-before', L.console.x, L.console.z)
  await ev(({ x, z }) => window.__t.move(x, z), L.console)
  note('  assist: orderMove squad -> console')
  R.t04reach = await waitUntil('hc2 done', () => window.__t.row('hc2').done, null, 150000)
  R.t04 = await snap('TM-04 after')
  await shot('tm-020-04-after', L.console.x, L.console.z)

  // TM-05: let hc-opt fail (squad held at console, away from server)
  R.t05pre = await snap('TM-05 pre')
  R.t05reach = await waitUntil('hc-opt failed or done', () => { const r = window.__t.row('hc-opt'); return r.failed || r.done || !window.__t.ms.useMissionStore.getState().live }, null, 150000)
  R.t05live = await ev(() => window.__t.ms.useMissionStore.getState().live)
  R.t05 = await snap('TM-05')
  await shot('tm-020-05-server-failed', L.server.x, L.server.z)
  }
  dump()

  /* ============================= RUST HAVEN ============================= */
  await enterMission('m03')
  const rc = await ev(() => window.__t.city())
  R.rhCity = rc
  note(`  city landmarks ${JSON.stringify(rc.landmarks)} extraction ${JSON.stringify(rc.extraction)}`)
  const ya = rc.landmarks['yard-a']
  const yTarget = PART === 'rh' ? { x: 76.3, z: 44 } : ya // inside yard-a, far side from relay d1
  await ev(() => window.__t.runtime.getWorld().orderHoldFire(window.__t.agents(), true))
  R.t03holdFire = await ev(() => window.__t.runtime.getWorld().units.filter((u) => u.kind === 'agent').map((u) => [u.id, u.holdFire]))
  note('  assist: orderHoldFire(agents, true) before entering yard-a ' + JSON.stringify(R.t03holdFire))
  await ev(({ x, z }) => window.__t.move(x, z), yTarget)
  note('  assist: orderMove squad -> yard-a at ' + JSON.stringify(yTarget))
  // Freeze the sim the instant rh1 completes (TM-019 hold via setHeld, assist)
  // so squad gunfire cannot kill relays before the 0.2 s marker refresh.
  R.t03reach = false
  { const t0 = Date.now()
    while (Date.now() - t0 < 120000) {
      const r = await ev(() => { const s = window.__t.ms.useMissionStore.getState(); if (window.__t.row('rh1').done) { s.setHeld(true, 'QA FREEZE'); return 'done' } return s.held ? 'held' : '' })
      if (r === 'done') { R.t03reach = true; note(`  rh1 done after ${((Date.now() - t0) / 1000).toFixed(1)}s -> setHeld(true) (assist)`); break }
      if (r === 'held') { holds++; await page.keyboard.press('Space'); note('  hold seen -> Space') }
      await wait(100)
    } }
  R.t03devices = await ev(() => window.__t.devices())
  note(`  [TM-03] devices ${JSON.stringify(R.t03devices)}`)
  R.t03a = await snap('TM-03 a')
  note(`  [TM-03] devices after snap ${JSON.stringify(await ev(() => window.__t.devices()))}`)
  const relays = R.t03devices.filter((d) => d.tag === 'relay')
  const rx = relays.reduce((a, d) => a + d.x, 0) / relays.length
  const rz = relays.reduce((a, d) => a + d.z, 0) / relays.length
  await shot('tm-020-03-relays-3', rx, rz)
  const victim = (await ev(() => window.__t.devices())).find((d) => d.tag === 'relay' && d.stance !== 'dead')
  relays[0] = victim
  await ev((id) => window.__t.kill(id), relays[0].id)
  note(`  assist: fixture shortcut kill ${relays[0].id} (stance dead, hp 0)`)
  await wait(300)
  R.t03killed = { dev: (await ev(() => window.__t.devices())).find((d) => d.id === relays[0].id), rh2: await ev(() => window.__t.row('rh2')) }
  note(`  [TM-03] after kill ${JSON.stringify(R.t03killed)}`)
  R.t03b = await snap('TM-03 b')
  await shot('tm-020-03-relays-2', rx, rz)

  // TM-06b: finish rh2/rh-opt (assist kills), hold target for rh3
  for (const d of R.t03devices) if (d.id !== relays[0].id) await ev((id) => window.__t.kill(id), d.id)
  await ev(() => window.__t.ms.useMissionStore.getState().setHeld(false))
  note('  released QA freeze (setHeld false)')
  await ev(() => window.__t.runtime.getWorld().orderHoldFire(window.__t.agents(), false))
  note('  released hold fire')
  note('  assist: fixture shortcut kill remaining relays + transformer')
  await waitUntil('rh2 done', () => window.__t.row('rh2').done, null, 20000)
  await ev(({ x, z }) => window.__t.move(x, z), rc.landmarks.target)
  note('  assist: orderMove squad -> target (defend)')
  R.t06breach = await waitUntil('only rh4 active', () => {
    const rows = window.__t.rows()
    return rows.filter((r) => r.active && !r.done && !r.failed).map((r) => r.id).join() === 'rh4' || !window.__t.ms.useMissionStore.getState().live
  }, null, 180000)
  R.t06b = await snap('TM-06b')
  R.t06bDecal = await ev(() => window.__t.decal())
  note(`  [TM-06b] decal ${JSON.stringify(R.t06bDecal)}`)
  R.t06bLive = await ev(() => window.__t.ms.useMissionStore.getState().live)
  await shot('tm-020-06-extraction-only', rc.extraction.x, rc.extraction.z)
} catch (e) {
  note('PROBE ERROR ' + (e && e.stack || e))
} finally {
  note(`holds released: ${holds}`)
  dump()
  await browser.close()
}
