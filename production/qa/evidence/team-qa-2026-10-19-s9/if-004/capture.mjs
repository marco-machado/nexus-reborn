// IF-004 capture: Chance vs Risk bands (AC7) and World Network owner readouts
// (AC27), at 1280x720 in headless Chrome for Testing against the dev server
// (:4200). Real UI clicks drive focus, Pause, contract select. Harness assists,
// named: intelLevel is set on campaignStore (1 then 2) for the Brief compare;
// influence points, a cooldown and the Review pin are set on worldStore; the
// Antarctica shot forces worldStore.selected = 'an' because the sector list
// does not let a player focus it.
//
// Run: node production/qa/evidence/if-004/capture.mjs   (vite dev on :4200)
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

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
page.on('response', (r) => r.status() >= 400 && errs.push('HTTP ' + r.status() + ' ' + r.url()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const log = []
const note = (s) => { log.push(s); console.log(s) }
const world = (fn, arg) =>
  page.evaluate(async ([src, a]) => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    return new Function('store', 'a', src)(useWorldStore, a)
  }, [fn, arg])
const intel = (n) =>
  page.evaluate(async (n) => {
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    useCampaignStore.setState({ intelLevel: n })
  }, n)
const actions = () =>
  page.evaluate(() => [...document.querySelectorAll('.wm-act')].map((b) => ({
    label: b.getAttribute('aria-label'), disabled: b.disabled,
  })))
// The sector readout: Control and Unrest (.wm-cu) plus the .kv rows (COORD,
// TAX YIELD, TAX PAID, GARRISON). The Scan four numbers are Control, Unrest,
// Tax yield and Garrison (ADR-0014).
const readout = () =>
  page.evaluate(() => [
    ...[...document.querySelectorAll('.wm-right .wm-cu > div')].map((d) =>
      d.querySelector('label').textContent + ' ' + d.querySelector('b').textContent),
    ...[...document.querySelectorAll('.wm-right .kv')].map((k) => k.innerText.replace(/\s+/g, ' ')),
  ])
const cu = (r) => r.filter((x) => /^(CONTROL|UNREST) /.test(x))
const overflow = () =>
  page.evaluate(() => [...document.querySelectorAll('.wm-act, .wm-tax-pay, .wm-onboard-row, .mb-tac-stat')]
    .filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)
    .map((e) => e.className + ' :: ' + e.innerText.slice(0, 40)))

await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.reload()
await wait(1500)
await page.getByText('NEW OPERATION').first().click()
await wait(1500)

// First-visit overlay.
const onboard = await page.locator('.wm-onboard').innerText()
note('onboarding text: ' + onboard.replace(/\s+/g, ' '))
note('overflow (onboard): ' + JSON.stringify(await overflow()))
await shot('01-first-visit-overlay')
await page.locator('[aria-label="Dismiss the orientation"]').click()
await wait(400)
await page.locator('[aria-label="PAUSE STRATEGIC CLOCK"]').click()
await wait(300)

// Europe: printed Tax, not Nexus-held; opening 0 points -> UNAFFORDABLE.
await page.locator('.wm-sector', { hasText: 'EUROPE' }).first().click()
await wait(500)
note('EU readout: ' + JSON.stringify(await readout()))
note('EU actions (0 pts): ' + JSON.stringify(await actions()))
await shot('02-europe-tax-not-paying-unaffordable')

// North America: 4,080 CR / 24h, Nexus-held, pays.
await page.locator('.wm-sector', { hasText: 'NORTH AMERICA' }).first().click()
await wait(500)
note('NA readout: ' + JSON.stringify(await readout()))
await shot('03-north-america-tax-pays')

// Cooldown, no target, active: 40 points, spend Stabilize in Europe, and
// clear Europe's generated contracts so Expedite has no target.
await world(`store.setState((s) => ({ influence: 40, contracts: s.contracts.filter((c) => c.sector !== 'eu') }))`)
await page.locator('.wm-sector', { hasText: 'EUROPE' }).first().click()
await wait(300)
await page.locator('.wm-act', { hasText: 'STABILIZE' }).click()
await wait(300)
await world(`store.setState((s) => ({ spends: [] }))`)
await wait(300)
note('EU actions (cooldown/no target): ' + JSON.stringify(await actions()))
note('overflow (actions): ' + JSON.stringify(await overflow()))
await shot('04-europe-cooldown-no-target')

// Antarctica: not focusable from the list; forced focus shows no actions.
const anBtn = page.locator('.wm-sector', { hasText: 'ANTARCTICA' }).first()
note('Antarctica list aria: ' + (await anBtn.getAttribute('aria-label')) + ' aria-disabled=' + (await anBtn.getAttribute('aria-disabled')))
await anBtn.click({ force: true })
await wait(300)
note('after clicking Antarctica, selected=' + (await world(`return store.getState().selected`)))
await world(`store.setState({ selected: 'an' })`)
await wait(400)
note('AN actions (forced focus): ' + JSON.stringify(await actions()))
note('AN readout: ' + JSON.stringify(await readout()))
await shot('05-antarctica-no-influence-action')
await world(`store.setState({ selected: 'na' })`)
await wait(300)

// Timeline Live vs Review; Scan sector numbers stay live. Real clicks stage
// Stabilize and Lobby on North America (32 points left after Europe's
// Stabilize), so its Control and Unrest move on the strategic clock. The
// Review pin is set on worldStore, then a real CLOCK SPEED 8X click resumes
// the clock while the pin holds: the Feed stays pinned, the numbers must move.
await page.locator('.wm-act', { hasText: 'STABILIZE' }).click()
await wait(200)
await page.locator('.wm-act', { hasText: 'LOBBY' }).click()
await wait(300)
const live = await readout()
note('NA readout live (paused): ' + JSON.stringify(live))
await shot('06-timeline-live')
await world(`store.setState((s) => ({ review: s.t - 6 * 3600 }))`)
await wait(400)
const pinT = await world(`return store.getState().t`)
const pinned = await readout()
note('timeline cue (review, paused): ' + (await page.locator('.wm-live').first().innerText()).replace(/\s+/g, ' '))
note('NA readout at pin (paused): ' + JSON.stringify(pinned))
await page.locator('[aria-label="CLOCK SPEED 8X"]').click()
// Run until both staged steps are due (Stabilize 1h, Lobby 1.5h) or 30 s.
for (let i = 0; i < 60; i++) {
  if ((await world(`return store.getState().t`)) >= pinT + 6000) break
  await wait(500)
}
await page.locator('[aria-label="PAUSE STRATEGIC CLOCK"]').click()
await wait(300)
const after = await world(`const s = store.getState(); return { t: s.t, review: s.review }`)
const rev = await readout()
const cue = (await page.locator('.wm-live').first().innerText()).replace(/\s+/g, ' ')
note('clock advanced while pinned: ' + ((after.t - pinT) / 3600).toFixed(2) + 'h; pin still set: ' + (after.review !== null))
note('timeline cue (review, after run): ' + cue)
note('NA readout after run (review pinned): ' + JSON.stringify(rev))
const moved = JSON.stringify(cu(pinned)) !== JSON.stringify(cu(rev))
const pinHeld = after.review !== null && /^REVIEW/.test(cue)
note('NA Control/Unrest moved while Review pinned: ' + moved + '; pin held: ' + pinHeld)
if (!moved || !pinHeld || after.t <= pinT) {
  note('FAIL: Scan numbers did not stay live under the Review pin')
  process.exitCode = 1
}
await shot('07-timeline-review-numbers-live')
await world(`store.setState({ review: null })`)
await wait(300)

// Brief at intel 1 vs 2 on the same contract; World Network Chance both times.
for (const n of [1, 2]) {
  await intel(n)
  await page.locator('[aria-label="WORLD NETWORK"]').click()
  await wait(600)
  // Glass Veil is a Europe contract.
  await page.locator('.wm-sector', { hasText: 'EUROPE' }).first().click()
  await wait(300)
  const chips = await page.evaluate(() => {
    const row = [...document.querySelectorAll('.wm-op')].find((e) => e.innerText.includes('GLASS VEIL'))
    return [...(row?.querySelectorAll('.chip') ?? [])].map((c) => c.textContent).filter((t) => /CHANCE/.test(t))
  })
  note(`intel ${n} World Network Glass Veil chance chip: ` + JSON.stringify(chips))
  await shot((n === 1 ? '08' : '10') + `-world-network-intel-${n}-chance`)
  await page.locator('[aria-label^="OPEN CONTRACT GLASS VEIL"]').first().click()
  await wait(900)
  const stats = await page.evaluate(() =>
    Object.fromEntries([...document.querySelectorAll('.mb-tac-stat')].map((s) => [s.querySelector('label').textContent, s.querySelector('b').textContent])))
  note(`intel ${n} Brief stats: ` + JSON.stringify(stats))
  note('overflow (brief): ' + JSON.stringify(await overflow()))
  // The odds line is the last row of the tactical rail; scroll it into view.
  await page.evaluate(() => document.querySelectorAll('.mb-tac-rail, .mb-tac-rail *').forEach((e) => { e.scrollTop = e.scrollHeight }))
  await wait(300)
  await shot((n === 1 ? '09' : '11') + `-brief-intel-${n}`)
}

note('errors: ' + JSON.stringify(errs))
writeFileSync(OUT + 'capture-output.txt', log.join('\n') + '\n')
await browser.close()
