// TM-009 manual half (AC 10 presentation): sky frozen while the HUD clock
// ticks, and dusk vs night lighting at open. Drives the real app through the
// smoke harness (headed Chrome for Testing, 1280x720) on the dev server.
// Harness assist, named: run 2 sets campaignStore.intelLevel = 2 so the dusk
// contract RUST HAVEN unlocks; nothing else is constructed.
import * as L from '../smoke-2026-10-15-s6/lib.mjs'
import { writeFileSync } from 'fs'
const OUT = new URL('.', import.meta.url).pathname
const { browser, page, errs } = await L.open()
const log = {}
const read = () =>
  page.evaluate(async () => {
    const w = (await import('/src/game/runtime.ts')).getWorld()
    const P = await import('/src/game/missionParams.ts')
    const clock = (document.body.innerText.match(/\b\d\d:\d\d:\d\d\b/) || [null])[0]
    return w && { codename: w.mission.codename, openingHour: w.mission.openingHour, period: P.missionPeriod(w.mission.openingHour), simTime: +w.time.toFixed(2), weather: w.mission.weather, hudClock: clock, expectedClock: P.missionClockAt(w.time, w.mission.openingHour) }
  })
try {
  await L.newOperation(page)
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL')
  await page.waitForTimeout(3000)
  log.nightA = await read()
  await page.screenshot({ path: OUT + '01-night-open-1280x720.png' })
  await page.waitForTimeout(33000)
  log.nightB = await read()
  await page.screenshot({ path: OUT + '02-night-plus30s-1280x720.png' })
  await page.keyboard.press('Escape'); await page.waitForTimeout(500)
  await page.locator('[aria-label="Abort mission"]').click(); await page.waitForTimeout(300)
  await page.locator('[aria-label="Confirm abort mission"]').click(); await page.waitForTimeout(1500); await L.dismiss(page)
  for (let i = 0; i < 40; i++) { const p = await page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase); if (p !== 'mission') break; await page.waitForTimeout(250) }
  await L.leaveDebrief(page).catch(() => {})
  await page.evaluate(async () => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: 2 }))
  await L.deploy(page, 'OPEN CONTRACT RUST HAVEN')
  await page.waitForTimeout(3000)
  log.dusk = await read()
  await page.screenshot({ path: OUT + '03-dusk-open-1280x720.png' })
} finally {
  log.errs = errs
  writeFileSync(OUT + 'capture.json', JSON.stringify(log, null, 1))
  console.log(JSON.stringify(log, null, 1))
  await browser.close()
}
