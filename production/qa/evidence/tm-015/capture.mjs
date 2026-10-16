// TM-015 manual half (AC 22 visual, AC 21 minimap on Hardened): the camera
// pose does not change after mouse drag, wheel or arrow keys, minimap up is
// screen up, and the Hardened minimap still draws patrol cones. Drives the
// real app through the smoke harness (Chrome for Testing via Playwright,
// viewport 1280x720) on the dev server.
// Harness assist, named: difficulty is set to Hardened through
// settingsStore.setDifficulty (the action the Settings button calls) before
// deploy; shot 06 shows the Settings panel with HARDENED pressed.
// Pose reading: CameraRig publishes the ground footprint of the four screen
// corners every frame (game/runtime getCameraFootprint). Its edge bearing
// gives the yaw, and its shape ratios are fixed by elevation and FOV alone:
// pan moves it and zoom scales it, but neither changes the ratios.
import * as L from '../smoke-2026-10-15-s6/lib.mjs'
import { writeFileSync } from 'fs'
const OUT = new URL('.', import.meta.url).pathname
const { browser, page, errs } = await L.open()
const log = { steps: [] }
const pose = (label) =>
  page.evaluate(async (label) => {
    const rt = await import('/src/game/runtime.ts')
    const f = rt.getCameraFootprint()
    const c = rt.getCameraFocus()
    if (!f || !c) return { label, error: 'no footprint' }
    const [tl, tr, br, bl] = f.map((p) => ({ x: p.x, z: p.z }))
    const len = (a, b) => Math.hypot(b.x - a.x, b.z - a.z)
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 })
    const botW = len(bl, br)
    const r4 = (n) => +n.toFixed(4)
    return {
      label,
      focus: { x: r4(c.x), z: r4(c.z) },
      // Bearing of screen-right on the ground, degrees (yaw 45° → -45).
      rightEdgeDeg: r4((Math.atan2(br.z - bl.z, br.x - bl.x) * 180) / Math.PI),
      // Bearing of screen-up on the ground, degrees (yaw 45° → -135).
      upDeg: r4((Math.atan2(mid(tl, tr).z - mid(bl, br).z, mid(tl, tr).x - mid(bl, br).x) * 180) / Math.PI),
      topOverBottom: r4(len(tl, tr) / botW),
      depthOverBottom: r4(len(mid(tl, tr), mid(bl, br)) / botW),
      bottomWidthM: r4(botW),
    }
  }, label)
const shot = async (file, label) => {
  await page.screenshot({ path: OUT + file })
  const p = await pose(label)
  p.file = file
  log.steps.push(p)
  return p
}
try {
  await L.newOperation(page)
  await page.evaluate(async () => (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setDifficulty('hardened'))
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL')
  await page.waitForTimeout(3000)
  log.mission = await page.evaluate(async () => {
    const w = (await import('/src/game/runtime.ts')).getWorld()
    const S = (await import('/src/state/settingsStore.ts')).useSettingsStore.getState()
    const P = await import('/src/game/missionParams.ts')
    const T = await import('/src/game/types.ts')
    const std = P.missionMods(w.mission, undefined, 'standard')
    const enemies = w.units.filter((u) => u.kind === 'enemy' && u.stance !== 'dead')
    return {
      codename: w.mission.codename,
      weather: w.mission.weather,
      difficulty: S.difficulty,
      vision: +w.vision.toFixed(4),
      standardVision: +(T.ENEMY_VISION * std.visionMul).toFixed(4),
      enemies: enemies.length,
      patrolling: enemies.filter((u) => u.aiState === 'patrol' && (u.patrol?.length ?? 0) > 0).length,
      cameraYawDeg: (T.CAMERA_YAW * 180) / Math.PI,
    }
  })
  const box = await page.locator('canvas').first().boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // Drag: 01 before, 02 after.
  await shot('01-hardened-before-drag-1280x720.png', 'before drag')
  await page.mouse.move(cx - 120, cy - 60)
  await page.mouse.down()
  await page.mouse.move(cx + 80, cy + 40, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(1500)
  await shot('02-hardened-after-drag-1280x720.png', 'after drag')

  // Wheel: 02 before, 03 after.
  await page.mouse.move(cx, cy)
  await page.mouse.wheel(0, 500)
  await page.waitForTimeout(1500)
  await shot('03-hardened-after-wheel-1280x720.png', 'after wheel out')

  // Arrow keys: 03 before, 04 after.
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(600)
  await page.keyboard.up('ArrowUp')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(600)
  await page.keyboard.up('ArrowRight')
  await page.waitForTimeout(1500)
  await shot('04-hardened-after-arrows-1280x720.png', 'after arrows up+right')

  // Hardened minimap: calm guards draw a cone only while painted, so fire
  // GHOST's Pulse Scan through the HUD keys (2 selects GHOST, Q is the
  // ability), then take the frame and a crop of the minimap.
  await page.keyboard.press('Digit2')
  await page.waitForTimeout(200)
  await page.keyboard.press('KeyQ')
  await page.waitForTimeout(800)
  log.scan = await page.evaluate(async () => {
    const w = (await import('/src/game/runtime.ts')).getWorld()
    const enemies = w.units.filter((u) => u.kind === 'enemy' && u.stance !== 'dead' && u.hp > 0)
    return {
      scanOn: w.scanUntil > w.time,
      simTime: +w.time.toFixed(2),
      scanUntil: +w.scanUntil.toFixed(2),
      conesDrawn: enemies.length,
      byState: enemies.reduce((m, u) => ((m[u.aiState] = (m[u.aiState] ?? 0) + 1), m), {}),
    }
  })
  await shot('05-hardened-pulse-scan-cones-1280x720.png', 'pulse scan')
  await page.locator('.minimap-canvas').screenshot({ path: OUT + '05b-hardened-minimap-cones-crop.png' })

  // Difficulty on screen: pause, open Settings, HARDENED pressed.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.locator('[aria-label="Open settings"]').click()
  await page.waitForTimeout(500)
  await page.locator('[aria-label="Difficulty HARDENED"]').scrollIntoViewIfNeeded()
  log.hardenedPressed = await page.locator('[aria-label="Difficulty HARDENED"]').getAttribute('aria-pressed')
  await page.screenshot({ path: OUT + '06-settings-hardened-pressed-1280x720.png' })
  log.viewport = page.viewportSize()
} finally {
  log.errs = errs
  writeFileSync(OUT + 'capture.json', JSON.stringify(log, null, 1))
  console.log(JSON.stringify(log, null, 1))
  await browser.close()
}
