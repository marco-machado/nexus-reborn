// BUG-0003 fix copy (2026-10-19) of production/qa/evidence/smoke-2026-10-19/if-010/capture.mjs.
// Changes: the notice read is the visible one (the in-card copy while the
// World Network orientation is up, else the fixed region's), and a check after
// capture 06a that the visible notice intersects no other text in the card
// (text outside it is under the card's solid panel) and the fixed
// region draws nothing while the card is up.
// IF-010 capture: Debrief filing status (unfiled -> filed on each exit) and
// the write-failure advisory (both Debrief exits, and New Operation).
// Headless Chrome for Testing at 1280x720 against a vite dev server.
// Harness assists, named: localStorage clear; a Screen visit and a won Debrief
// set up through the app store (selectMission, startMission, freezeDeploy,
// setOutcome; the Debrief screen itself runs applyDebrief); write failures
// injected by making Storage.prototype.setItem/removeItem throw a
// QuotaExceededError for the campaign key only. The Debrief exits and the
// Menu New Operation presses are real clicks.
//
// Run: npm run dev -- --strictPort --port 4217
//      SWEEP_URL=http://localhost:4217/ node production/qa/evidence/if-010/capture.mjs
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
const URL = process.env.SWEEP_URL || 'http://localhost:4217/'
const OUT = new globalThis.URL('.', import.meta.url).pathname

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
const check = (name, ok, detail = '') => { if (!ok) fails++; note(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' // ' + detail : ''}`) }

const facts = () =>
  page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useSaveStatusStore } = await import('/src/state/saveStatusStore.ts')
    const s = useSaveStatusStore.getState()
    const filing = document.querySelector('.db-filing')
    const notice = document.querySelector('.wm-onboard-fail') ?? document.querySelector('.write-fail-region .write-fail-notice')
    const clipped = (el) => !!el && (el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > innerWidth || el.getBoundingClientRect().bottom > innerHeight)
    return {
      phase: useAppStore.getState().phase,
      status: s.status,
      reason: s.reason,
      filing: filing ? filing.textContent : null,
      notice: notice ? notice.textContent : null,
      filingClipped: clipped(filing),
      noticeClipped: clipped(notice),
    }
  })

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
}

// Make campaign writes and erases throw; settings and telemetry still write.
const failCampaignWrites = () =>
  page.evaluate(async () => {
    const { SAVE_KEY } = await import('/src/state/save.ts')
    const set = Storage.prototype.setItem
    const remove = Storage.prototype.removeItem
    const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' })
    Storage.prototype.setItem = function (k, v) { if (k === SAVE_KEY) throw quota(); return set.call(this, k, v) }
    Storage.prototype.removeItem = function (k) { if (k === SAVE_KEY) throw quota(); return remove.call(this, k) }
  })

// New Operation, a Screen visit (autosaved), then a won Debrief on an authored contract.
async function reachDebrief() {
  await fresh()
  await page.evaluate(async () => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
    const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
    const { useCampaignStore, missionLocked } = await import('/src/state/campaignStore.ts')
    const { MISSIONS } = await import('/src/game/data.ts')
    const C = MISSIONS.find((m) => m.id !== 'm01' && !missionLocked(m, 2)).id
    window.__C = C
    useCampaignStore.setState({ intelLevel: 2, contractsWon: ['m01'] })
    useAppStore.getState().selectMission(C)
    useAppStore.getState().goto('team')
  })
  await wait(900)
  check('Screen visit autosaved and filed', (await facts()).status === 'filed')
  await page.evaluate(async () => {
    const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const { freezeDeploy } = await import('/src/state/deployFreeze.ts')
    const { resolveMission } = await import('/src/state/worldStore.ts')
    const C = window.__C
    useAppStore.getState().startMission()
    const app = useAppStore.getState()
    const applyKey = app.deploySerial + 1
    useAppStore.setState({ deploySerial: applyKey })
    const ops = useCampaignStore.getState().operatives.filter((o) => app.squad.includes(o.id))
    freezeDeploy(resolveMission(C), ops, applyKey)
    useAppStore.getState().setOutcome(settleOutcome({
      applyKey, won: true, kills: 2, casualties: 0, timeSec: 180, civiliansHit: 0,
      reward: 85000, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false,
    }))
  })
  await page.waitForSelector('.db-filing', { timeout: 20000 })
  await wait(2500)
}

// The first-visit World Network orientation is up on a fresh campaign; a real
// director dismisses it on the first visit, long before any Debrief.
async function dismissOrientation() {
  const b = page.locator('[aria-label="Dismiss the orientation"]')
  if (await b.count()) { await b.first().click(); await wait(300) }
}

const RETURN = 'button:has-text("RETURN TO WORLD NETWORK")'
const REPLAY = 'button:has-text("REPLAY MISSION")'

try {
  // 1. Unfiled on Debrief, then World Network return files it.
  await reachDebrief()
  let f = await facts()
  check('Debrief reads unfiled before any Screen return', f.phase === 'debrief' && f.status === 'unfiled' && !!f.filing && f.filing.includes('UNFILED'), JSON.stringify(f))
  check('unfiled line not clipped at 1280x720', !f.filingClipped)
  await shot('01-debrief-invoice-unfiled-1280x720')
  await page.click(RETURN)
  f = await facts()
  check('World Network reached; still unfiled until the write (navigation is not the signal)', f.phase === 'world' && f.status === 'unfiled', JSON.stringify(f))
  await wait(900)
  f = await facts()
  check('World Network return: filed after autosave, no failure notice', f.status === 'filed' && f.notice === null, JSON.stringify(f))
  await dismissOrientation()
  await shot('02-world-return-filed-1280x720')

  // 2. Brief Replay files it.
  await reachDebrief()
  check('second Debrief unfiled', (await facts()).status === 'unfiled')
  await page.click(REPLAY)
  await wait(900)
  f = await facts()
  check('Brief Replay: filed after autosave, no failure notice', f.phase === 'brief' && f.status === 'filed' && f.notice === null, JSON.stringify(f))
  await shot('03-brief-replay-filed-1280x720')

  // 3. World Network return with the first Screen write failing.
  await reachDebrief()
  await failCampaignWrites()
  await page.click(RETURN)
  await wait(900)
  f = await facts()
  check('World Network return write failure: notice shown, not filed', f.phase === 'world' && f.status === 'write-failed' && f.reason === 'quota' && !!f.notice, JSON.stringify(f))
  check('failure notice not clipped (world)', !f.noticeClipped)
  await dismissOrientation()
  check('failure notice persists after the orientation is dismissed', !!(await facts()).notice)
  await shot('04-world-return-write-failed-1280x720')

  // 4. Brief Replay with the first Screen write failing.
  await reachDebrief()
  await failCampaignWrites()
  await page.click(REPLAY)
  await wait(900)
  f = await facts()
  check('Brief Replay write failure: notice shown, not filed', f.phase === 'brief' && f.status === 'write-failed' && !!f.notice, JSON.stringify(f))
  check('failure notice not clipped (brief)', !f.noticeClipped)
  await shot('05-brief-replay-write-failed-1280x720')

  // 5. New Operation erase fails (save on file, two-step arm on the Menu).
  await fresh()
  await page.evaluate(async () => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
    ;(await import('/src/state/appStore.ts')).useAppStore.getState().goto('research')
  })
  await wait(900)
  await page.reload()
  await wait(1500)
  await failCampaignWrites()
  const newOp = page.locator('.screen.menu button', { hasText: 'NEW OPERATION' })
  await newOp.first().click()
  await wait(200)
  await page.locator('.screen.menu button', { hasText: 'CONFIRM' }).first().click()
  await wait(900)
  f = await facts()
  check('New Operation erase failure: World Network shows failure, not erased/filed', f.phase === 'world' && f.status === 'write-failed' && !!f.notice, JSON.stringify(f))
  check('failure notice not clipped (new operation)', !f.noticeClipped)
  // The New Operation house shows the orientation again (tutorial reset); the
  // notice sits over one of its lines. Recorded, not hidden.
  await shot('06a-new-operation-write-failed-with-orientation-1280x720')
  const ov = await page.evaluate(() => {
    const n = document.querySelector('.wm-onboard-fail')
    const region = document.querySelector('.write-fail-region').getBoundingClientRect()
    if (!n) return { inCard: false }
    const r = n.getBoundingClientRect()
    const hits = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      // Text outside the card is under its solid panel (.wm-onboard .panel,
      // --bg-panel-solid), so only the card's own text can collide.
      if (!t.textContent.trim() || n.contains(t) || !t.parentElement.closest('.wm-onboard-wrap')) continue
      const range = document.createRange()
      range.selectNodeContents(t)
      for (const b of range.getClientRects()) {
        if (b.width === 0 || b.height === 0) continue
        if (b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top) hits.push(t.textContent.trim().slice(0, 40))
      }
    }
    return { inCard: true, rect: [r.left, r.top, r.width, r.height].map(Math.round), regionWH: [region.width, region.height], hits }
  })
  note('BUG-0003 overlap: ' + JSON.stringify(ov))
  check('BUG-0003: notice shown inside the orientation card', ov.inCard)
  check('BUG-0003: visible notice overlaps no other text', ov.inCard && ov.hits.length === 0, JSON.stringify(ov.hits))
  check('BUG-0003: fixed region draws nothing while the card is up', ov.inCard && ov.regionWH[0] <= 1 && ov.regionWH[1] <= 1, JSON.stringify(ov.regionWH))
  await dismissOrientation()
  check('failure notice persists after the orientation is dismissed (new operation)', !!(await facts()).notice)
  await shot('06b-new-operation-write-failed-1280x720')
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
}

check('no console or page errors', errs.length === 0, errs.join(' | '))
note(fails === 0 ? 'ALL PASS' : `${fails} FAIL`)
writeFileSync(`${OUT}capture-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails === 0 ? 0 : 1)
