// Sprint 6 /team-qa manual cases M-1..M-5, driven by Claude in headed Chrome for
// Testing at 1280x720 against the dev server. Reuses the smoke harness helpers.
// Harness assists are named per step; settings are changed through the UI only.
import * as L from '../smoke-2026-10-15-s6/lib.mjs'
import { writeFileSync, readFileSync, mkdirSync } from 'fs'
const EV = '/Users/machado/Projects/nexus-reborn/production/qa/evidence/'
const HERE = EV + 'team-qa-2026-10-15-s6/'
for (const d of ['pv-003', 'pv-005', 'pv-016', 'pv-017', 'pv-018']) mkdirSync(EV + d, { recursive: true })
const R = { steps: [] }
const step = (name, data) => { R.steps.push({ name, ...data }); console.log('##', name, JSON.stringify(data)) }
const { browser, page, errs } = await L.open()
const shot = (dir, n) => page.screenshot({ path: EV + dir + '/' + n + '-1280x720.png' })
const KEY = 'nexus-save-v1'
const SKEY = 'nexus-settings-v1'
const blob = () => page.evaluate((k) => localStorage.getItem(k), KEY)
const filing = () => page.evaluate(async () => { const S = (await import('/src/state/saveStatusStore.ts')).useSaveStatusStore.getState(); return { status: S.status, reason: S.reason } })
const body = () => page.innerText('body')
const settle = (ms = 900) => page.waitForTimeout(ms)
async function reloadToMenu() { await page.reload(); await settle(1200); await L.dismiss(page); await L.tagPhases(page) }
async function continueClick() { await page.locator('[aria-label^="CONTINUE SAVED OPERATION"]').click(); await settle(1200); await L.dismiss(page); await L.tagPhases(page) }
async function openSettings() { await page.locator('[aria-label^="OPEN SETTINGS"]').click(); await settle(600) }
async function closeOverlay() { await page.locator('button:has-text("CLOSE")').first().click().catch(() => {}); await settle(300) }
const settingsUi = () => page.evaluate(() => {
  const pressed = (sel) => [...document.querySelectorAll(sel)].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.getAttribute('aria-label'))
  return { telemetry: [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label')).find((l) => l?.startsWith('TELEMETRY: LOCAL ONLY')), difficulty: pressed('[aria-label^="Difficulty "]'), quality: pressed('[aria-label^="Render quality "]') }
})
const settingsStored = () => page.evaluate((k) => { try { const v = JSON.parse(localStorage.getItem(k)); return v } catch { return 'unparsed' } }, SKEY)
async function win() {
  await L.deploy(page, 'OPEN CONTRACT GLASS VEIL'); await L.setPhaseTag(page, 'mission'); await settle(1000)
  const p = await L.play(page, { god: true, ff: 2, budgetMs: 420000 })
  await L.waitDebrief(page); await L.setPhaseTag(page, 'debrief')
  return p
}
const guard = async (name, fn) => { try { await fn() } catch (e) { step(name + ':ERROR', { error: String(e).slice(0, 400) }); await page.screenshot({ path: HERE + 'err-' + name.replace(/\W+/g, '-') + '.png' }).catch(() => {}) } }

try {
  // M-3 (PV-003 / PV-013): Settings toggles through the UI persist across reload and New Operation.
  await guard('m3-settings-ui', async () => {
    await page.goto(L.URL); await page.evaluate(() => localStorage.clear()); await reloadToMenu()
    await openSettings()
    const before = await settingsUi()
    await page.locator('[aria-label^="TELEMETRY: LOCAL ONLY"]').click(); await settle(300)
    const diff = page.locator('[aria-label^="Difficulty "][aria-pressed="false"]').first(); const diffLabel = await diff.getAttribute('aria-label'); await diff.click(); await settle(300)
    const q = page.locator('[aria-label^="Render quality "][aria-pressed="false"]').first(); const qLabel = await q.getAttribute('aria-label'); await q.click(); await settle(300)
    const after = await settingsUi(); const storedAfterClick = await settingsStored()
    await shot('pv-003', 'm3-01-settings-changed')
    await closeOverlay()
    await reloadToMenu(); await openSettings()
    const afterReload = await settingsUi()
    await shot('pv-003', 'm3-02-settings-after-reload')
    await closeOverlay()
    step('m3-settings-ui', { before, clicked: { diffLabel, qLabel }, after, storedAfterClick: storedAfterClick && { telemetry: storedAfterClick.telemetry, difficulty: storedAfterClick.difficulty, quality: storedAfterClick.quality }, afterReload, telemetryPersisted: afterReload.telemetry?.endsWith('// ON'), difficultyPersisted: afterReload.difficulty[0] === diffLabel, qualityPersisted: afterReload.quality[0] === qLabel })
    // New Operation through the Menu, then the settings must still read the same.
    await page.getByText('NEW OPERATION').first().click(); await settle(1200); await L.dismiss(page); await L.tagPhases(page)
    await reloadToMenu(); await openSettings()
    const afterNewOp = await settingsUi()
    await closeOverlay()
    step('m3-after-new-operation', { afterNewOp, sameAsAfterReload: JSON.stringify(afterNewOp) === JSON.stringify(afterReload) })
  })

  // M-2 (PV-017): played paid win, then a quiet replay, both show unfiled; next Screen files it.
  // Harness assist: sim-order bot in god mode plays the mission (no store seeding of the Debrief).
  await guard('m2-paid-win', async () => {
    await continueClick()
    const p = await win(); const o = await L.outcome(page); const t = await body()
    await shot('pv-017', 'm2-01-played-paid-win-debrief-unfiled')
    step('m2-paid-win', { play: p, outcome: o, filing: await filing(), unfiledLine: /INVOICE UNFILED \/\/ COMMITS ON NEXT SCREEN/.test(t) })
    await L.leaveDebrief(page); await L.setPhaseTag(page, 'world'); await settle(1500)
    step('m2-paid-win-after-next-screen', { filing: await filing() })
  })
  await guard('m2-quiet-replay', async () => {
    const p = await win(); const o = await L.outcome(page); const t = await body()
    await shot('pv-017', 'm2-02-played-quiet-replay-debrief-unfiled')
    step('m2-quiet-replay', { play: p, outcome: o, filing: await filing(), unfiledLine: /INVOICE UNFILED \/\/ COMMITS ON NEXT SCREEN/.test(t) })
    await L.leaveDebrief(page); await L.setPhaseTag(page, 'world'); await settle(1500)
    const f = await filing()
    await shot('pv-017', 'm2-03-quiet-replay-world-network-filed')
    step('m2-quiet-replay-after-next-screen', { filing: f })
  })

  // M-1 (PV-016): export from played records, open the file, list fields per record.
  await guard('m1-export', async () => {
    await reloadToMenu(); await openSettings()
    await page.locator('[aria-label="Open the balance dashboard"]').click(); await settle(600)
    await shot('pv-016', 'm1-01-balance-played-records')
    const reqs = []; const onReq = (r) => reqs.push(r.url()); page.on('request', onReq)
    const dl = page.waitForEvent('download', { timeout: 5000 }).catch(() => null)
    await page.locator('[aria-label="Export the telemetry records as JSON"]').click()
    const d = await dl; await settle(500); page.off('request', onReq)
    let file = null
    if (d) { file = EV + 'pv-016/m1-nexus-balance-export.json'; await d.saveAs(file) }
    const json = file ? JSON.parse(readFileSync(file, 'utf8')) : null
    const recs = json ? (Array.isArray(json) ? json : json.records ?? []) : []
    step('m1-export', { download: d?.suggestedFilename() ?? null, savedTo: file, topKeys: json && !Array.isArray(json) ? Object.keys(json) : null, recordCount: recs.length, records: recs.map((r) => ({ outcome: r.outcome ?? r.result, keys: Object.keys(r) })), networkRequestsDuringExport: reqs.filter((u) => !u.startsWith('data:') && !u.startsWith('blob:')) })
    await closeOverlay(); await closeOverlay()
  })

  // M-4 (PV-005): record every save-key write with the app phase at that instant across a mission and Abort.
  // Observation only: setItem is wrapped and still calls through.
  await guard('m4-abort', async () => {
    await reloadToMenu(); await continueClick()
    await page.evaluate(async (k) => {
      const A = (await import('/src/state/appStore.ts')).useAppStore
      window.__writes = []
      const o = Storage.prototype.setItem; window.__origSet = o
      Storage.prototype.setItem = function (key, v) { if (key === k) window.__writes.push({ at: Math.round(performance.now()), phase: A.getState().phase, len: v.length, v }); return o.call(this, key, v) }
    }, KEY)
    await L.deploy(page, 'OPEN CONTRACT GLASS VEIL'); await L.setPhaseTag(page, 'mission'); await settle(1500)
    const atStart = await blob(); const tAbort = await L.now(page)
    await settle(2000)
    await page.keyboard.press('Escape'); await settle(500)
    await page.locator('[aria-label="Abort mission"]').click(); await settle(300)
    await page.locator('[aria-label="Confirm abort mission"]').click(); await settle(1800); await L.dismiss(page)
    const w = await page.evaluate(() => window.__writes)
    const nonWorld = (b) => { const o = JSON.parse(b); delete o.world; return JSON.stringify(o) }
    await shot('pv-005', 'm4-01-world-network-after-abort')
    step('m4-abort', { phaseNow: (await L.state(page)).phase, writes: w.map((x) => ({ at: x.at, phase: x.phase, len: x.len, afterAbortClick: x.at > tAbort, equalToMissionStartExceptWorld: nonWorld(x.v) === nonWorld(atStart), worldDiffers: JSON.stringify(JSON.parse(x.v).world) !== JSON.stringify(JSON.parse(atStart).world) })), writesInMissionPhase: w.filter((x) => x.phase === 'mission').length })
    await page.evaluate(() => { Storage.prototype.setItem = window.__origSet })
  })

  // M-5 (PV-018): write-failure notice at 1280x720 and its overlap with the Feed panel.
  // Harness assist: setItem throws QuotaExceededError for the save key only; a credits bump triggers a write.
  await guard('m5-write-failure', async () => {
    await page.evaluate((k) => { const o = Storage.prototype.setItem; window.__origSet = o; Storage.prototype.setItem = function (key, v) { if (key === k) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e } return o.call(this, key, v) } }, KEY)
    await page.locator('[aria-label="WORLD NETWORK"]').click().catch(() => {}); await settle(400)
    await page.evaluate(async () => { const A = (await import('/src/state/appStore.ts')).useAppStore; A.setState({ credits: A.getState().credits + 1 }) })
    await settle(1200)
    const geo = await page.evaluate(() => {
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } }
      const n = document.querySelector('.write-fail-notice'); const f = document.querySelector('.wm-feed')
      const a = r(n), b = r(f)
      const ov = a && b ? { w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)) } : null
      const lines = f ? [...f.querySelectorAll('.wm-feed-x')].map((e) => ({ text: e.textContent.slice(0, 40), ...r(e) })) : []
      const hidden = a ? lines.filter((l) => l.y < a.y + a.h && l.y + l.h > a.y && l.x < a.x + a.w && l.x + l.w > a.x).map((l) => l.text) : []
      return { notice: a, noticeText: n?.textContent, feed: b, overlap: ov, feedLinesUnderNotice: hidden }
    })
    await shot('pv-018', 'm5-01-world-network-write-failed')
    step('m5-write-failure', { filing: await filing(), viewport: page.viewportSize(), ...geo, pageErrors: errs.filter((e) => /pageerror/.test(e)).length })
    await page.evaluate(() => { Storage.prototype.setItem = window.__origSet })
  })
} finally {
  R.errors = errs
  writeFileSync(HERE + 'manual.json', JSON.stringify(R, null, 2))
  await browser.close()
}
console.log('ERRS', errs.length, JSON.stringify(errs.slice(0, 10)))
