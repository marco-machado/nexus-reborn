// Sprint 5 smoke (Research). Real UI flow in headed Chrome for Testing at
// 1280x720 against the dev server. Harness assists are named in each step.
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'
const R = { steps: [] }
const step = (name, data) => { R.steps.push({ name, ...data }); console.log('##', name, JSON.stringify(data)) }
const { browser, page, errs } = await L.open()
const shot = (n) => page.screenshot({ path: L.OUT + n + '-1280x720.png' })
const ev = (fn, arg) => page.evaluate(fn, arg)
const rs = () => ev(async () => {
  const S = (await import('/src/state/researchStore.ts')).useResearchStore.getState()
  const W = (await import('/src/state/worldStore.ts')).useWorldStore.getState()
  const A = (await import('/src/state/appStore.ts')).useAppStore.getState()
  return { done: [...S.done], labs: JSON.parse(JSON.stringify(S.labs)), lastSyncT: S.lastSyncT, t: W.t, credits: A.credits, phase: A.phase }
})
const title = (id) => ev(async (id) => { const M = await import('/src/game/research.ts'); return M.nodeTitle(M.nodeById(id)) }, id)
const pause = (p) => ev(async (p) => (await import('/src/state/worldStore.ts')).useWorldStore.setState({ paused: p }), p)
// Harness assist: move strategic t without a sync (the clock is paused).
const setT = (t) => ev(async (t) => (await import('/src/state/worldStore.ts')).useWorldStore.setState({ t }), t)
const sync = (t) => ev(async (t) => (await import('/src/state/researchStore.ts')).useResearchStore.getState().sync(t), t)
async function openResearch() {
  await page.locator('[aria-label="RESEARCH"]').first().click(); await page.waitForTimeout(700); await L.dismiss(page)
}
async function select(id) {
  const t = await title(id)
  await page.locator(`[aria-label^="${t} //"]`).first().click(); await page.waitForTimeout(300)
  return t
}
const authBtn = async (t) => {
  const b = page.locator(`[aria-label^="AUTHORIZE ${t} //"]`).first()
  return { label: await b.getAttribute('aria-label'), disabled: await b.isDisabled() }
}
const labelInfo = () => ev(() => [...document.querySelectorAll('[data-testid="rs-remaining"]')].map((e) => ({ sec: +e.dataset.remainingSec, text: e.textContent })))

try {
  // 1-2 launch, new campaign, Research catalog
  const t0 = await L.now(page)
  await L.newOperation(page)
  step('p1-launch', { phase: (await rs()).phase, credits: (await rs()).credits })
  await L.setPhaseTag(page, 'world'); await page.waitForTimeout(4000)
  const fWorld = await L.frames(page, t0, await L.now(page))
  await openResearch(); await L.setPhaseTag(page, 'research')
  const cat = await ev(() => ({ nodes: document.querySelectorAll('.rs-node').length, labs: [...document.querySelectorAll('[aria-label*=" RUNNING "], .rs-lab, .rs-bay')].length }))
  const catalog = await ev(async () => { const M = await import('/src/game/research.ts'); return { labs: M.BRANCHES.length, projects: M.NODES.length } })
  await shot('p2-research')
  step('p2-catalog', { screenNodes: cat.nodes, ...catalog })

  // 3 authorize via the UI: Targeting AI Suite at t0, Advanced Propellants 1h later (RS-002)
  await pause(true)
  const s0 = await rs()
  const tk = await select('k-targeting'); const costK = await ev(async () => (await import('/src/game/research.ts')).nodeById('k-targeting').cost)
  await page.locator(`[aria-label^="AUTHORIZE ${tk} //"]`).first().click(); await page.waitForTimeout(400)
  const s1 = await rs()
  await setT(s1.t + 3600); await sync(s1.t + 3600)
  const tb = await select('b-propellants')
  await page.locator(`[aria-label^="AUTHORIZE ${tb} //"]`).first().click(); await page.waitForTimeout(400)
  const s2 = await rs()
  step('p3-authorize', { creditsBefore: s0.credits, afterTargeting: s1.credits, targetingCost: costK, afterPropellants: s2.credits, propellantsDebit: s1.credits - s2.credits, labs: s2.labs })
  // refusals on the screen: locked and busy-lab (Authorize disabled, cause named)
  const hv = await select('b-hypervelocity'); const locked = await authBtn(hv)
  const bw = await select('b-coating'); const busy = await authBtn(bw)
  // Harness assist: the store action itself, as the disabled button cannot be pressed
  const storeRefusal = await ev(async () => { const A = (await import('/src/state/appStore.ts')).useAppStore; const M = await import('/src/game/research.ts'); const W = (await import('/src/state/worldStore.ts')).useWorldStore; const c = A.getState().credits; const r = A.getState().authorizeResearch(M.nodeById('b-hypervelocity'), W.getState().t); return { ...r, creditsFlat: A.getState().credits === c } })
  step('p3-refusals', { locked, busy, storeRefusal, creditsAfter: (await rs()).credits })
  await shot('p3-refusal-locked')

  // 5 remaining label only after sync (RS-009), then ascending endT (RS-011)
  const s3 = await rs()
  const before = await labelInfo()
  await setT(s3.t + 60)
  await page.waitForTimeout(300)
  const afterMove = await labelInfo()
  await sync(s3.t + 60); await page.waitForTimeout(300)
  const afterSync = await labelInfo()
  const endTs = Object.values((await rs()).labs).filter(Boolean).map((r) => r.endT)
  await shot('p5-remaining-after-sync')
  step('p5-remaining', { t: s3.t + 60, lastSyncTBefore: s3.lastSyncT, labelsBeforeMove: before, labelsAfterMoveNoSync: afterMove, labelsAfterSync: afterSync, expectedSec: endTs.map((e) => e - (s3.t + 60)) })
  // Harness assist: jump strategic t a day and let the screen clock sync it.
  await setT(s3.t + 86400); await pause(false); await page.waitForTimeout(1500); await pause(true)
  const s4 = await rs()
  step('p5-ascending-endT', { done: s4.done, labs: s4.labs, expected: ['k-targeting', 'b-propellants'] })
  const ap = await select('b-propellants'); const researched = await authBtn(ap)
  step('p3-researched-refusal', { researched })

  // research a slotted project (Neural Interface I) and start one more to keep a lab running
  const ti = await select('c-interface'); await page.locator(`[aria-label^="AUTHORIZE ${ti} //"]`).first().click(); await page.waitForTimeout(300)
  const s5 = await rs(); await setT(s5.t + 86400); await pause(false); await page.waitForTimeout(1500); await pause(true)
  const tsyn = await select('c-synaptic'); await page.locator(`[aria-label^="AUTHORIZE ${tsyn} //"]`).first().click(); await page.waitForTimeout(300)
  // Harness assist: pin the first squad operative's Neural bay to STOCK (Roster setBay).
  const pinned = await ev(async () => { const A = (await import('/src/state/appStore.ts')).useAppStore.getState(); const C = (await import('/src/state/campaignStore.ts')).useCampaignStore; const id = A.squad[0]; C.getState().setBay(id, 'NEURAL', 'STOCK'); return id })
  const pre = await rs()
  step('p6-pre-deploy', { done: pre.done, labs: pre.labs, pinnedOp: pinned, t: pre.t })
  await pause(false)

  // 6 + 4 + 7(abort): deploy, check stats, authorize in field, abort
  const statCheck = () => ev(async () => {
    const rt = await import('/src/game/runtime.ts'); const M = await import('/src/game/research.ts'); const D = await import('/src/game/data.ts')
    const A = (await import('/src/state/appStore.ts')).useAppStore.getState(); const C = (await import('/src/state/campaignStore.ts')).useCampaignStore.getState(); const S = (await import('/src/state/researchStore.ts')).useResearchStore.getState()
    const w = rt.getWorld(); if (!w) return null
    const agents = w.units.filter((u) => u.kind === 'agent')
    return agents.map((u, i) => { const opId = A.squad[i]; const op = D.operativeById(opId); const applied = M.appliedNodeIds(S.done, C.roster[opId]?.pins); const cb = M.crewBonus(applied); const xp = C.roster[opId]?.xp ?? 0; return { opId, applied, maxHp: u.maxHp, expectHp: op.maxHp + cb.maxHp, xp, speed: +u.speed.toFixed(3), expectSpeedMin: +(op.speed + cb.speed).toFixed(3), damage: +u.weapon.damage.toFixed(2), tableDamage: +M.squadWeapon(op.weapon, []).damage.toFixed(2), researchedDamage: +M.squadWeapon(op.weapon, applied).damage.toFixed(2) } })
  })
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL'); await L.setPhaseTag(page, 'mission'); await page.waitForTimeout(1500)
  const stats1 = await statCheck()
  const fieldAuth = await ev(async () => { const A = (await import('/src/state/appStore.ts')).useAppStore; const M = await import('/src/game/research.ts'); const W = (await import('/src/state/worldStore.ts')).useWorldStore; const c = A.getState().credits; const r = A.getState().authorizeResearch(M.nodeById('k-sensor'), W.getState().t); return { ...r, creditsFlat: A.getState().credits === c, phase: A.getState().phase } })
  step('p6-stats', { stats: stats1 })
  step('p4-authorize-in-field', fieldAuth)
  await page.locator('[aria-label="Pause and open the menu"]').click(); await page.waitForTimeout(500)
  await page.locator('[aria-label="Abort mission"]').click(); await page.waitForTimeout(300)
  await page.locator('[aria-label="Confirm abort mission"]').click(); await page.waitForTimeout(1500); await L.dismiss(page)
  const postAbort = await rs()
  step('p7-abort', { phase: postAbort.phase, doneSame: JSON.stringify(postAbort.done) === JSON.stringify(pre.done), labsSame: JSON.stringify(postAbort.labs) === JSON.stringify(pre.labs), labs: postAbort.labs, credits: postAbort.credits, creditsBefore: pre.credits })

  // 7 loss: labs and done unchanged, t not advanced by the loss
  await pause(true); const preLoss = await rs(); await pause(false)
  const mStart = await L.now(page)
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL'); await L.setPhaseTag(page, 'mission')
  const play = await L.play(page, { wipe: true, ff: 2, budgetMs: 300000 })
  const fMission = await L.frames(page, mStart, await L.now(page))
  await L.waitDebrief(page); await L.setPhaseTag(page, 'debrief')
  const postLoss = await rs(); const oc = await L.outcome(page)
  await shot('p7-loss-debrief')
  step('p7-loss', { play: play.result, outcomeWon: oc?.won, doneSame: JSON.stringify(postLoss.done) === JSON.stringify(preLoss.done), labsSame: JSON.stringify(postLoss.labs) === JSON.stringify(preLoss.labs), tBefore: preLoss.t, tAfter: postLoss.t, credits: [preLoss.credits, postLoss.credits] })
  await L.leaveDebrief(page); await L.setPhaseTag(page, 'world')

  // 6b mid-mission completion does not change the running mission (RS-017)
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL'); await page.waitForTimeout(1500)
  const a = await statCheck()
  // Harness assist: force a Research sync far ahead while the mission runs.
  const forced = await ev(async () => { const S = (await import('/src/state/researchStore.ts')).useResearchStore; const W = (await import('/src/state/worldStore.ts')).useWorldStore; S.getState().sync(W.getState().t + 30 * 86400); return [...S.getState().done] })
  await page.waitForTimeout(800)
  const b = await ev(async () => { const rt = await import('/src/game/runtime.ts'); return rt.getWorld().units.filter((u) => u.kind === 'agent').map((u) => ({ maxHp: u.maxHp, speed: +u.speed.toFixed(3), damage: +u.weapon.damage.toFixed(2) })) })
  step('p6-midmission-completion', { doneAfterForcedSync: forced, before: a.map((x) => ({ maxHp: x.maxHp, speed: x.speed, damage: x.damage })), after: b })
  await page.locator('[aria-label="Pause and open the menu"]').click(); await page.waitForTimeout(500)
  await page.locator('[aria-label="Abort mission"]').click(); await page.waitForTimeout(300)
  await page.locator('[aria-label="Confirm abort mission"]').click(); await page.waitForTimeout(1500); await L.dismiss(page)

  // 8 save and reload (autosave on the World Network screen)
  await page.locator('[aria-label="RESEARCH"]').first().click(); await page.waitForTimeout(600)
  await page.locator('[aria-label="WORLD NETWORK"]').first().click(); await page.waitForTimeout(1200)
  await pause(true); const b4 = await rs()
  await page.reload(); await page.waitForTimeout(900)
  await page.locator('[aria-label^="CONTINUE SAVED"]').click(); await page.waitForTimeout(1500); await L.dismiss(page)
  const af = await rs()
  step('p8-reload', { before: { done: b4.done, labs: b4.labs, credits: b4.credits }, after: { done: af.done, labs: af.labs, credits: af.credits, phase: af.phase, lastSyncT: af.lastSyncT, t: af.t } })

  // 9 frames
  await L.tagPhases(page)
  step('p9-frames', { world: fWorld, mission: fMission })
} catch (e) {
  step('error', { message: String(e), stack: String(e.stack).slice(0, 600) })
  await shot('error').catch(() => {})
}
step('console-errors', { errs: errs.filter((e) => !/favicon/.test(e)) , all: errs.length })
writeFileSync(L.OUT + 'scenario.json', JSON.stringify(R, null, 1))
await browser.close()
