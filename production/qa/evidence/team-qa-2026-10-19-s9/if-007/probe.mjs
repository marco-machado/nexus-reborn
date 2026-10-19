// IF-007 /team-qa 2026-10-19 probe, cases TC-01, TC-03 and TC-08 of
// production/qa/test-cases/if-007-minimap-weather-toasts-cases.md:
// like-for-like minimap on GLASS VEIL, Standard vs Hardened, at all three zoom
// levels with the objective pulse; minimap up = screen up; reduced motion
// freezes the pulse. Headless Chrome for Testing at 1280x720 against a vite
// dev server. Harness assists, named: localStorage clear; jump to a live
// mission through the app store (Team Deploy -> startMission, MISSIONS[0] =
// GLASS VEIL, default squad); difficulty through settingsStore.setDifficulty;
// tutorial skipped through tutorialStore.skipTutorial so no toast differs
// between runs. Zoom steps, minimap clicks, pause, the Settings REDUCED MOTION
// toggle, CLOSE and RESUME are real pointer/keyboard input.
//
// Run: npm run dev -- --strictPort      (port 4200)
//      SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/if-007/probe.mjs
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME =
  process.env.SWEEP_CHROME ||
  process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.SWEEP_URL || 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
// Log every arc the minimap strokes in VIP Ice (#9be8ff): Minimap.tsx draws
// the active-objective pulse that way (radius grows with the pulse phase;
// reduced motion draws a steady ring at alpha 0.7). Read only.
await ctx.addInitScript(() => {
  window.__vipArcs = []
  const arc = CanvasRenderingContext2D.prototype.arc
  CanvasRenderingContext2D.prototype.arc = function (x, y, r, ...rest) {
    if (this.canvas?.classList?.contains('minimap-canvas') && String(this.strokeStyle).toLowerCase() === '#9be8ff') {
      window.__vipArcs.push({ t: Math.round(performance.now()), x: +x.toFixed(1), y: +y.toFixed(1), r: +r.toFixed(2), a: +this.globalAlpha.toFixed(2) })
      if (window.__vipArcs.length > 4000) window.__vipArcs.splice(0, 2000)
    }
    return arc.call(this, x, y, r, ...rest)
  }
})
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const mmShot = (name) => page.locator('.minimap-canvas').screenshot({ path: `${OUT}${name}.png` })
const log = []
let fails = 0
const note = (s) => { log.push(s); console.log(s) }
const check = (name, ok, detail = '') => { if (!ok) fails++; note(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' // ' + detail : ''}`) }

const facts = () =>
  page.evaluate(async () => {
    const ms = (await import('/src/state/missionStore.ts')).useMissionStore.getState()
    const rt = await import('/src/game/runtime.ts')
    const S = (await import('/src/state/settingsStore.ts')).useSettingsStore.getState()
    const w = rt.getWorld()
    const enemies = w ? w.units.filter((u) => u.kind === 'enemy' && u.stance !== 'dead') : []
    const active = ms.objectives.find((o) => o.active && !o.done && !o.failed && !o.optional)
    return {
      difficulty: S.difficulty,
      reducedMotion: S.reducedMotion,
      time: w ? +w.time.toFixed(2) : null,
      civilians: w ? w.units.filter((u) => u.kind === 'civilian' && u.stance !== 'dead').length : 0,
      enemies: enemies.length,
      patrolling: enemies.filter((u) => (u.patrol?.length ?? 0) > 0).length,
      activeObjective: active ? active.id : null,
      toast: document.querySelector('.hud-toast:not(.hint)') !== null,
    }
  })

async function startMission(difficulty) {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1500)
  await page.evaluate(async (difficulty) => {
    ;(await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setDifficulty(difficulty)
    ;(await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().skipTutorial()
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { MISSIONS, DEFAULT_SQUAD } = await import('/src/game/data.ts')
    useAppStore.setState({ phase: 'team', missionId: MISSIONS[0].id, squad: [...DEFAULT_SQUAD] })
    useAppStore.getState().startMission()
  }, difficulty)
  await page.waitForSelector('.minimap-canvas', { timeout: 30000 })
  await wait(4000)
}


// Minimap pixels within a small distance of VIP Ice (#9be8ff), the colour
// Minimap.tsx strokes the active-objective pulse with, as a set of pixel
// indices, for comparing the pulse region between two samples.
const vipMask = () =>
  page.evaluate(() => {
    const c = document.querySelector('.minimap-canvas')
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    const out = []
    for (let i = 0; i < d.length; i += 4) {
      if (Math.abs(d[i] - 0x9b) < 28 && Math.abs(d[i + 1] - 0xe8) < 28 && Math.abs(d[i + 2] - 0xff) < 28 && d[i + 3] > 0) out.push(i / 4)
    }
    return out
  })
const compareMasks = (a, b) => {
  const A = new Set(a), B = new Set(b)
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  const union = A.size + B.size - inter
  return { a: A.size, b: B.size, identical: A.size === B.size && inter === A.size, jaccard: union ? +(inter / union).toFixed(3) : 1 }
}
const cam = () =>
  page.evaluate(async () => {
    const rt = await import('/src/game/runtime.ts')
    const f = rt.getCameraFocus()
    const fp = rt.getCameraFootprint()
    return { focus: f ? { x: f.x, z: f.z } : null, fp: fp ? fp.map((p) => ({ x: p.x, z: p.z })) : null }
  })

// VIP Ice arcs stroked in the last `ms` milliseconds.
const arcsOver = async (ms) => {
  const t0 = await page.evaluate(() => performance.now())
  await wait(ms)
  return page.evaluate((t0) => window.__vipArcs.filter((a) => a.t >= t0), t0)
}
const arcSummary = (arcs) => {
  const rs = arcs.map((a) => a.r)
  return { n: arcs.length, rMin: rs.length ? Math.min(...rs) : null, rMax: rs.length ? Math.max(...rs) : null, alphas: [...new Set(arcs.map((a) => a.a))].slice(0, 6) }
}
// Is the stroked ring's centre inside the canvas (so it can be seen)?
const onCanvas = (arcs) =>
  page.evaluate((arcs) => {
    const c = document.querySelector('.minimap-canvas')
    const a = arcs.at(-1)
    return a ? { x: a.x, y: a.y, w: c.width, h: c.height } : null
  }, arcs)

const result = {}
try {
  // ---------- TC-01: like-for-like minimap, Standard vs Hardened, 3 zooms ----------
  for (const difficulty of ['standard', 'hardened']) {
    await startMission(difficulty)
    const f = await facts()
    const c = await cam()
    check(`TC-01 ${difficulty} mission live`, f.difficulty === difficulty && f.time > 0, JSON.stringify(f))
    check(`TC-01 ${difficulty}: no tutorial toast (like-for-like)`, f.toast === false)
    result[difficulty] = { civilians: f.civilians, enemies: f.enemies, patrolling: f.patrolling, activeObjective: f.activeObjective }
    note(`TC-01 ${difficulty} at sim t ${f.time}, focus ${JSON.stringify(c.focus)}: ${JSON.stringify(result[difficulty])}`)
    const sfx = difficulty === 'hardened' ? '' : 's'
    const zin = page.locator('[aria-label="Zoom minimap in"]')
    const zout = page.locator('[aria-label="Zoom minimap out"]')
    check(`TC-01 ${difficulty}: zoom starts at max (in disabled)`, await zin.isDisabled())
    const pulse = []
    for (const [n, z] of [[1, 3], [2, 2], [3, 1]]) {
      if (z < 3) { await zout.click(); await wait(300) }
      const arcs = await arcsOver(600)
      pulse.push({ zoom: z, ...arcSummary(arcs), centre: await onCanvas(arcs), vipPixels: (await vipMask()).length })
      await mmShot(`probe-0${n}${sfx}-minimap-zoom-${z}-${difficulty}`)
    }
    check(`TC-01 ${difficulty}: zoom bottoms out after two steps (out disabled)`, await zout.isDisabled())
    check(`TC-01 ${difficulty}: objective pulse stroked at every zoom`, f.activeObjective !== null && pulse.every((p) => p.n > 0), `objective ${f.activeObjective}, per zoom ${JSON.stringify(pulse)}`)
    result[difficulty].pulse = pulse
    await zin.click(); await zin.click(); await wait(300)
  }
  const s = result.standard, h = result.hardened
  // AC10: Hardened does not strip them; counts may differ (Hardened profile is
  // Tactical's data, TM-015), so they are recorded, not compared.
  check('TC-01 hardened keeps civilians, enemies and patrols', h.civilians > 0 && h.enemies > 0 && h.patrolling > 0, `${JSON.stringify(s)} vs ${JSON.stringify(h)}`)
  check('TC-01 same active objective on both difficulties', s.activeObjective === h.activeObjective)

  // Same zoom, same objective: is the pulse equally on canvas for both?
  for (let i = 0; i < 3; i++) note(`TC-01 zoom ${result.standard.pulse[i].zoom}: ring centre standard ${JSON.stringify(result.standard.pulse[i].centre)} vs hardened ${JSON.stringify(result.hardened.pulse[i].centre)}`)

  // ---------- TC-03: minimap up = screen up (Hardened session) ----------
  // A press inside the camera's view box grabs it (Minimap.tsx onDown), so the
  // check drags the box straight up from the minimap centre, which the zoomed
  // layout keeps on the camera focus.
  const box = await page.locator('.minimap-canvas').boundingBox()
  const P = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 }
  const c0 = await cam()
  await shot('probe-04-main-before')
  await page.mouse.move(P.x, P.y)
  await page.mouse.down()
  await page.mouse.move(P.x, P.y - box.height * 0.2, { steps: 8 })
  await page.mouse.up()
  await wait(1200)
  const c1 = await cam()
  await shot('probe-05-main-after-up')
  // Footprint corners are clockwise from the screen's top left (CameraRig).
  const [tl, tr, br, bl] = c0.fp
  const up = { x: (tl.x + tr.x - bl.x - br.x) / 2, z: (tl.z + tr.z - bl.z - br.z) / 2 }
  const d = { x: c1.focus.x - c0.focus.x, z: c1.focus.z - c0.focus.z }
  const cos = (up.x * d.x + up.z * d.z) / (Math.hypot(up.x, up.z) * Math.hypot(d.x, d.z) || 1)
  check('TC-03 dragging the view up on the minimap moves the camera toward screen-up', Math.hypot(d.x, d.z) > 0.5 && cos > 0.9, `focus ${JSON.stringify(c0.focus)} -> ${JSON.stringify(c1.focus)}, screen-up ${JSON.stringify(up)}, cos ${cos.toFixed(3)}`)

  // ---------- TC-08: reduced motion through the Settings control ----------
  const off = arcSummary(await arcsOver(500))
  await page.mouse.click(640, 400); await wait(150)
  await page.keyboard.press('Escape'); await wait(400)
  await page.getByRole('button', { name: 'Open settings' }).click(); await wait(400)
  const rm = page.locator('button[aria-label^="REDUCED MOTION"]')
  const rmBefore = await rm.getAttribute('aria-label')
  await rm.click(); await wait(300)
  const rmAfter = await rm.getAttribute('aria-label')
  await page.locator('[role="dialog"][aria-label="Settings"] button', { hasText: /^CLOSE$/ }).click(); await wait(300)
  await page.locator('[role="dialog"][aria-label="Mission paused"] button', { hasText: 'RESUME' }).click(); await wait(600)
  const fr = await facts()
  note(`TC-08 method: Settings control "${rmBefore}" -> "${rmAfter}"; sim running ${fr.time > 0}, reducedMotion ${fr.reducedMotion}`)
  await mmShot('probe-06-reduced-motion-a')
  const on = arcSummary(await arcsOver(500))
  await mmShot('probe-06-reduced-motion-b')
  note(`TC-08 objective ring over 500 ms: reduced motion off ${JSON.stringify(off)}; on ${JSON.stringify(on)}`)
  check('TC-08 control: the pulse radius moves with reduced motion off', off.n > 1 && off.rMax > off.rMin, JSON.stringify(off))
  check('TC-08 reduced motion on: one steady ring (constant radius, alpha 0.7)', fr.reducedMotion === true && on.n > 1 && on.rMax === on.rMin && on.alphas.length === 1 && on.alphas[0] === 0.7, JSON.stringify(on))
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
} finally {
  note(`errors: ${JSON.stringify(errs)}`)
  note(fails === 0 && errs.length === 0 ? 'ALL PASS' : `FAILS: ${fails}`)
  writeFileSync(OUT + 'probe-output.txt', log.join('\n') + '\n')
  await browser.close()
}
