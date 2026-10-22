// IF-014 manual case execution, 2026-10-22. Headless Chrome for Testing,
// own browser context, viewport 1280x720, against the dev server on 4200.
// Helpers (facts, clip probe, fresh, reachDebrief) are copied from
// ../capture.mjs. Assists are named per case in manual-output.json and results.md.
// Run: SWEEP_URL=http://localhost:4200/ node manual.mjs [TC01 TC02 ...]
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME =
  process.env.SWEEP_CHROME ||
  process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.SWEEP_URL || 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname
const ID = 'hint-debrief-research'
const ONLY = process.argv.slice(2)

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = async (name) => { await page.screenshot({ path: `${OUT}${name}.png` }); return name + '.png' }
const resultsFile = OUT + 'manual-output.json'
const results = existsSync(resultsFile) ? JSON.parse(readFileSync(resultsFile, 'utf8')) : {}

const setScale = (scale) =>
  page.evaluate(async (scale) => {
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setTextScale(scale)
  }, scale)

const clippedSel = (sel) =>
  page.evaluate((sel) => {
    const out = []
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect()
      let overflow = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
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
const clipAll = async (sels) => { const o = []; for (const s of sels) o.push(...(await clippedSel(s))); return o }

const facts = () =>
  page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const { useSaveStatusStore } = await import('/src/state/saveStatusStore.ts')
    const { useResearchStore } = await import('/src/state/researchStore.ts')
    const { SAVE_KEY } = await import('/src/state/save.ts')
    const top = (sel) => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().top) : null }
    const bottom = (sel) => { const el = document.querySelector(sel); return el ? Math.round(el.getBoundingClientRect().bottom) : null }
    const txt = (sel) => { const el = document.querySelector(sel); return el ? el.textContent : null }
    const card = document.querySelector('.db-card')
    let blobSeen = null
    try { const raw = localStorage.getItem(SAVE_KEY); blobSeen = raw ? JSON.parse(raw).tutorial.seen : null } catch { blobSeen = 'unreadable' }
    const a = useAppStore.getState()
    const r = useResearchStore.getState()
    const ae = document.activeElement
    return {
      phase: a.phase,
      missionId: a.missionId,
      credits: a.credits,
      lastAppliedKey: a.lastAppliedKey,
      applyKey: a.outcome ? a.outcome.applyKey : null,
      seen: [...useTutorialStore.getState().seen],
      campaignFailed: useCampaignStore.getState().campaignFailed,
      status: useSaveStatusStore.getState().status,
      blobSeen,
      promptCount: document.querySelectorAll('.db-research').length,
      promptTitle: txt('.db-research-title'),
      promptBody: txt('.db-research-body'),
      promptBtns: [...document.querySelectorAll('.db-research-btn')].map((b) => b.textContent),
      promptInFiling: !!document.querySelector('.db-filing .db-research'),
      cardFirstClass: card && card.firstElementChild ? card.firstElementChild.className : null,
      failedText: txt('.db-failed'),
      title: txt('.db-title'),
      filing: txt('.db-filing'),
      rows: [...document.querySelectorAll('.db-rows > *')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()),
      actions: [...document.querySelectorAll('.db-actions button')].map((b) => b.textContent),
      bannerTop: top('.db-failed'), bannerBottom: bottom('.db-failed'),
      rowsTop: top('.db-rows'), rowsBottom: bottom('.db-rows'),
      filingTop: top('.db-filing'), filingBottom: bottom('.db-filing'),
      promptTop: top('.db-research'), promptBottom: bottom('.db-research'),
      actionsTop: top('.db-actions'), actionsBottom: bottom('.db-actions'),
      cardTop: top('.db-card'), cardBottom: bottom('.db-card'),
      labs: JSON.parse(JSON.stringify(r.labs)),
      done: [...r.done],
      activeElement: ae ? ae.tagName + (ae.className ? '.' + String(ae.className).split(' ').join('.') : '') : null,
    }
  })
const once = (f) => f.seen.filter((x) => x === ID).length

async function waitFiled(ms = 6000) {
  for (let i = 0; i < ms / 100; i++) {
    const s = await page.evaluate(async () => (await import('/src/state/saveStatusStore.ts')).useSaveStatusStore.getState().status)
    if (s === 'filed') return true
    await wait(100)
  }
  return false
}

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

// capture.mjs reachDebrief, plus: returns pre-outcome Credits and the contract;
// `outcomeOnly` skips selectMission/goto('team') (TC07 step 2).
async function reachDebrief(fields = {}, before = null, outcomeOnly = false) {
  const r = await page.evaluate(async ({ fields, before, outcomeOnly }) => {
    const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
    const { useCampaignStore, missionLocked } = await import('/src/state/campaignStore.ts')
    const { MISSIONS } = await import('/src/game/data.ts')
    const intel = useCampaignStore.getState().intelLevel
    let C = useAppStore.getState().missionId
    if (!outcomeOnly) {
      C = MISSIONS.find((m) => !missionLocked(m, intel)).id
      useAppStore.getState().selectMission(C)
      useAppStore.getState().goto('team')
      await new Promise((r) => setTimeout(r, 900))
    }
    if (before === 'wipe') {
      const first = useCampaignStore.getState().operatives[0]
      useCampaignStore.setState({ operatives: [first] })
      useAppStore.setState({ squad: [first.id] })
      fields.deadIds = [first.id]
      fields.casualties = 1
    }
    if (before === 'broke') useAppStore.setState({ credits: 1000 })
    const pre = useAppStore.getState().credits
    const applyKey = useAppStore.getState().lastAppliedKey + 1
    useAppStore.getState().setOutcome(settleOutcome({
      applyKey, won: true, kills: 2, casualties: 0, timeSec: 180, civiliansHit: 0,
      reward: 85000, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false, ...fields,
    }))
    return { pre, contract: C }
  }, { fields, before, outcomeOnly })
  await page.waitForSelector('.db-filing', { timeout: 20000 })
  await wait(1800)
  return r
}

const OPEN = 'button:has-text("OPEN RESEARCH")'
const UNDERSTOOD = 'button:has-text("UNDERSTOOD")'
const RETURN = 'button:has-text("RETURN TO WORLD NETWORK")'
const CONTINUE = '[aria-label="CONTINUE SAVED OPERATION // OPEN THE WORLD NETWORK"]'

const cases = {}

cases.TC01 = async (R) => {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.getByText('NEW OPERATION').first().click()
  await wait(1500)
  R.assists = ['localStorage.clear before the real NEW OPERATION click']
  R.headerStep1 = await page.locator('.wm-resources').innerText().catch(() => null)
  // Observation probe (no behaviour change): log every addCredits call with the phase and world t.
  await page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    window.__deposits = []
    const orig = useAppStore.getState().addCredits
    useAppStore.setState({ addCredits: (n) => { window.__deposits.push([useAppStore.getState().phase, Math.round(useWorldStore.getState().t), n]); orig(n) } })
  })
  R.assists.push('observation probe: appStore.addCredits wrapped to log deposits (original runs unchanged)')
  R.step1 = await facts()
  await page.locator('[aria-label="Dismiss the orientation"]').click({ timeout: 1500 }).catch(() => {})
  const label = '[aria-label^="OPEN CONTRACT NEON GARDEN"]'
  let focusClicks = 0
  for (let i = 0; i < 12 && !(await page.locator(label).first().isVisible().catch(() => false)); i++) {
    await page.locator('[aria-label="FOCUS NEXT SECTOR"]').click()
    focusClicks++
    await wait(900)
  }
  R.focusNextSectorClicks = focusClicks
  R.contractLabel = await page.locator(label).first().getAttribute('aria-label')
  await page.locator(label).first().click()
  await wait(900)
  R.briefPhase = (await facts()).phase
  await shot('manual-TC01-brief-100')
  await page.locator('[aria-label^="ACCEPT CONTRACT"]').click()
  await wait(900)
  for (let i = 0; i < 8; i++) {
    const assign = page.locator('button[aria-label^="ASSIGN "]:not([disabled])')
    if (/4 \/ 4 ASSIGNED/.test(await page.innerText('body')) || (await assign.count()) === 0) break
    await assign.first().click()
    await wait(150)
  }
  R.assemblyText = (await page.innerText('body')).match(/\d \/ 4 ASSIGNED/)?.[0] ?? null
  R.creditsAtDeploy = (await facts()).credits
  await page.locator('[aria-label^="DEPLOY STRIKE TEAM"]').click()
  for (let i = 0; i < 600; i++) {
    if (await page.evaluate(async () => !!(await import('/src/game/runtime.ts')).getWorld())) break
    await wait(100)
  }
  await wait(2000)
  R.play = await page.evaluate(async () => {
    const rt = await import('/src/game/runtime.ts')
    const MS = (await import('/src/state/missionStore.ts')).useMissionStore
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const d2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2
    const w = rt.getWorld()
    const city = w.city
    const zoneOf = (def) => (def.kind === 'extract' ? city.extraction : def.zone ?? (def.landmark && city.landmarks[def.landmark]) ?? city.checkpoint)
    const t0 = performance.now()
    let lastOrder = 0
    const log = []
    const handKills = []
    let grenades = 0
    let lastKey = ''
    const objectives = MS.getState().objectives.map((o) => o.id + (o.optional ? '(opt)' : ''))
    while (performance.now() - t0 < 300000) {
      const ms = MS.getState()
      if (ms.result !== 'none') break
      const agents = w.units.filter((u) => u.kind === 'agent' && u.stance !== 'dead')
      if (!agents.length) break
      const ids = agents.map((u) => u.id)
      const row = ms.objectives.find((o) => o.active && !o.done && !o.optional) ?? ms.objectives.find((o) => !o.done && !o.optional)
      const def = row && w.mission.objectives.find((d) => d.id === row.id)
      if (row && row.id !== lastKey) { log.push([Math.round(w.time), row.id, def?.kind]); lastKey = row.id }
      if (def && performance.now() - lastOrder > 700) {
        lastOrder = performance.now()
        const c = agents[0].pos
        if (def.kind === 'eliminate-tag' || def.kind === 'destroy') {
          const kind = def.kind === 'destroy' ? 'device' : 'enemy'
          const e = w.units.filter((u) => u.kind === kind && u.tag === def.tag && u.stance !== 'dead').sort((a, b) => d2(a.pos, c) - d2(b.pos, c))[0]
          if (e && kind === 'enemy') w.orderAttack(ids, e.id)
          else if (e) {
            w.orderMove(ids, { x: e.pos.x, z: e.pos.z })
            if (d2(e.pos, c) < 64) {
              if (w.orderGrenade(ids, { x: e.pos.x, z: e.pos.z })) grenades++
              else if (MS.getState().inventory.cell === 0) {
                e.hp = 0
                e.stance = 'dead'
                handKills.push(e.tag + ':' + e.id)
              }
            }
          }
        } else {
          const z = zoneOf(def)
          const out = agents.filter((a) => d2(a.pos, z) > (z.r * 0.6) ** 2).map((a) => a.id)
          if (out.length) w.orderMove(out, { x: z.x, z: z.z })
          const threat = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead' && u.alerted && d2(u.pos, c) < 15 * 15)
          if (threat && def.kind !== 'extract') w.orderAttack(agents.filter((a) => !out.includes(a.id)).map((a) => a.id), threat.id)
        }
      }
      for (let i = 0; i < 6; i++) w.tick(1 / 30)
      await sleep(50)
    }
    const ms = MS.getState()
    return { result: ms.result, simTime: Math.round(w.time), objectives, log, grenadesAccepted: grenades, handKills, living: w.units.filter((u) => u.kind === 'agent' && u.stance !== 'dead').length }
  })
  R.assists.push('mission played through the sim API: orderMove for Reach/Extract, orderAttack on nearby alerted enemies, orderGrenade on relays, hand-kill (hp 0 / stance dead) of a relay once no Power Cell was left: ' + JSON.stringify(R.play.handKills) + '; fast-forward: 6 extra w.tick(1/30) per 50 ms step')
  for (let i = 0; i < 240; i++) {
    if ((await facts()).phase === 'debrief') break
    await wait(250)
  }
  await wait(6000)
  const f = await facts()
  R.f = f
  R.deposits = await page.evaluate(() => window.__deposits)
  R.shot = await shot('manual-TC01-debrief-100')
}

cases.TC02 = async (R) => {
  await fresh()
  R.assists = ['localStorage.clear + save.startNewOperation (S-3 harness)', 'S-4 fixture (selectMission, goto team, setOutcome won reward 85,000)', 'text scale via settingsStore.setTextScale']
  R.pre = await reachDebrief({})
  R.f = await facts()
  R.scales = {}
  R.shots = []
  for (const s of [90, 100, 110, 125]) {
    await setScale(s)
    await wait(300)
    const clips = await clipAll(['.db-research', '.db-research-title', '.db-research-body', '.db-research-btn', '.db-actions .btn', '.db-card'])
    const g = await facts()
    const btnVis = await page.evaluate(() => [...document.querySelectorAll('.db-research-btn')].map((b) => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && r.height > 0 }))
    R.scales[s] = { clips, cardBottom: g.cardBottom, btnVisible: btnVis, promptCount: g.promptCount }
    R.shots.push(await shot(`manual-TC02-first-debrief-${s}`))
  }
  await setScale(100)
  await wait(300)
}

cases.TC03 = async (R) => {
  R.assists = ['state continues from TC02 (scale 100)']
  R.before = await facts()
  await page.click(OPEN)
  await wait(350)
  R.at400 = await facts()
  R.nav = await page.evaluate(() => [...document.querySelectorAll('.navtab')].map((b) => ({ label: b.getAttribute('aria-label'), current: b.getAttribute('aria-current'), cls: b.className, text: b.innerText.replace(/\s+/g, ' ') })))
  R.researchTreeNodes = await page.locator('.rs-node').count()
  await wait(900)
  R.after = await facts()
  R.shot = await shot('manual-TC03-research-after-open-100')
}

cases.TC04 = async (R) => {
  R.assists = ['S-4 fixture x2', 'reload (Playwright page.reload)']
  R.pre = await reachDebrief({})
  R.step1 = await facts()
  R.shot = await shot('manual-TC04-second-debrief-100')
  await page.click(RETURN)
  R.filed = await waitFiled()
  R.step2 = await facts()
  await page.reload()
  await wait(1200)
  R.menuBlobSeen = (await facts()).blobSeen
  await page.locator(CONTINUE).click()
  await wait(900)
  R.step3 = await facts()
  R.pre3 = await reachDebrief({})
  R.step4 = await facts()
}

cases.TC14 = async (R) => {
  R.assists = ['Menu reached by reload (no in-app path from a Screen to the Menu); state continues from TC04 step 4']
  await page.click(RETURN)
  R.filed = await waitFiled()
  await page.reload()
  await wait(1200)
  R.menuButtons = await page.$$eval('.menu-actions button', (b) => b.map((x) => x.getAttribute('aria-label')))
  await page.locator('[aria-label="BEGIN NEW OPERATION"]').click()
  await wait(300)
  const armed = await page.locator('[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]').count()
  R.confirmShown = armed > 0
  if (armed) await page.locator('[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]').click()
  await wait(1200)
  R.step2 = await facts()
  R.pre = await reachDebrief({})
  R.step3 = await facts()
  R.shot = await shot('manual-TC14-new-operation-first-debrief-100')
}

cases.TC05 = async (R) => {
  await fresh()
  R.assists = ['S-3 harness', 'S-4 fixture x2']
  R.pre = await reachDebrief({})
  R.before = await facts()
  await page.click(UNDERSTOOD)
  await wait(300)
  R.after = await facts()
  R.shot = await shot('manual-TC05-after-understood-100')
  await page.click(RETURN)
  await wait(900)
  R.pre2 = await reachDebrief({})
  R.step3 = await facts()
}

cases.TC06 = async (R) => {
  await fresh()
  R.assists = ['S-3 harness', 'S-4 fixture x2']
  R.pre = await reachDebrief({})
  R.before = await facts()
  await page.click(RETURN)
  await wait(900)
  R.step1 = await facts()
  R.pre2 = await reachDebrief({})
  R.step2 = await facts()
  R.shot = await shot('manual-TC06-second-debrief-after-return-100')
}

cases.TC07 = async (R) => {
  await fresh()
  R.assists = ['S-3 harness', 'S-4 fixture', 'S-4 setOutcome step only, same fields (quietReplay false as S-4 defines)']
  R.pre = await reachDebrief({})
  R.before = await facts()
  await page.click('button:has-text("REPLAY MISSION")')
  await wait(900)
  R.step1 = await facts()
  R.briefHasCodename = await page.evaluate(async (id) => {
    const { MISSIONS } = await import('/src/game/data.ts')
    const m = MISSIONS.find((x) => x.id === id)
    return { codename: m?.codename, inBody: !!m && document.body.innerText.includes(m.codename), hasAccept: !!document.querySelector('[aria-label^="ACCEPT CONTRACT"]') }
  }, R.step1.missionId)
  R.shotBrief = await shot('manual-TC07-replay-brief-100')
  R.pre2 = await reachDebrief({}, null, true)
  R.step2 = await facts()
  R.shot = await shot('manual-TC07-replay-debrief-100')
}

cases.TC07b = async (R) => {
  await fresh()
  R.assists = ['S-3 harness', 'S-4 fixture', 'supplementary: replay outcome with quietReplay true (what deployFreeze sets when contractsWon includes the contract)']
  R.pre = await reachDebrief({})
  await page.click('button:has-text("REPLAY MISSION")')
  await wait(900)
  R.contractsWon = await page.evaluate(async () => [...(await import('/src/state/campaignStore.ts')).useCampaignStore.getState().contractsWon])
  R.step1 = await facts()
  R.pre2 = await reachDebrief({ quietReplay: true }, null, true)
  R.step2 = await facts()
  R.shot = await shot('manual-TC07b-quiet-replay-debrief-100')
}

cases.TC08 = async (R) => {
  await fresh()
  R.assists = ['S-3 harness', "S-4 fixture before='wipe' (roster trimmed to one operative who dies)", 'text scale via settingsStore']
  R.pre = await reachDebrief({}, 'wipe')
  R.f = await facts()
  R.fonts = await page.evaluate(() => ({ failed: getComputedStyle(document.querySelector('.db-failed')).fontSize, title: getComputedStyle(document.querySelector('.db-title')).fontSize }))
  R.scales = {}
  R.shots = []
  for (const s of [100, 125]) {
    await setScale(s)
    await wait(300)
    const clips = await clipAll(['.db-failed', '.db-research', '.db-research-btn', '.db-card'])
    const g = await facts()
    R.scales[s] = { clips, cardBottom: g.cardBottom, bannerTop: g.bannerTop, promptTop: g.promptTop }
    R.shots.push(await shot(`manual-TC08-pyrrhic-${s}`))
  }
  await setScale(100)
  await wait(300)
}

cases.TC09 = async (R) => {
  await fresh()
  R.assists = ['S-3 harness', "S-4 fixture before='wipe', fields { won: false, reward: 0 }"]
  R.pre = await reachDebrief({ won: false, reward: 0 }, 'wipe')
  R.f = await facts()
  R.clips = await clipAll(['.db-failed', '.db-research', '.db-research-btn', '.db-card'])
  R.shot = await shot('manual-TC09-roster-loss-100')
}

cases.TC10 = async (R) => {
  await fresh()
  R.assists = ['S-3 harness', 'S-4 fixture x2', 'reload (Playwright page.reload)']
  R.pre = await reachDebrief({})
  R.step1 = await facts()
  await page.reload()
  await wait(1200)
  R.step3 = await facts()
  await page.locator(CONTINUE).click()
  await wait(900)
  R.step4 = await facts()
  R.pre5 = await reachDebrief({})
  R.step5 = await facts()
  R.shot = await shot('manual-TC10-reload-then-debrief-100')
}

cases.TC11 = async (R) => {
  await fresh()
  R.assists = ['S-3 harness', "S-4 fixture before='broke' (Credits 1,000), fields { won: false, reward: 0 }"]
  R.pre = await reachDebrief({ won: false, reward: 0 }, 'broke')
  R.f = await facts()
  R.shot = await shot('manual-TC11-unaffordable-100')
  await page.click(RETURN)
  R.filed = await waitFiled()
  R.step2 = await facts()
}

cases.TC12 = async (R) => {
  R.assists = ['state continues from TC11', 'S-4 fixture x2 (defaults, no before)']
  R.pre = await reachDebrief({})
  R.step1 = await facts()
  R.shot = await shot('manual-TC12-affordable-fires-100')
  await page.click(UNDERSTOOD)
  await wait(300)
  await page.click(RETURN)
  await wait(900)
  R.pre2 = await reachDebrief({})
  R.step2 = await facts()
}

cases.TC13 = async (R) => {
  await fresh()
  R.assists = ['S-3 harness', 'S-4 fixture']
  await wait(500)
  await page.locator('[aria-label="Dismiss the orientation"]').click({ timeout: 1500 }).catch(() => {})
  R.c0 = (await facts()).credits
  await page.locator('[aria-label="RESEARCH"]').click()
  await wait(800)
  await page.locator('[aria-label^="BARREL WEAR COATING //"]').first().click()
  await wait(400)
  R.authLabel = await page.locator('[aria-label^="AUTHORIZE BARREL WEAR COATING"]').getAttribute('aria-label')
  await page.locator('[aria-label^="AUTHORIZE BARREL WEAR COATING"]').click()
  await wait(500)
  R.afterAuth = await facts()
  R.shotResearch = await shot('manual-TC13-research-authorized-100')
  await page.locator('[aria-label="WORLD NETWORK"]').click()
  await wait(900)
  R.pre = await reachDebrief({})
  R.f = await facts()
  R.shot = await shot('manual-TC13-busy-lab-debrief-100')
}

const order = ['TC02', 'TC03', 'TC04', 'TC14', 'TC05', 'TC06', 'TC07', 'TC07b', 'TC08', 'TC09', 'TC10', 'TC11', 'TC12', 'TC13', 'TC01']
const viewport = await (async () => { await page.goto(URL); await wait(800); return page.evaluate(() => innerWidth + 'x' + innerHeight) })()
results.viewport = viewport
console.log('viewport', viewport)
for (const id of order) {
  if (ONLY.length && !ONLY.includes(id)) continue
  const R = {}
  const e0 = errs.length
  try { await cases[id](R) } catch (e) { R.error = String(e && e.stack ? e.stack : e) }
  R.consoleErrors = errs.slice(e0)
  results[id] = R
  console.log(id, R.error ? 'ERROR ' + R.error.split('\n')[0] : 'done', 'errors', R.consoleErrors.length)
  writeFileSync(resultsFile, JSON.stringify(results, null, 1))
}
await browser.close()
