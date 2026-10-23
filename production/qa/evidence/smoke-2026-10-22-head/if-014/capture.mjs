// IF-014 capture: the first-Debrief Research prompt (Interface Core Rule 13,
// AC32). Three Debrief states at 1280x720 — first Debrief with the prompt
// (text scales 90 / 100 / 110 / 125), a second Debrief without it, a pyrrhic
// Debrief with the CAMPAIGN FAILED banner first — plus the reload-on-Debrief
// check, the OPEN RESEARCH and UNDERSTOOD clicks, and an unaffordable first
// Debrief that shows nothing and stays unfired.
// Headless Chrome for Testing against a vite dev server.
// Harness assists, named: localStorage clear; New Operation through
// save.startNewOperation; text scale through the settings store; a Screen
// visit and a Debrief set up through the app store (selectMission,
// goto('team'), then setOutcome with applyKey = lastAppliedKey + 1; the
// Debrief screen itself runs applyDebrief); the pyrrhic fixture trims the
// roster to one operative who dies (IF-011's wipe fixture); the unaffordable
// fixture sets Credits to 1,000 before a loss. OPEN RESEARCH, UNDERSTOOD and
// Continue are real clicks.
//
// Run: npm run dev -- --strictPort --port 4214
//      SWEEP_URL=http://localhost:4214/ node production/qa/evidence/if-014/capture.mjs
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
const URL = process.env.SWEEP_URL || 'http://localhost:4214/'
const OUT = new globalThis.URL('.', import.meta.url).pathname
const SCALES = [90, 100, 110, 125]
const ID = 'hint-debrief-research'

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

const setScale = (scale) =>
  page.evaluate(async (scale) => {
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setTextScale(scale)
  }, scale)

// Text clipped by its own box or by the viewport (same probe as IF-013).
const clippedSel = (sel) =>
  page.evaluate((sel) => {
    const out = []
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect()
      let overflow = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
      // A bordered button, and the focused banner (its absolute ::after focus
      // ring adds 2px a side to scrollWidth), compare their text range to
      // their box instead.
      if (el.tagName === 'BUTTON' || el.classList.contains('db-failed')) {
        const range = document.createRange()
        range.selectNodeContents(el)
        const t = range.getBoundingClientRect()
        overflow = t.left < r.left - 0.5 || t.right > r.right + 0.5 || t.top < r.top - 0.5 || t.bottom > r.bottom + 0.5
      }
      const clip = overflow || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5 || r.left < -0.5 || r.top < -0.5
      if (clip) out.push(sel + ' ' + (el.textContent || '').slice(0, 40) + ' sw' + el.scrollWidth + '/cw' + el.clientWidth + ' sh' + el.scrollHeight + '/ch' + el.clientHeight + ' b' + Math.round(r.bottom))
    }
    return out
  }, sel)

const facts = () =>
  page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const { useSaveStatusStore } = await import('/src/state/saveStatusStore.ts')
    const { SAVE_KEY } = await import('/src/state/save.ts')
    const top = (sel) => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().top) : null }
    const bottom = (sel) => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().bottom) : null }
    const prompt = document.querySelector('.db-research')
    const card = document.querySelector('.db-card')
    let blobSeen = null
    try { const raw = localStorage.getItem(SAVE_KEY); blobSeen = raw ? JSON.parse(raw).tutorial.seen : null } catch { blobSeen = 'unreadable' }
    const a = useAppStore.getState()
    return {
      phase: a.phase,
      missionId: a.missionId,
      credits: a.credits,
      lastAppliedKey: a.lastAppliedKey,
      applyKey: a.outcome ? a.outcome.applyKey : null,
      seen: useTutorialStore.getState().seen,
      campaignFailed: useCampaignStore.getState().campaignFailed,
      status: useSaveStatusStore.getState().status,
      prompt: prompt ? prompt.textContent : null,
      promptInFiling: !!document.querySelector('.db-filing .db-research'),
      bannerFirst: !!card && !!card.firstElementChild && card.firstElementChild.classList.contains('db-failed'),
      bannerTop: top('.db-failed'),
      rowsBottom: bottom('.db-rows'),
      filingBottom: bottom('.db-filing'),
      promptTop: top('.db-research'),
      actionsTop: top('.db-actions'),
      cardBottom: bottom('.db-card'),
      blobSeen,
    }
  })

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.evaluate(async () => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
  })
}

// An authored contract the campaign can open now, a Screen visit (autosaved),
// then a Debrief with the given outcome fields. The Debrief runs applyDebrief.
async function reachDebrief(fields, before) {
  await page.evaluate(async ({ fields, before }) => {
    const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
    const { useCampaignStore, missionLocked } = await import('/src/state/campaignStore.ts')
    const { MISSIONS } = await import('/src/game/data.ts')
    const intel = useCampaignStore.getState().intelLevel
    const C = MISSIONS.find((m) => !missionLocked(m, intel)).id
    useAppStore.getState().selectMission(C)
    useAppStore.getState().goto('team')
    await new Promise((r) => setTimeout(r, 900))
    if (before === 'wipe') {
      const first = useCampaignStore.getState().operatives[0]
      useCampaignStore.setState({ operatives: [first] })
      useAppStore.setState({ squad: [first.id] })
      fields.deadIds = [first.id]
      fields.casualties = 1
    }
    if (before === 'broke') useAppStore.setState({ credits: 1000 })
    const applyKey = useAppStore.getState().lastAppliedKey + 1
    useAppStore.getState().setOutcome(settleOutcome({
      applyKey, won: true, kills: 2, casualties: 0, timeSec: 180, civiliansHit: 0,
      reward: 85000, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false, ...fields,
    }))
  }, { fields, before })
  await page.waitForSelector('.db-filing', { timeout: 20000 })
  await wait(1800)
}

const OPEN = 'button:has-text("OPEN RESEARCH")'
const UNDERSTOOD = 'button:has-text("UNDERSTOOD")'
const CONTINUE = 'button:has-text("CONTINUE")'
const onceSeen = (f) => f.seen.filter((id) => id === ID).length === 1

try {
  // 1. First Debrief of a campaign: the prompt, at four text scales.
  await fresh()
  await reachDebrief({})
  let f = await facts()
  check('applied before the prompt read (lastAppliedKey = applyKey)', f.lastAppliedKey === f.applyKey && f.applyKey > 0, JSON.stringify({ k: f.lastAppliedKey, a: f.applyKey }))
  check('first Debrief shows one prompt naming the RESEARCH tab and the cheapest affordable project', !!f.prompt && f.prompt.includes('RESEARCH // BARREL WEAR COATING') && f.prompt.includes('14,000 CR starts BARREL WEAR COATING in 2 hours') && f.prompt.includes('RESEARCH tab'), f.prompt || 'no prompt')
  check('post-payout Credits cover the named project', f.credits >= 14000, String(f.credits))
  check('fired: seen holds the id exactly once (memory only on Debrief)', onceSeen(f), JSON.stringify(f.seen))
  check('no banner on a healthy campaign', !f.bannerFirst && f.bannerTop === null)
  check('prompt sits below the invoice and its filing line, above the actions, not inside the filing chrome', f.promptTop >= f.rowsBottom && f.promptTop >= f.filingBottom && f.actionsTop >= f.promptTop && !f.promptInFiling, JSON.stringify({ rows: f.rowsBottom, filing: f.filingBottom, prompt: f.promptTop, actions: f.actionsTop }))
  check('still unfiled on Debrief: the mark is not in the blob', f.status === 'unfiled' && Array.isArray(f.blobSeen) && !f.blobSeen.includes(ID), JSON.stringify({ status: f.status, blob: f.blobSeen }))
  for (const scale of SCALES) {
    await setScale(scale)
    await wait(300)
    const clipped = [
      ...(await clippedSel('.db-research')),
      ...(await clippedSel('.db-research-title')),
      ...(await clippedSel('.db-research-body')),
      ...(await clippedSel('.db-research-btn')),
      ...(await clippedSel('.db-actions .btn')),
      ...(await clippedSel('.db-card')),
    ]
    const g = await facts()
    check(`scale ${scale}: nothing clips at 1280x720, card inside the viewport`, clipped.length === 0 && g.cardBottom <= 720, clipped.join(' | ') + ' cardBottom ' + g.cardBottom)
    await shot(`01-first-debrief-prompt-${scale}`)
  }
  await setScale(100)

  // 2. Reload while still on the first Debrief: the mark was memory only.
  await page.reload()
  await wait(1200)
  await page.click(CONTINUE)
  await wait(900)
  f = await facts()
  check('after reload + Continue the prompt is unfired again (seen lacks the id), like the unfiled invoice', !f.seen.includes(ID) && f.phase !== 'debrief', JSON.stringify({ seen: f.seen, phase: f.phase }))
  await reachDebrief({})
  f = await facts()
  check('the next Debrief after that reload fires the prompt again', !!f.prompt && f.prompt.includes('RESEARCH // BARREL WEAR COATING') && onceSeen(f), f.prompt || 'no prompt')
  await shot('02-reload-then-debrief-prompt-fires-again-100')

  // 3. OPEN RESEARCH: leaves through returnFromDebrief, then the Research Screen.
  await page.click(OPEN)
  await wait(400)
  f = await facts()
  check('OPEN RESEARCH: phase research, missionId null (Brief locked), seen holds the id once', f.phase === 'research' && f.missionId === null && onceSeen(f), JSON.stringify({ phase: f.phase, missionId: f.missionId, seen: f.seen }))
  await wait(900)
  f = await facts()
  check('the Screen autosave makes the mark durable: blob seen holds the id, status filed', f.status === 'filed' && Array.isArray(f.blobSeen) && f.blobSeen.includes(ID), JSON.stringify({ status: f.status, blob: f.blobSeen }))
  await shot('03-research-screen-after-open-100')

  // 4. Second Debrief in the same campaign: no prompt.
  await reachDebrief({})
  f = await facts()
  check('second Debrief shows no prompt and seen still holds the id once', f.prompt === null && onceSeen(f), JSON.stringify({ prompt: f.prompt, seen: f.seen }))
  await shot('04-second-debrief-no-prompt-100')

  // 5. UNDERSTOOD closes the note and stays on Debrief.
  await fresh()
  await reachDebrief({})
  f = await facts()
  check('fresh campaign: first Debrief fires again', !!f.prompt && onceSeen(f))
  await page.click(UNDERSTOOD)
  await wait(300)
  f = await facts()
  check('UNDERSTOOD: note closed, still on Debrief, seen holds the id once', f.prompt === null && f.phase === 'debrief' && onceSeen(f), JSON.stringify({ prompt: f.prompt, phase: f.phase, seen: f.seen }))
  await shot('05-after-understood-100')

  // 6. Pyrrhic win: CAMPAIGN FAILED banner first and dominant, prompt below the invoice.
  await fresh()
  await reachDebrief({}, 'wipe')
  f = await facts()
  check('pyrrhic Debrief: campaignFailed, banner is the first child of the card', f.campaignFailed && f.bannerFirst, JSON.stringify({ failed: f.campaignFailed, first: f.bannerFirst }))
  check('pyrrhic Debrief: the prompt, shown, sits below the invoice, under the banner', !!f.prompt && f.bannerTop < f.promptTop && f.promptTop >= f.rowsBottom && f.promptTop >= f.filingBottom, JSON.stringify({ banner: f.bannerTop, rows: f.rowsBottom, prompt: f.promptTop }))
  for (const scale of [100, 125]) {
    await setScale(scale)
    await wait(300)
    const clipped = [...(await clippedSel('.db-failed')), ...(await clippedSel('.db-research')), ...(await clippedSel('.db-research-btn')), ...(await clippedSel('.db-card'))]
    const g = await facts()
    check(`pyrrhic scale ${scale}: banner and prompt inside the viewport, nothing clips`, clipped.length === 0 && g.cardBottom <= 720 && g.bannerTop >= 0, clipped.join(' | ') + ' cardBottom ' + g.cardBottom)
    await shot(`06-pyrrhic-debrief-banner-first-${scale}`)
  }
  await setScale(100)

  // 7. Nothing affordable: no prompt, and the id stays unfired.
  await fresh()
  await reachDebrief({ won: false, reward: 0 }, 'broke')
  f = await facts()
  check('unaffordable first Debrief (1,000 CR, loss pays 0): no prompt, id unfired', f.prompt === null && !f.seen.includes(ID) && f.credits < 14000, JSON.stringify({ prompt: f.prompt, seen: f.seen, credits: f.credits }))
  await shot('07-first-debrief-unaffordable-no-prompt-100')
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
}

check('no console or page errors', errs.length === 0, errs.join(' | '))
note(fails === 0 ? 'ALL PASS' : `${fails} FAIL`)
writeFileSync(`${OUT}capture-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails === 0 ? 0 : 1)
