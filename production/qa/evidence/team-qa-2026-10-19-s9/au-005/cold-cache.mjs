// AU-005 /team-qa 2026-10-19: cold-cache smoke, cases TC-01 to TC-05 of
// production/qa/test-cases/au-005-cold-cache-no-burst-cases.md. ADVISORY:
// diagnostic coverage only (the story AC: not proof of cue admission; that is
// src/game/audio.test.ts). Headless Chrome for Testing; every case runs in
// its own fresh, non-persistent context at 1280x720 (empty HTTP cache, empty
// storage).
//
// Instrumentation (init script, before any app code): AudioBufferSourceNode
// .prototype.start -> window.__starts {t, loop}; BaseAudioContext.prototype
// .decodeAudioData -> window.__decodes {t0, t1, ok}; capture-phase pointerdown
// -> window.__clicks. page.on('response') records sound.ts, audio.ts,
// audioFreshness.ts and every inspiration/audio/sfx/*.mp3 (url, status, t).
// UI clicks: the Menu SETTINGS button (act() -> uiClick) and the Settings
// CLOSE button (uiClick), real pointer input.
//
// Labelled fixtures:
//   L1 (TC-01, TC-03): route latency of 1500 ms on every sfx .mp3, so the first
//      decodes resolve after the rapid clicks.
//   L2 (TC-02): route latency of 1500 ms on /src/game/audio.ts, the module
//      sound.ts imports lazily on the first cue, so the first click lands
//      before the audio module is usable.
//   F5 (TC-05): AudioContext subclass that suspends itself on construction and
//      defers resume() until window.__allowResume().
// Harness idle windows (2,000 ms, 500 ms control) are not the runtime
// freshness window, which stays in the audio README.
//
// Run: npm run dev -- --strictPort      (port 4200)
//      SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/au-005/cold-cache.mjs
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
const LAT = 1500

const log = []
let fails = 0
const note = (s) => { log.push(s); console.log(s) }
const check = (name, ok, detail = '') => { if (!ok) fails++; note(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' // ' + detail : ''}`) }
const verdict = (name, v, detail = '') => { if (v === 'FAIL') fails++; note(`${v} ${name}${detail ? ' // ' + detail : ''}`) }
const J = (v) => JSON.stringify(v)

const INSTRUMENT = () => {
  window.__starts = []
  window.__decodes = []
  window.__clicks = []
  addEventListener('pointerdown', () => window.__clicks.push(Math.round(performance.now())), true)
  const S = window.AudioBufferSourceNode
  if (S) {
    const start = S.prototype.start
    S.prototype.start = function (...a) {
      window.__starts.push({ t: Math.round(performance.now()), loop: this.loop === true })
      return start.apply(this, a)
    }
  }
  const B = window.BaseAudioContext || window.AudioContext
  if (B) {
    const dec = B.prototype.decodeAudioData
    B.prototype.decodeAudioData = function (...a) {
      const t0 = Math.round(performance.now())
      const p = dec.apply(this, a)
      p.then(() => window.__decodes.push({ t0, t1: Math.round(performance.now()), ok: true }), () => window.__decodes.push({ t0, t1: Math.round(performance.now()), ok: false }))
      return p
    }
  }
}

async function newCase(name, { init, routes } = {}) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu'] })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  await ctx.addInitScript(INSTRUMENT)
  if (init) await ctx.addInitScript(init)
  for (const [re, ms] of routes ?? []) {
    await ctx.route(re, async (route) => { await new Promise((r) => setTimeout(r, ms)); await route.continue() })
  }
  const page = await ctx.newPage()
  const errs = []
  const responses = []
  const t00 = Date.now()
  page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.type() + ' ' + m.text()))
  page.on('response', async (r) => {
    const u = r.url()
    if (/\/src\/ui\/sound\.ts|\/src\/game\/audio\.ts|\/src\/game\/audioFreshness\.ts|\/inspiration\/audio\/sfx\/.*\.mp3/.test(u)) {
      const t = await page.evaluate(() => Math.round(performance.now())).catch(() => null)
      responses.push({ url: u.replace(URL, '/').replace(/\?.*$/, ''), status: r.status(), t })
    }
  })
  note(`\n--- ${name}`)
  return { browser, page, errs, responses, t00 }
}
const W = (page) => page.evaluate(() => ({ starts: window.__starts, decodes: window.__decodes, clicks: window.__clicks, now: Math.round(performance.now()) }))
const oneShotsIn = (w, a, b) => w.starts.filter((s) => !s.loop && s.t > a && s.t <= b)
const settingsOpenClose = async (page, n) => {
  for (let i = 0; i < n; i++) {
    await page.locator('[aria-label^="OPEN SETTINGS"]').click()
    await page.locator('[role="dialog"][aria-label="Settings"] button', { hasText: /^CLOSE$/ }).click()
  }
}
const fresh = async (page) => {
  await page.goto(URL)
  await page.waitForSelector('[aria-label^="OPEN SETTINGS"]', { timeout: 30000 })
}
// Menu -> New Operation -> World Network -> Glass Veil -> Brief -> Accept -> Assembly -> Deploy (real clicks).
async function uiToMission(page) {
  await page.getByText('NEW OPERATION').first().click()
  await page.waitForTimeout(1200)
  await page.locator('[aria-label="Dismiss the orientation"]').click({ timeout: 1500 }).catch(() => {})
  await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().click()
  await page.waitForTimeout(700)
  await page.locator('[aria-label^="ACCEPT CONTRACT"]').click()
  await page.waitForTimeout(800)
  for (;;) {
    const assign = page.locator('button[aria-label^="ASSIGN "]:not([disabled])')
    if (/4 \/ 4 ASSIGNED/.test(await page.innerText('body')) || (await assign.count()) === 0) break
    await assign.first().click()
    await page.waitForTimeout(150)
  }
  await page.locator('[aria-label^="DEPLOY STRIKE TEAM"]').click()
  await page.waitForSelector('.hud-btn.pause', { timeout: 30000 })
}
const sim = (page) => page.evaluate(async () => ({
  phase: (await import('/src/state/appStore.ts')).useAppStore.getState().phase,
  t: (await import('/src/game/runtime.ts')).getWorld()?.time ?? null,
}))
async function fire(page) {
  // Select operative 1 and right-click the nearest live hostile's screen point
  // is not available headless; use the playbook's world order (recorded).
  const r = await page.evaluate(async () => {
    const w = (await import('/src/game/runtime.ts')).getWorld()
    const a = w.units.find((u) => u.kind === 'agent' && u.stance !== 'dead')
    const d = (u) => Math.hypot(u.pos.x - a.pos.x, u.pos.z - a.pos.z)
    const e = w.units.filter((u) => u.kind === 'enemy' && u.stance !== 'dead').sort((p, q) => d(p) - d(q))[0]
    w.orderAttack([a.id], e.id)
    return { agent: a.id, target: e.id, dist: +d(e).toFixed(1) }
  })
  return 'w.orderAttack ' + J(r)
}

// ---------------- TC-01: cold decode, rapid clicks ----------------
{
  const { browser, page, errs, responses } = await newCase('TC-01 cold cache, L1 sfx latency ' + LAT + ' ms', { routes: [[/\/inspiration\/audio\/sfx\//, LAT]] })
  try {
    await fresh(page)
    await settingsOpenClose(page, 5)
    let w = await W(page)
    const tEnd = w.now
    await page.waitForTimeout(2000)
    // The 1500 ms hold is per request and the clips arrive spread out, so wait
    // until every sfx response has landed and the decode count is stable,
    // then run the 2,000 ms idle window past the last decode (T_dec).
    for (let i = 0, last = -1; i < 60; i++) {
      const n = (await W(page)).decodes.length
      const sfxN = responses.filter((r) => r.url.includes('/sfx/')).length
      if (n === last && sfxN > 0 && n >= sfxN) break
      last = n
      await page.waitForTimeout(500)
    }
    await page.waitForTimeout(2000)
    w = await W(page)
    const lastDec = Math.max(...w.decodes.map((d) => d.t1))
    const firstClick = w.clicks[0]
    note(`clicks ${w.clicks.length} (${firstClick}..${w.clicks.at(-1)} ms); decodes ${w.decodes.length} (${w.decodes.filter((d) => !d.ok).length} failed), first resolve ${Math.min(...w.decodes.map((d) => d.t1))}, T_dec ${lastDec}; starts so far ${J(w.starts)}`)
    const idle = oneShotsIn(w, tEnd, w.now)
    const nearDecode = w.decodes.some((d) => w.starts.filter((s) => !s.loop && Math.abs(s.t - d.t1) <= 50).length >= 2)
    const decAfterClick = w.decodes.some((d) => d.t1 > firstClick)
    if (!decAfterClick) verdict('TC-01', 'INCONCLUSIVE', 'decode finished before input')
    // Control click.
    const tc = (await W(page)).now
    await page.locator('[aria-label^="OPEN SETTINGS"]').click()
    await page.waitForTimeout(500)
    const wc = await W(page)
    const ctl = oneShotsIn(wc, tc, wc.now)
    await page.screenshot({ path: `${OUT}01-menu-after-clicks-1280x720.png` })
    await page.locator('[role="dialog"][aria-label="Settings"] button', { hasText: /^CLOSE$/ }).click()
    note(`idle-interval one-shot starts: ${idle.length}; any >=2 starts within 50 ms of a decode resolve: ${nearDecode}; control-click starts: ${ctl.length}`)
    if (ctl.length === 0) verdict('TC-01', 'BLOCKED', 'control click showed 0 starts: instrumentation cannot see the UI cue path')
    else if (decAfterClick) check('TC-01 no burst: 0 idle starts, no decode-time cluster, control click >= 1', idle.length === 0 && !nearDecode, `idle ${idle.length}, cluster ${nearDecode}, control ${ctl.length}`)

    // ---------------- TC-03: same context, cold, into a mission and firing ----------------
    note('\n--- TC-03 (TC-01 context): UI path to Glass Veil, HUD clicks, fire')
    await uiToMission(page)
    const s0 = await sim(page)
    for (let i = 0; i < 5; i++) { await page.mouse.click(640 + i * 20, 380); await page.waitForTimeout(40) }
    const t3 = (await W(page)).now
    await page.waitForTimeout(2000)
    let w3 = await W(page)
    const idle3 = oneShotsIn(w3, t3, w3.now)
    const how = await fire(page)
    const tf = (await W(page)).now
    await page.waitForTimeout(2000)
    w3 = await W(page)
    let fired = oneShotsIn(w3, tf, w3.now)
    for (let i = 0; i < 8 && fired.length === 0; i++) { await page.waitForTimeout(1000); w3 = await W(page); fired = oneShotsIn(w3, tf, w3.now) }
    const s1 = await sim(page)
    await page.screenshot({ path: `${OUT}03-mission-fire-1280x720.png` })
    note(`fire method: ${how}; starts after firing: ${fired.length}; loops started overall: ${w3.starts.filter((s) => s.loop).length}`)
    check('TC-03 mission reached and runs', s1.phase === 'mission' && s1.t > s0.t, J({ s0, s1 }))
    check('TC-03 0 one-shot starts in the idle interval after the HUD clicks', idle3.length === 0, J(idle3))
    note(`TC-03 diagnostic: >= 1 start after firing: ${fired.length >= 1}`)
    const sfx = responses.filter((r) => r.url.includes('/sfx/'))
    check('cold cache: every sfx response is 200, none 304', sfx.length > 0 && sfx.every((r) => r.status === 200), `${sfx.length} responses, statuses ${J([...new Set(sfx.map((r) => r.status))])}`)
    check('TC-01/TC-03 0 console errors and 0 page errors', errs.filter((e) => !e.startsWith('warning')).length === 0, errs.slice(0, 6).join(' | '))
    if (errs.some((e) => e.startsWith('warning'))) note('warnings: ' + errs.filter((e) => e.startsWith('warning')).slice(0, 6).join(' | '))
    note('responses: ' + J(responses.filter((r) => !r.url.includes('/sfx/'))) + `; sfx ${sfx.length}, first ${Math.min(...sfx.map((r) => r.t))} ms, last ${Math.max(...sfx.map((r) => r.t))} ms`)
  } catch (e) { fails++; note('ERROR ' + (e?.stack ?? e)) } finally { await browser.close() }
}

// ---------------- TC-02: stale click at audio-module load ----------------
{
  const { browser, page, errs, responses } = await newCase('TC-02 module load, L2 latency ' + LAT + ' ms on /src/game/audio.ts', { routes: [[/\/src\/game\/audio\.ts/, LAT]] })
  try {
    await fresh(page)
    await page.locator('[aria-label^="OPEN SETTINGS"]').click()
    const tClick = (await W(page)).clicks[0]
    await page.waitForResponse((r) => /\/src\/game\/audio\.ts/.test(r.url()), { timeout: 15000 })
    await page.waitForTimeout(100)
    const tMod = responses.find((r) => r.url.includes('/src/game/audio.ts'))?.t
    await page.waitForTimeout(2000)
    const w = await W(page)
    const after = oneShotsIn(w, tMod, tMod + 2000)
    note(`click ${tClick} ms; T_mod ${tMod} ms; starts ${J(w.starts)}`)
    if (!(tClick < tMod)) verdict('TC-02', 'INCONCLUSIVE', 'module loaded before input')
    else check('TC-02 0 starts in the 2,000 ms after the audio module loads', after.length === 0, J(after))
    check('TC-02 0 console errors and 0 page errors', errs.filter((e) => !e.startsWith('warning')).length === 0, errs.slice(0, 6).join(' | '))
  } catch (e) { fails++; note('ERROR ' + (e?.stack ?? e)) } finally { await browser.close() }
}

// ---------------- TC-04: audio unavailable ----------------
{
  const { browser, page, errs } = await newCase('TC-04 audio unavailable (AudioContext undefined)', {
    init: () => { window.AudioContext = undefined; window.webkitAudioContext = undefined },
  })
  try {
    await fresh(page)
    check('TC-04 AudioContext unavailable in the page', await page.evaluate(() => typeof window.AudioContext === 'undefined'))
    await page.locator('[aria-label^="OPEN SETTINGS"]').click()
    const slider = page.locator('[role="dialog"][aria-label="Settings"] input[type="range"]').first()
    await slider.focus()
    await page.keyboard.press('ArrowLeft')
    const v = await slider.inputValue()
    await page.keyboard.press('ArrowRight')
    await page.locator('[role="dialog"][aria-label="Settings"] button', { hasText: /^CLOSE$/ }).click()
    note(`slider moved to ${v} and back`)
    await uiToMission(page)
    const s0 = await sim(page)
    for (let i = 0; i < 5; i++) { await page.mouse.click(640 + i * 20, 380); await page.waitForTimeout(40) }
    note('fire method: ' + (await fire(page)))
    await page.waitForTimeout(2000)
    const s1 = await sim(page)
    await page.screenshot({ path: `${OUT}04-audio-unavailable-mission-1280x720.png` })
    const w = await W(page)
    check('TC-04 mission reached and runs without audio', s1.phase === 'mission' && s1.t > s0.t, J({ s0, s1 }))
    check('TC-04 0 starts', w.starts.length === 0, J(w.starts))
    check('TC-04 0 console errors and 0 page errors', errs.filter((e) => !e.startsWith('warning')).length === 0, errs.slice(0, 6).join(' | '))
    note('TC-04 warnings verbatim: ' + J(errs.filter((e) => e.startsWith('warning'))))
  } catch (e) { fails++; note('ERROR ' + (e?.stack ?? e)) } finally { await browser.close() }
}

// ---------------- TC-05: context not running, then resumed ----------------
{
  const { browser, page, errs } = await newCase('TC-05 F5 instrumented fixture: context suspended until __allowResume()', {
    init: () => {
      const Base = window.AudioContext
      if (!Base) return
      let allow = false
      const waiting = []
      window.__ctxs = []
      class Held extends Base {
        constructor(...a) {
          super(...a)
          window.__ctxs.push(this)
          Base.prototype.suspend.call(this).catch(() => undefined)
        }
        resume() {
          if (allow) return Base.prototype.resume.call(this)
          return new Promise((res, rej) => waiting.push(() => Base.prototype.resume.call(this).then(res, rej)))
        }
      }
      window.AudioContext = Held
      window.__allowResume = () => { allow = true; for (const f of waiting.splice(0)) f() }
    },
  })
  try {
    await fresh(page)
    await settingsOpenClose(page, 3)
    await page.waitForTimeout(800)
    const states = await page.evaluate(() => window.__ctxs.map((c) => c.state))
    note(`context state(s) after 3 open/close while held: ${J(states)}`)
    await page.evaluate(() => window.__allowResume())
    const tr = (await W(page)).now
    await page.waitForTimeout(2000)
    const w = await W(page)
    const after = oneShotsIn(w, tr, w.now)
    note(`states after resume: ${J(await page.evaluate(() => window.__ctxs.map((c) => c.state)))}; one-shot starts after resume: ${J(after)}`)
    check('TC-05 context was not running during the clicks', states.length > 0 && states.every((s) => s !== 'running'), J(states))
    check('TC-05 0 starts in the 2,000 ms after resume (dropped, not queued)', after.length === 0, J(after))
    // Control: a fresh click after resume plays.
    const tc = (await W(page)).now
    await page.locator('[aria-label^="OPEN SETTINGS"]').click()
    await page.waitForTimeout(500)
    const wc = await W(page)
    note(`TC-05 control: starts after a fresh click post-resume: ${oneShotsIn(wc, tc, wc.now).length}`)
    check('TC-05 0 console errors and 0 page errors', errs.filter((e) => !e.startsWith('warning')).length === 0, errs.slice(0, 6).join(' | '))
  } catch (e) { fails++; note('ERROR ' + (e?.stack ?? e)) } finally { await browser.close() }
}

note(fails === 0 ? '\nALL PASS (advisory)' : `\nFAILS: ${fails}`)
writeFileSync(OUT + 'cold-cache-output.txt', log.join('\n') + '\n')
