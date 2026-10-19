// IF-012 capture: Assembly hire refusals (unaffordable, full roster), the
// over-limit Deploy refusal, and the heavy-tier advisory in Mission.
// Headless Chrome for Testing at 1280x720 against a vite dev server.
// Harness assists, named: localStorage clear; New Operation, contract selection
// and phase changes through the app store; Credits, roster and loadout set
// through the stores (owner-reported fixtures); squad mass raised by giving the
// assigned operatives extra max HP (armour plating weighs 0.25 kg per HP);
// the tutorial steps marked seen so the advisory toast stands alone. The
// RECRUIT button, the Deploy button and the CLOSE button are real clicks.
//
// Run: npm run dev -- --strictPort --port 4218
//      SWEEP_URL=http://localhost:4218/ node production/qa/evidence/if-012/capture.mjs
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
const URL = process.env.SWEEP_URL || 'http://localhost:4218/'
const OUT = new globalThis.URL('.', import.meta.url).pathname

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu'] })
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

// Every candidate card: its ledger and reason lines, the HIRE disabled state,
// and whether any of the three lines is clipped by its card or the viewport.
const cards = () =>
  page.evaluate(() => {
    const clipped = (el) => !!el && (el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > innerWidth || el.getBoundingClientRect().bottom > innerHeight)
    return [...document.querySelectorAll('.ts-rec-card')].map((c) => {
      const ledger = c.querySelector('.ts-rec-ledger')
      const why = c.querySelector('.ts-rec-why')
      const btn = c.querySelector('.ts-rec-hire')
      return {
        ledger: ledger?.textContent ?? null,
        why: why?.textContent?.trim() ?? null,
        disabled: btn?.disabled ?? null,
        clipped: clipped(ledger) || clipped(why) || clipped(btn),
      }
    })
  })

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
    const { ROSTER_CAP } = await import('/src/game/recruits.ts')
    const c = useCampaignStore.getState()
    if (setup.rosterSize !== undefined) {
      const ops = Array.from({ length: setup.rosterSize }, (_, n) => c.operatives[n] ?? { ...c.operatives[0], id: 'fill' + n, codename: 'FILL' + n })
      const roster = Object.fromEntries(ops.map((o) => [o.id, c.roster[o.id] ?? { status: 'READY', recoverAtT: null, xp: 0, pins: {} }]))
      useCampaignStore.setState({ operatives: ops, roster })
    }
    if (setup.full) {
      const ops = [...c.operatives]
      while (ops.length < ROSTER_CAP) ops.push({ ...c.operatives[0], id: 'fill' + ops.length, codename: 'FILL' + ops.length })
      const roster = Object.fromEntries(ops.map((o) => [o.id, c.roster[o.id] ?? { status: 'READY', recoverAtT: null, xp: 0, pins: {} }]))
      useCampaignStore.setState({ operatives: ops, roster })
    }
    if (setup.credits !== undefined) useAppStore.setState({ credits: setup.credits })
    useAppStore.getState().selectMission(MISSIONS[0].id)
    useAppStore.getState().goto('team')
  }, setup)
  await wait(700)
}

try {
  // 1. Unaffordable: room on the roster, Credits below every listed fee.
  await assembly({ rosterSize: 4, credits: 9000 })
  await page.click('button[aria-label^="OPEN THE RECRUITMENT MARKET"]')
  await wait(400)
  let k = await cards()
  check('unaffordable: three candidates listed', k.length === 3, JSON.stringify(k))
  check('unaffordable: cost versus Credits printed on each', k.every((c) => /^COST [\d,]+ CR \/\/ CREDITS 9,000 CR$/.test(c.ledger)), JSON.stringify(k.map((c) => c.ledger)))
  check('unaffordable: HIRE disabled with the shortfall reason', k.every((c) => c.disabled && /^INSUFFICIENT CREDITS \/\/ [\d,]+ CR SHORT$/.test(c.why)), JSON.stringify(k.map((c) => c.why)))
  check('unaffordable: nothing clipped at 1280x720', k.every((c) => !c.clipped))
  await shot('01-unaffordable-hire-1280x720')

  // 2. Full roster: plenty of Credits, roster at the cap.
  await assembly({ full: true, credits: 500000 })
  await page.click('button[aria-label^="OPEN THE RECRUITMENT MARKET"]')
  await wait(400)
  k = await cards()
  check('full roster: cost versus Credits printed on each', k.length === 3 && k.every((c) => /^COST [\d,]+ CR \/\/ CREDITS 500,000 CR$/.test(c.ledger)), JSON.stringify(k.map((c) => c.ledger)))
  check('full roster: HIRE disabled with the capacity reason', k.every((c) => c.disabled && c.why === 'ROSTER AT CAPACITY // 8 / 8'), JSON.stringify(k.map((c) => c.why)))
  check('full roster: nothing clipped at 1280x720', k.every((c) => !c.clipped))
  await shot('02-full-roster-hire-1280x720')

  // 3. Control: affordable and room -> enabled, blank reason slot.
  await assembly({ rosterSize: 4, credits: 500000 })
  await page.click('button[aria-label^="OPEN THE RECRUITMENT MARKET"]')
  await wait(400)
  k = await cards()
  check('control: HIRE enabled with no reason text', k.length === 3 && k.every((c) => c.disabled === false && c.why === ''), JSON.stringify(k))
  await shot('03-hire-allowed-control-1280x720')
  await page.click('button[aria-label="CLOSE THE RECRUITMENT MARKET"]')
  await wait(300)

  // 4. Over-limit Deploy: squad over 400 kg; Deploy is refused, stays in Assembly, no advisory.
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
  await assembly({ credits: 500000 })
  await heavy(80)
  await wait(400)
  const deploy = page.locator('.ts-deploy button')
  const sub = (await page.locator('.ts-deploy-sub').textContent()).trim()
  const label = await deploy.getAttribute('aria-label')
  check('over-limit: Deploy disabled', await deploy.isDisabled())
  check('over-limit: visible reason names the overage', /^OFFLOAD \d+\.\d KG BEFORE DEPLOYMENT$/.test(sub), sub)
  check('over-limit: label names the limit', /KG OVER THE MASS LIMIT$/.test(label), label)
  await deploy.click({ force: true })
  await wait(400)
  const after = await page.evaluate(async () => ({
    phase: (await import('/src/state/appStore.ts')).useAppStore.getState().phase,
    hints: (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().hints,
    seen: (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().seen.includes('hint-overweight'),
  }))
  check('over-limit: never enters Mission and does not trigger the advisory', after.phase === 'team' && after.hints.length === 0 && !after.seen, JSON.stringify(after))
  await shot('04-over-limit-deploy-refused-1280x720')

  // 5. Heavy but legal (380-400 kg): Deploy enters Mission and the advisory shows once.
  await heavy(40)
  await wait(400)
  const tier = (await page.locator('.ts-mass-tier').textContent()).trim()
  check('heavy tier shown in Assembly', tier.startsWith('HEAVY LOAD'), tier)
  check('heavy legal squad: Deploy enabled', !(await deploy.isDisabled()))
  await deploy.click()
  await page.waitForSelector('.hud-toast.hint', { timeout: 30000 })
  await wait(1500)
  const toast = await page.evaluate(() => {
    const t = [...document.querySelectorAll('.hud-toast.hint')]
    const el = t[0]
    const r = el?.getBoundingClientRect()
    return { n: t.length, text: el?.textContent ?? '', clipped: !!el && (r.right > innerWidth || r.bottom > innerHeight || el.scrollWidth > el.clientWidth + 1) }
  })
  check('Mission: one HEAVY LOADOUT advisory', toast.n === 1 && toast.text.includes('HEAVY LOADOUT') && toast.text.includes('moves slower'), JSON.stringify(toast))
  check('Mission: advisory not clipped', !toast.clipped)
  await shot('05-heavy-tier-advisory-in-mission-1280x720')

  // 6. A later valid heavy deployment in the same campaign does not repeat it.
  const repeat = await page.evaluate(async () => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    useTutorialStore.getState().dismissHint('hint-overweight')
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('team')
    return true
  })
  await wait(800)
  await deploy.click()
  await wait(4000)
  const again = await page.evaluate(async () => ({
    phase: (await import('/src/state/appStore.ts')).useAppStore.getState().phase,
    hints: (await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().hints,
    toasts: document.querySelectorAll('.hud-toast.hint').length,
  }))
  check('second heavy deployment: Mission entered, advisory not repeated', repeat && again.phase === 'mission' && again.hints.length === 0 && again.toasts === 0, JSON.stringify(again))
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
}

check('no console or page errors', errs.length === 0, errs.join(' | '))
note(fails === 0 ? 'ALL PASS' : `${fails} FAIL`)
writeFileSync(`${OUT}capture-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails === 0 ? 0 : 1)
