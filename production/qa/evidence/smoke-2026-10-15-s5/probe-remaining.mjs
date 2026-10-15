// Follow-up to p5: observe the Research screen between a t change and the next clock sync.
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'
const { browser, page } = await L.open()
await L.newOperation(page)
await page.locator('[aria-label="RESEARCH"]').first().click(); await page.waitForTimeout(700); await L.dismiss(page)
const out = await page.evaluate(async () => {
  const A = (await import('/src/state/appStore.ts')).useAppStore
  const M = await import('/src/game/research.ts')
  const W = (await import('/src/state/worldStore.ts')).useWorldStore
  const S = (await import('/src/state/researchStore.ts')).useResearchStore
  A.getState().authorizeResearch(M.nodeById('b-propellants'), W.getState().t)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  await new Promise((r) => setTimeout(r, 400)) // let the clock sync and paint
  const q = () => [...document.querySelectorAll('[data-testid="rs-remaining"]')].map((e) => +e.dataset.remainingSec)
  const synced = { t: W.getState().t, lastSyncT: S.getState().lastSyncT, labels: q() }
  // Harness assist: move t by 60 s; read the DOM after React commits but before the next rAF.
  W.setState({ t: W.getState().t + 60 })
  await new Promise((r) => setTimeout(r, 0))
  const moved = { t: W.getState().t, lastSyncT: S.getState().lastSyncT, labels: q() }
  await new Promise((r) => setTimeout(r, 400))
  const resynced = { t: W.getState().t, lastSyncT: S.getState().lastSyncT, labels: q() }
  return { synced, moved, resynced }
})
console.log(JSON.stringify(out))
writeFileSync(L.OUT + 'probe-remaining.json', JSON.stringify(out, null, 1))
await browser.close()
