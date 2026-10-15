// Sprint 6 smoke (Persistence and validation). Real UI flow in headed Chrome for
// Testing at 1280x720 against the dev server. Harness assists are named per step.
import * as L from './lib.mjs'
import { writeFileSync } from 'fs'
const R = { steps: [] }
const step = (name, data) => { R.steps.push({ name, ...data }); console.log('##', name, JSON.stringify(data)) }
const { browser, page, errs } = await L.open()
const shot = (n) => page.screenshot({ path: L.OUT + n + '-1280x720.png' })
const KEY = 'nexus-save-v1'
const menuStatus = () => page.getAttribute('.screen.menu', 'data-save-status').catch(() => null)
const blob = () => page.evaluate((k) => localStorage.getItem(k), KEY)
const filing = () => page.evaluate(async () => { const S = (await import('/src/state/saveStatusStore.ts')).useSaveStatusStore.getState(); return { status: S.status, reason: S.reason } })
const tele = () => page.evaluate(() => { const k = Object.keys(localStorage).filter((x) => /tele/i.test(x)); return k.map((x) => { try { const v = JSON.parse(localStorage.getItem(x)); return [x, Array.isArray(v) ? v.length : Array.isArray(v?.records) ? v.records.length : typeof v] } catch { return [x, 'unparsed'] } }) })
const body = () => page.innerText('body')
const settle = (ms = 900) => page.waitForTimeout(ms)
const slim = (s) => ({ phase: s.phase, credits: s.credits, contractsWon: s.contractsWon, roster: s.roster, t: s.t, missionId: s.missionId, campaignWon: s.campaignWon, campaignFailed: s.campaignFailed })
async function reloadToMenu() { await page.reload(); await settle(1200); await L.dismiss(page); await L.tagPhases(page) }
async function continueClick() { await page.locator('[aria-label^="CONTINUE SAVED OPERATION"]').click(); await settle(1200); await L.dismiss(page); await L.tagPhases(page) }
async function winMission() {
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL'); await L.setPhaseTag(page, 'mission'); await settle(1000)
  const p = await L.play(page, { god: true, ff: 2, budgetMs: 420000 })
  await L.waitDebrief(page); await L.setPhaseTag(page, 'debrief')
  return p
}
const guard = async (name, fn) => { try { await fn() } catch (e) { step(name + ':ERROR', { error: String(e).slice(0, 400) }); await shot('err-' + name.replace(/\W+/g, '-')).catch(() => {}) } }

try {
  // 1 launch + clean origin (PV-001)
  await guard('s1-clean-origin', async () => {
    await page.goto(L.URL); await page.evaluate(() => localStorage.clear()); await reloadToMenu()
    const b = await L.btns(page)
    step('s1-clean-origin', { status: await menuStatus(), hasContinue: b.some((x) => /^CONTINUE SAVED/.test(x)), buttons: b, blob: await blob() })
    await shot('s1-menu-never-started')
  })

  // 2 corrupted blob (PV-008): non-JSON, then schema failure
  await guard('s2-invalid-blob', async () => {
    for (const [tag, raw] of [['non-json', '{not json'], ['schema', JSON.stringify({ version: 10, nope: 1 })]]) {
      await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, raw]); await reloadToMenu()
      const b = await L.btns(page)
      step('s2-invalid-' + tag, { status: await menuStatus(), hasContinue: b.some((x) => /^CONTINUE SAVED/.test(x)), blobAfterBoot: await blob() })
      if (tag === 'non-json') await shot('s2-menu-invalid')
    }
    await reloadToMenu()
    step('s2-after-second-reload', { status: await menuStatus() })
  })

  // 3 new campaign; telemetry on (harness assist: settings store) ; win a mission, Debrief shows unfiled (PV-006/007/017)
  let S0, S1
  await guard('s3-debrief-unfiled', async () => {
    await page.evaluate(() => localStorage.clear()); await page.reload(); await settle(800)
    await page.getByText('NEW OPERATION').first().click(); await settle(1200); await L.dismiss(page); await L.tagPhases(page)
    await page.evaluate(async () => (await import('/src/state/settingsStore.ts')).useSettingsStore.setState({ telemetry: true }))
    await settle(900)
    S0 = slim(await L.state(page))
    const p = await winMission()
    const o = await L.outcome(page); const txt = await body(); const blobAtDebrief = await blob(); await settle(2500)
    step('s3-debrief', { play: p?.error ?? 'ok', outcome: o, filing: await filing(), unfiledLine: /INVOICE UNFILED \/\/ COMMITS ON NEXT SCREEN/.test(txt), blobUnchangedWhileDebriefOpen: (await blob()) === blobAtDebrief, S0, telemetry: await tele() })
    await shot('s3-debrief-unfiled')
    // 4 reload while on Debrief: Continue restores S0, not the invoice (PV-006 AC1)
    await reloadToMenu()
    const st = await menuStatus(); await continueClick()
    const after = slim(await L.state(page))
    step('s4-reload-on-debrief', { menuStatus: st, durableFieldsEqualS0: after.credits === S0.credits && JSON.stringify(after.contractsWon) === JSON.stringify(S0.contractsWon) && JSON.stringify(after.roster) === JSON.stringify(S0.roster), phaseWorld: after.phase === 'world', outcomeNull: (await L.outcome(page)) === null, selectedContract: after.missionId, after, S0 })
  })

  // 5 win again, leave Debrief: filed; reload restores post-apply once (PV-007)
  await guard('s5-filed-after-next-screen', async () => {
    await winMission()
    const pre = await filing(); const applied = slim(await L.state(page))
    await L.leaveDebrief(page); await L.setPhaseTag(page, 'world'); await settle(1500)
    S1 = slim(await L.state(page))
    const post = await filing(); const b1 = await blob()
    await reloadToMenu(); await continueClick()
    const restored = slim(await L.state(page))
    step('s5-filed', { filingAtDebrief: pre, filingAfterWorld: post, appliedAtDebrief: applied, S1, restored, restoredEqualsS1: JSON.stringify({ ...restored, t: 0, missionId: 0 }) === JSON.stringify({ ...S1, t: 0, missionId: 0 }), missionIdAfterDebriefReturn: S1.missionId, missionIdAfterContinue: restored.missionId, creditsOnce: restored.credits === S1.credits, blobPresent: !!b1 })
    await shot('s5-world-after-continue')
  })

  // 6 mid-mission reload (PV-005 AC1)
  await guard('s6-mid-mission-reload', async () => {
    const before = await blob(); const S = slim(await L.state(page))
    await L.deploy(page, 'OPEN CONTRACT GLASS VEIL'); await L.setPhaseTag(page, 'mission'); await settle(1500)
    const atMissionStart = await blob(); await settle(2500)
    const during = (await blob()) === atMissionStart
    await reloadToMenu(); await continueClick()
    const r = slim(await L.state(page))
    step('s6-mid-mission', { blobUnchangedDuringMission: during, restored: r, S, durableEqual: r.credits === S.credits && JSON.stringify(r.contractsWon) === JSON.stringify(S.contractsWon) && JSON.stringify(r.roster) === JSON.stringify(S.roster), selectedContract: r.missionId, noMissionRunning: !(await page.evaluate(async () => !!(await import('/src/game/runtime.ts')).getWorld())), outcomeNull: (await L.outcome(page)) === null, phase: r.phase })
  })

  // 7 Balance panel from Settings (PV-015/016) with a won log
  await guard('s7-balance', async () => {
    await page.locator('[aria-label="WORLD NETWORK"]').click().catch(() => {})
    await reloadToMenu()
    await page.locator('[aria-label^="OPEN SETTINGS"]').click(); await settle(600)
    await page.locator('[aria-label="Open the balance dashboard"]').click(); await settle(600)
    const txt = await body(); await shot('s7-balance-won-log')
    step('s7-balance', { records: (txt.match(/(\d+)\/60 RECORDS/) || [])[0], winRate: (txt.match(/WIN RATE\s*\n?\s*([^\n]+)/) || [])[1], text: txt.slice(txt.indexOf('BALANCE DATA'), txt.indexOf('BALANCE DATA') + 600) })
    // export
    const dl = page.waitForEvent('download', { timeout: 4000 }).catch(() => null)
    await page.locator('[aria-label="Export the telemetry records as JSON"]').click()
    const d = await dl
    step('s7-export', { download: d ? d.suggestedFilename() : null })
    // two-step clear: arm, lapse, arm+confirm
    const clr = page.locator('button:has-text("CLEAR"), button:has-text("CONFIRM // ERASE RECORDS?")').first()
    await clr.click(); await settle(200)
    const armed1 = await clr.innerText(); const recs1 = (await body()).match(/(\d+)\/60 RECORDS/)?.[1]
    await settle(3600)
    const lapsed = await clr.innerText(); const recs2 = (await body()).match(/(\d+)\/60 RECORDS/)?.[1]
    await clr.click(); await settle(200); await clr.click(); await settle(500)
    const t3 = await body()
    step('s7-clear', { armedLabel: armed1, recsWhileArmed: recs1, lapsedLabel: lapsed, recsAfterLapse: recs2, afterConfirmEmpty: /NO MISSION RECORDS/.test(t3), records: t3.match(/(\d+)\/60 RECORDS/)?.[1] })
    await shot('s7-balance-cleared')
    await page.locator('button:has-text("CLOSE")').first().click(); await settle(300)
    await page.locator('button:has-text("CLOSE"), [aria-label*="Close" i]').first().click().catch(() => {})
  })

  // 8 abort-only log: win rate no-data marker (PV-015); Abort restores S (PV-005 AC2)
  await guard('s8-abort', async () => {
    await reloadToMenu(); await continueClick()
    const S = slim(await L.state(page))
    const telemetryOn = await page.evaluate(async () => (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().telemetry)
    await page.evaluate(async () => (await import('/src/state/settingsStore.ts')).useSettingsStore.setState({ telemetry: true }))
    await L.deploy(page, 'OPEN CONTRACT GLASS VEIL'); await L.setPhaseTag(page, 'mission'); await settle(1500)
    const atStart = await blob(); await settle(1500)
    await page.keyboard.press('Escape'); await settle(500)
    await page.locator('[aria-label="Abort mission"]').click(); await settle(300)
    await page.locator('[aria-label="Confirm abort mission"]').click(); await settle(1500); await L.dismiss(page)
    const afterAbort = slim(await L.state(page)); const blobSame = (await blob()) === atStart; const nonWorld = (b) => { const o = JSON.parse(b); delete o.world; return JSON.stringify(o) }; const nonWorldEqual = nonWorld(await blob()) === nonWorld(atStart)
    await reloadToMenu(); await continueClick()
    const r = slim(await L.state(page))
    step('s8-abort', { afterAbort, telemetrySettingBeforeAssist: telemetryOn, blobIdenticalAfterAbort: blobSame, blobEqualExceptWorldClock: nonWorldEqual, restored: r, durableEqualS: r.credits === S.credits && JSON.stringify(r.contractsWon) === JSON.stringify(S.contractsWon) && JSON.stringify(r.roster) === JSON.stringify(S.roster), selectedContract: r.missionId, telemetry: await tele() })
    await page.locator('[aria-label="WORLD NETWORK"]').click().catch(() => {})
    await reloadToMenu()
    await page.locator('[aria-label^="OPEN SETTINGS"]').click(); await settle(600)
    await page.locator('[aria-label="Open the balance dashboard"]').click(); await settle(600)
    const txt = await body(); await shot('s8-balance-abort-only')
    step('s8-balance-abort-only', { text: txt.slice(txt.indexOf('CAMPAIGN AGGREGATES'), txt.indexOf('CAMPAIGN AGGREGATES') + 400) })
    await page.locator('button:has-text("CLOSE")').first().click().catch(() => {})
  })

  // 9 New Operation arm / lapse / confirm; settings + telemetry survive (PV-002/003/014)
  await guard('s9-new-operation', async () => {
    await reloadToMenu()
    await page.evaluate(async () => (await import('/src/state/settingsStore.ts')).useSettingsStore.setState({ telemetry: true }))
    await settle(600)
    const settingsBefore = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)?.length])))
    const sBlob = await blob(); const teleBefore = await tele()
    const btn = page.locator('button[aria-label$="NEW OPERATION"], button[aria-label^="CONFIRM NEW OPERATION"]').first()
    await btn.click(); await settle(200)
    const armed = await btn.getAttribute('aria-label')
    await settle(3600)
    const lapsed = await btn.getAttribute('aria-label'); const sameBlob = (await blob()) === sBlob
    await shot('s9-new-operation-armed').catch(() => {})
    await btn.click(); await settle(200); await btn.click(); await settle(1500); await L.dismiss(page)
    const st = slim(await L.state(page))
    step('s9-new-operation', { armed, lapsed, blobUnchangedByArmAndLapse: sameBlob, afterConfirm: st, filing: await filing(), teleBefore, teleAfter: await tele(), keysBefore: settingsBefore, keysAfter: await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)?.length]))) })
  })

  // 10 write failure (PV-018). Harness assist: localStorage.setItem patched to throw for the save key only.
  await guard('s10-write-failure', async () => {
    await page.evaluate((k) => { const o = Storage.prototype.setItem; window.__origSet = o; Storage.prototype.setItem = function (key, v) { if (key === k) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e } return o.call(this, key, v) } }, KEY)
    await page.evaluate(async () => { const A = (await import('/src/state/appStore.ts')).useAppStore; A.setState({ credits: A.getState().credits + 1 }) })
    await settle(1200)
    const f = await filing(); const txt = await body()
    await shot('s10-write-failed-notice')
    step('s10-write-failure', { filing: f, noticeShown: /SAVE FAILED \/\/ CAMPAIGN NOT FILED/.test(txt), pageErrors: errs.filter((e) => /pageerror/.test(e)).length })
    await page.evaluate(() => { Storage.prototype.setItem = window.__origSet })
  })

  // 11 RS-020: Brief chance moves with completed research, risk index does not
  await guard('s11-brief-chance', async () => {
    await page.evaluate(() => localStorage.clear()); await page.reload(); await settle(800)
    await page.getByText('NEW OPERATION').first().click(); await settle(1200); await L.dismiss(page)
    await page.evaluate(async () => (await import('/src/state/researchStore.ts')).useResearchStore.setState({ done: [] }))
    await page.locator('[aria-label="WORLD NETWORK"]').click().catch(() => {})
    for (let i = 0; i < 10 && !(await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().isVisible().catch(() => false)); i++) { await page.locator('[aria-label="FOCUS NEXT SECTOR"]').click().catch(() => {}); await settle(1500) }
    await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().click(); await settle(900)
    const read = async () => { const t = await body(); return { chance: (t.match(/PROJECTED SUCCESS\s*\n?\s*(\d+)%/) || [])[1] ?? null, risk: (t.match(/RISK INDEX\s*\n?\s*([^\n]+)/) || [])[1] ?? null } }
    const r0 = await read(); await shot('s11-brief-0-research')
    // Harness assist: campaignStore.intelLevel = 2 so the Brief shows the Risk index in place of Chance.
    await page.evaluate(async () => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: 2 })); await settle(500)
    const rIntel2 = await read(); await shot('s11-brief-intel2-0-research')
    await page.evaluate(async () => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: 1 })); await settle(300)
    const ids = await page.evaluate(async () => { const M = await import('/src/game/research.ts'); return M.NODES.slice(0, 3).map((n) => n.id) })
    const out = [r0]
    for (let n = 1; n <= 3; n++) { await page.evaluate(async (d) => (await import('/src/state/researchStore.ts')).useResearchStore.setState({ done: d }), ids.slice(0, n)); await settle(500); out.push(await read()) }
    await shot('s11-brief-3-research')
    await page.evaluate(async () => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: 2 })); const risk3 = []
    for (let n = 0; n <= 3; n++) { await page.evaluate(async (d) => (await import('/src/state/researchStore.ts')).useResearchStore.setState({ done: d }), ids.slice(0, n)); await settle(400); risk3.push(await read()) }
    step('s11-brief-chance', { ids, chanceReadings_intel1: out, riskReadings_intel2: risk3, rIntel2 })
  })

  // 12 frame spikes by phase
  const frames = await page.evaluate(() => { const by = {}; for (const [t, d, ph] of window.__frames) { (by[ph] ||= []).push(d) } const o = {}; for (const [ph, a] of Object.entries(by)) { a.sort((x, y) => x - y); o[ph] = { n: a.length, p50: +a[Math.floor(a.length * 0.5)].toFixed(1), p95: +a[Math.floor(a.length * 0.95)].toFixed(1), max: +a[a.length - 1].toFixed(1), over50ms: a.filter((x) => x > 50).length } } return { byPhase: o, spikes: window.__frames.filter(([, d]) => d > 100).map(([t, d, ph]) => [Math.round(t), Math.round(d), ph]).slice(0, 40), long: window.__long.map(([t, d, ph]) => [Math.round(t), Math.round(d), ph]).slice(0, 40) } })
  step('s12-frames', frames)
} finally {
  R.errors = errs
  writeFileSync(L.OUT + 'scenario.json', JSON.stringify(R, null, 2))
  await browser.close()
}
console.log('ERRS', errs.length, JSON.stringify(errs.slice(0, 10)))
