// IF-012 /team-qa 2026-10-19 probe, cases TC-06 and TC-07 of
// production/qa/test-cases/if-012-assembly-hire-refusals-cases.md.
// Headless Chrome for Testing at 1280x720 against a vite dev server.
// TC-06: a second valid heavy-tier deploy in the same campaign, captured at or
// after the sim time the first advisory was seen, with its region in frame.
// TC-07: real pointer clicks on the disabled HIRE buttons and the disabled
// DEPLOY; an init script logs every AudioBufferSourceNode.start() call.
// src/ui/sound.ts exports no generic cue-request function (only uiClick and
// bed start/stop), so source starts are the only cue signal logged.
// Fixtures are the retained capture.mjs fixtures, named: startNewOperation,
// then Credits 9,000 CR (unaffordable) or 500,000 CR, roster 4 or full
// (8 / 8), squad maxHp +80 (over 400 kg) or +40 (heavy, legal) with two med
// kits each, tutorial skipped, all through store setState; the hint dismissal
// and return to Assembly through tutorialStore.dismissHint and appStore.goto.
//
// Run: npm run dev -- --strictPort      (port 4200)
//      SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/if-012/probe.mjs
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

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
await ctx.addInitScript(() => {
  window.__starts = []
  const S = window.AudioBufferSourceNode
  if (S) {
    const start = S.prototype.start
    S.prototype.start = function (...a) {
      window.__starts.push({ t: Math.round(performance.now()), loop: this.loop === true })
      return start.apply(this, a)
    }
  }
})
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
const starts = () => page.evaluate(() => window.__starts.slice())
const clickCenter = async (loc) => {
  const b = await loc.boundingBox()
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
}

async function assembly(setup) {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.evaluate(async (setup) => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const { MISSIONS } = await import('/src/game/data.ts')
    const c = useCampaignStore.getState()
    if (setup.rosterSize !== undefined) {
      const ops = Array.from({ length: setup.rosterSize }, (_, n) => c.operatives[n] ?? { ...c.operatives[0], id: 'fill' + n, codename: 'FILL' + n })
      const roster = Object.fromEntries(ops.map((o) => [o.id, c.roster[o.id] ?? { status: 'READY', recoverAtT: null, xp: 0, pins: {} }]))
      useCampaignStore.setState({ operatives: ops, roster })
    }
    if (setup.credits !== undefined) useAppStore.setState({ credits: setup.credits })
    useAppStore.getState().selectMission(MISSIONS[0].id)
    useAppStore.getState().goto('team')
  }, setup)
  await wait(700)
}
const heavy = (extraHp) =>
  page.evaluate(async (extraHp) => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    const base = (await import('/src/game/data.ts')).ROSTER
    const squad = useAppStore.getState().squad
    useCampaignStore.setState({
      operatives: useCampaignStore.getState().operatives.map((o) => squad.includes(o.id) ? { ...o, maxHp: base.find((b) => b.id === o.id).maxHp + extraHp } : o),
    })
    useAppStore.setState({ loadout: Object.fromEntries(squad.map((id) => [id, ['med', 'med']])) })
    useTutorialStore.getState().skipTutorial()
  }, extraHp)
const simTime = () => page.evaluate(async () => (await import('/src/game/runtime.ts')).getWorld()?.time ?? null)

try {
  // ---------- TC-07: refusal clicks request no sound ----------
  await assembly({ rosterSize: 4, credits: 9000 })
  await page.click('button[aria-label^="OPEN THE RECRUITMENT MARKET"]')
  await wait(1500)
  const hires = page.locator('.ts-rec-card .ts-rec-hire')
  const nHire = await hires.count()
  const a0 = (await starts()).length
  for (let i = 0; i < nHire; i++) await clickCenter(hires.nth(i))
  await wait(1000)
  const a1 = await starts()
  const hireState = await page.evaluate(() => [...document.querySelectorAll('.ts-rec-card')].map((c) => ({ disabled: c.querySelector('.ts-rec-hire')?.disabled, why: c.querySelector('.ts-rec-why')?.textContent?.trim() })))
  check('TC-07 unaffordable: HIRE still disabled with reason after clicks', nHire === 3 && hireState.every((c) => c.disabled && /^INSUFFICIENT CREDITS/.test(c.why)), JSON.stringify(hireState))
  check('TC-07 unaffordable: 0 source starts from the disabled HIRE clicks', a1.length === a0, `starts before ${a0}, after ${a1.length}: ${JSON.stringify(a1.slice(a0))}`)
  await page.click('button[aria-label="CLOSE THE RECRUITMENT MARKET"]')
  await wait(300)

  await assembly({ credits: 500000 })
  await heavy(80)
  await wait(1500)
  const deploy = page.locator('.ts-deploy button')
  const b0 = (await starts()).length
  await clickCenter(deploy)
  await wait(1000)
  const b1 = await starts()
  const sub = (await page.locator('.ts-deploy-sub').textContent()).trim()
  const ph = await page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
  check('TC-07 over-limit: Deploy still disabled, reason visible, still in Assembly', (await deploy.isDisabled()) && /^OFFLOAD \d+\.\d KG BEFORE DEPLOYMENT$/.test(sub) && ph === 'team', `${sub}, phase ${ph}`)
  check('TC-07 over-limit: 0 source starts from the disabled DEPLOY click', b1.length === b0, `starts before ${b0}, after ${b1.length}: ${JSON.stringify(b1.slice(b0))}`)
  await shot('probe-07-refusals-1280x720')

  // ---------- TC-06: second heavy deploy, no repeat, with an image ----------
  await assembly({ credits: 500000 })
  await heavy(40)
  await wait(400)
  await deploy.click()
  await page.waitForSelector('.hud-toast.hint', { timeout: 30000 })
  await wait(1500)
  const first = await page.evaluate(() => {
    const el = document.querySelector('.hud-toast.hint')
    const r = el.getBoundingClientRect()
    return { text: el.textContent, region: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
  })
  const tFirst = await simTime()
  note(`TC-06 first deploy: advisory at sim t ${tFirst?.toFixed(2)}, region ${JSON.stringify(first.region)}, text "${first.text}"`)
  await shot('probe-06a-first-heavy-deploy-advisory')
  await page.evaluate(async () => {
    ;(await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().dismissHint('hint-overweight')
    ;(await import('/src/state/appStore.ts')).useAppStore.getState().goto('team')
  })
  await wait(800)
  check('TC-06 back in Assembly with a heavy legal squad', !(await deploy.isDisabled()) && (await page.locator('.ts-mass-tier').textContent()).trim().startsWith('HEAVY LOAD'))
  await deploy.click()
  await page.waitForSelector('.hud-btn.pause', { timeout: 30000 })
  for (let i = 0; i < 40 && ((await simTime()) ?? 0) < tFirst; i++) await wait(250)
  await wait(500)
  const tSecond = await simTime()
  const again = await page.evaluate(async () => ({
    phase: (await import('/src/state/appStore.ts')).useAppStore.getState().phase,
    hints: (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().hints,
    toasts: document.querySelectorAll('.hud-toast.hint').length,
  }))
  await shot('probe-06-second-heavy-deploy-no-advisory')
  check('TC-06 second heavy deploy: Mission, no advisory, captured at or after the first advisory time', again.phase === 'mission' && again.hints.length === 0 && again.toasts === 0 && tSecond >= tFirst, `${JSON.stringify(again)}, t ${tSecond?.toFixed(2)} >= ${tFirst?.toFixed(2)}`)
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
} finally {
  note(`errors: ${JSON.stringify(errs)}`)
  note(fails === 0 && errs.length === 0 ? 'ALL PASS' : `FAILS: ${fails}, errors ${errs.length}`)
  writeFileSync(OUT + 'probe-output.txt', log.join('\n') + '\n')
  await browser.close()
}
