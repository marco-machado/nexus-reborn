// BUG-0012 fix re-walk: IF-016-04 variant A (no wins) and variant B (one win)
// through the real Debrief path (campaignStore.reportMission emptying the
// roster), plus the CAMPAIGN COMPLETE banner after three wins (IF-016-06).
// Header (lines up to `check`) copied from
// production/qa/evidence/sprint-011/probe.mjs lines 22-60; fresh(), the
// UNDERSTOOD dismissal, readBanner, storeRead and report() follow
// production/qa/evidence/sprint-011-head-2026-10-24/if-016/if-016-handwalk.mjs.
// Run (this worktree's dev server on 4313):
//   PROBE_URL=http://localhost:4313/ node production/qa/evidence/bug-0012-fix-2026-10-25/bug-0012-walk.mjs
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
const OUT = process.env.PROBE_OUT || new globalThis.URL('.', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const log = []
let fails = 0
const note = (s) => { log.push(s); console.log(s) }
const check = (id, name, ok, detail = '') => {
  if (!ok) fails++
  note(`${ok ? 'PASS' : 'FAIL'} ${id} ${name}${detail ? ' // ' + detail : ''}`)
}

// New Operation from a clean save, onto the World Network, card dismissed the
// player's way (UNDERSTOOD), clock paused.
async function opening() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.evaluate(async () => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('world')
  })
  await wait(700)
  if (await page.evaluate(() => !!document.querySelector('.wm-onboard-wrap'))) {
    await page.getByRole('button', { name: 'UNDERSTOOD' }).click()
    await wait(300)
  }
  if (await page.evaluate(() => !!document.querySelector('.wm-onboard-wrap'))) throw new Error('orientation card still up')
  await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ paused: true })
  })
}

const readBanner = (sel, otherSel) =>
  page.evaluate(({ sel, otherSel }) => {
    const el = document.querySelector(sel)
    return {
      count: document.querySelectorAll(sel).length,
      other: document.querySelectorAll(otherSel).length,
      role: el?.getAttribute('role'), b: el?.querySelector('b')?.textContent,
      i: el?.querySelector('i')?.textContent, n: el?.querySelector('strong')?.textContent,
    }
  }, { sel, otherSel })
const storeRead = () =>
  page.evaluate(async () => {
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const s = useCampaignStore.getState()
    return { ops: s.operatives.length, won: s.contractsWon, failed: s.campaignFailed, complete: s.campaignWon }
  })
// reportMission is the Debrief path; a wipe reports every operative dead.
const report = (calls) =>
  page.evaluate(async (calls) => {
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const out = (won, deadIds) => ({ applyKey: 1, won, kills: 0, casualties: deadIds.length, timeSec: 0,
      civiliansHit: 0, reward: 0, bonus: 0, collateral: 0, deadIds, survivorHp: {}, quietReplay: false })
    const t = () => useWorldStore.getState().t
    const allIds = () => useCampaignStore.getState().operatives.map((o) => o.id)
    for (const [id, won, wipe] of calls) useCampaignStore.getState().reportMission(id, out(won, wipe ? allIds() : []), t())
  }, calls)

const FAIL_LINE = 'ROSTER EMPTY // NO CONTRACT CAN BE TAKEN'
const WIN_LINE = 'ALL THREE AUTHORED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE'
const failedOk = (r, n) => r.count === 1 && r.other === 0 && r.role === 'status' &&
  r.b === 'CAMPAIGN FAILED' && r.i === FAIL_LINE && r.n === n

note('# BUG-0012 walk — ' + new Date().toISOString() + ' — ' + URL)

// IF-016-04 variant A: wipe on m01, no wins.
await opening()
{
  await report([['m01', false, true]])
  await wait(400)
  const s = await storeRead()
  const r = await readBanner('.wm-campaign-fail', '.wm-campaign-win')
  const ok = s.ops === 0 && s.failed && !s.complete && JSON.stringify(s.won) === '[]' && failedOk(r, '0 / 3')
  check('IF-016-04A', 'no wins, roster wiped: failed banner reads 0 / 3', ok, 'store ' + JSON.stringify(s) + ' banner ' + JSON.stringify(r))
  note('OBSERVED variant A count: ' + JSON.stringify(r.n))
  await shot('bug-0012-failed-no-wins-1280x720')
}

// IF-016-04 variant B: win m01, then wipe on m02.
await opening()
{
  await report([['m01', true, false], ['m02', false, true]])
  await wait(400)
  const s = await storeRead()
  const r = await readBanner('.wm-campaign-fail', '.wm-campaign-win')
  const ok = s.ops === 0 && s.failed && !s.complete && JSON.stringify(s.won) === '["m01"]' && failedOk(r, '1 / 3')
  check('IF-016-04B', 'one win, then roster wiped: failed banner reads 1 / 3', ok, 'store ' + JSON.stringify(s) + ' banner ' + JSON.stringify(r))
  note('OBSERVED variant B count: ' + JSON.stringify(r.n))
  await shot('bug-0012-failed-one-win-1280x720')
}

// IF-016-06: three wins, complete banner.
await opening()
{
  await report([['m01', true, false], ['m02', true, false], ['m03', true, false]])
  await wait(400)
  const s = await storeRead()
  const r = await readBanner('.wm-campaign-win', '.wm-campaign-fail')
  const ok = s.ops > 0 && JSON.stringify(s.won) === '["m01","m02","m03"]' && !s.failed && s.complete &&
    r.count === 1 && r.other === 0 && r.role === 'status' && r.b === 'CAMPAIGN COMPLETE' && r.i === WIN_LINE && r.n === '3 / 3'
  check('IF-016-06', 'three wins: complete banner reads 3 / 3', ok, 'store ' + JSON.stringify(s) + ' banner ' + JSON.stringify(r))
  note('OBSERVED complete count: ' + JSON.stringify(r.n))
  await shot('bug-0012-complete-1280x720')
}

check('BUG-0012', 'no page errors during the walk', errs.length === 0, errs.slice(0, 5).join(' | '))
note(`# ${fails === 0 ? 'ALL PASS' : fails + ' FAIL'} (${log.filter((l) => /^(PASS|FAIL)/.test(l)).length} checks)`)
writeFileSync(`${OUT}walk-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails ? 1 : 0)
