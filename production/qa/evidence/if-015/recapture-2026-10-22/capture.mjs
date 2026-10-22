// IF-015 capture: the Brief KIT line from objective kinds (Interface AC31,
// TR-interface-002). Brief at 1280x720 for the three authored contracts and
// one generated contract per type (SEIZURE / EXTRACTION / SABOTAGE /
// SUPPRESSION, variant 1 so SABOTAGE carries destroy + defend and SEIZURE /
// SUPPRESSION carry an interact), each at text scales 90 / 100 / 110 / 125,
// plus one deploy of the generated SABOTAGE contract to compare the Brief's
// objective list with the HUD objective panel.
// Headless Chrome for Testing against a vite dev server.
// Harness assists, named: localStorage clear; New Operation through
// save.startNewOperation; intelLevel raised to 3 so every contract is
// selectable; four generated records injected into useWorldStore.contracts
// (the market list the Brief resolves through resolveMission); text scale
// through the settings store; Brief reached through selectMission (the app
// store's own gate), the mission through goto('team') + startMission.
//
// Run: npm run dev -- --strictPort --port 4215
//      SWEEP_URL=http://localhost:4215/ node production/qa/evidence/if-015/capture.mjs
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
const URL = process.env.SWEEP_URL || 'http://localhost:4215/'
const OUT = new globalThis.URL('.', import.meta.url).pathname
const SCALES = [90, 100, 110, 125]

// Spec literals (AC31), pinned here and not read from the module.
const DESTROY = 'power cells arm grenades, the fast tool; gunfire works, slowly'
const ESCORT = 'the asset must reach the pad alive'
const interact = (n) => `an operative holds the console for ${n} s`
const defend = (n) => `hold the zone for ${n} s`
const EXPECT = {
  m01: [],
  m02: [interact(4), interact(5), ESCORT],
  m03: [DESTROY, DESTROY, defend(45)],
  SEIZURE: [interact(4)],
  SUPPRESSION: [interact(4)],
  EXTRACTION: [interact(5), ESCORT],
  SABOTAGE: [DESTROY, defend(45)],
}

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

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.evaluate(async () => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    useCampaignStore.setState({ intelLevel: 3 })
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const { sequenceVariant } = await import('/src/game/contracts.ts')
    let seed = 0
    while (sequenceVariant(seed) !== 1) seed++
    const rec = (type, i) => ({
      id: 'gc-if015-' + type.toLowerCase(),
      createdT: 1000,
      expiresAtT: 10 ** 9,
      sector: 'eu',
      cityId: 'nc',
      district: 7 + i,
      type,
      client: 'helix',
      threat: 'HIGH',
      reward: 52000,
      seed,
      priority: type === 'SUPPRESSION',
      expedited: false,
    })
    const injected = ['SEIZURE', 'EXTRACTION', 'SABOTAGE', 'SUPPRESSION'].map(rec)
    useWorldStore.setState({ contracts: [...useWorldStore.getState().contracts, ...injected] })
  })
  await wait(300)
}

async function openBrief(id) {
  await page.evaluate(async (id) => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().selectMission(id)
  }, id)
  await page.waitForSelector('.mb-obj', { timeout: 20000 })
  await wait(700)
}

// The Brief's objective rows and their KIT lines, plus the clip probe: each
// row scrolled into view, then its box must fit its text and sit inside the
// viewport (the Brief column scrolls at 125%, IF-001).
const briefFacts = () =>
  page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { resolveMission } = await import('/src/state/worldStore.ts')
    const a = useAppStore.getState()
    const m = a.missionId ? resolveMission(a.missionId) : null
    const rows = [...document.querySelectorAll('.mb-obj')]
    const clips = []
    const probe = (el, label) => {
      el.scrollIntoView({ block: 'nearest' })
      const r = el.getBoundingClientRect()
      const overflow = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
      const out = r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5 || r.left < -0.5 || r.top < -0.5
      if (overflow || out) clips.push(label + ' sw' + el.scrollWidth + '/cw' + el.clientWidth + ' sh' + el.scrollHeight + '/ch' + el.clientHeight + ' r' + Math.round(r.right) + ' b' + Math.round(r.bottom))
    }
    const kits = []
    rows.forEach((row, i) => {
      probe(row, 'row' + i)
      const kit = row.querySelector('.mb-obj-kit')
      if (kit) {
        probe(kit, 'kit' + i)
        kits.push(kit.textContent)
      }
    })
    const box = rows[0] ? rows[0].parentElement : null
    if (box) probe(box, 'objectives-box')
    return {
      phase: a.phase,
      missionId: a.missionId,
      codename: m ? m.codename : null,
      type: m ? m.type : null,
      kinds: m ? m.objectives.map((o) => o.kind + (o.durationSec ? ':' + o.durationSec : '')) : null,
      labels: m ? m.objectives.map((o) => o.label) : null,
      rowCount: rows.length,
      kits,
      clips,
      scale: getComputedStyle(document.documentElement).getPropertyValue('--text-scale').trim(),
    }
  })

// textContent of the KIT span is "KIT: " + the line (CSS uppercases it for
// the chrome; the DOM carries the spec string).
const stripKit = (s) => s.replace(/^KIT:\s*/, '')

async function briefFor(id, slug) {
  await openBrief(id)
  let f = await briefFacts()
  check(`${slug}: Brief open (phase brief, mission ${id})`, f.phase === 'brief' && f.missionId === id, JSON.stringify({ phase: f.phase, id: f.missionId }))
  check(`${slug}: one row per objective (${f.rowCount} of ${f.labels ? f.labels.length : '?'})`, !!f.labels && f.rowCount === f.labels.length)
  const expected = EXPECT[slug]
  check(`${slug}: KIT lines read as specified from kinds [${f.kinds}]`, JSON.stringify(f.kits.map(stripKit)) === JSON.stringify(expected), JSON.stringify(f.kits))
  for (const scale of SCALES) {
    await setScale(scale)
    await wait(300)
    f = await briefFacts()
    check(`${slug} scale ${scale}: nothing clips, rows inside the viewport`, f.clips.length === 0 && f.scale === String(scale / 100), f.clips.join(' | ') + ' scale ' + f.scale)
    await shot(`${slug.toLowerCase()}-brief-${scale}`)
  }
  await setScale(100)
  await wait(200)
  return f
}

try {
  await fresh()
  // 1-3. The three authored contracts.
  const authored = [['m01', 'm01'], ['m02', 'm02'], ['m03', 'm03']]
  const names = {}
  for (const [id, slug] of authored) {
    const f = await briefFor(id, slug)
    names[slug] = f.codename
  }
  note('authored: ' + JSON.stringify(names))
  // 4-7. One generated contract per type, variant 1.
  const briefKinds = {}
  for (const type of ['SEIZURE', 'EXTRACTION', 'SABOTAGE', 'SUPPRESSION']) {
    const f = await briefFor('gc-if015-' + type.toLowerCase(), type)
    check(`${type}: the resolved mission is the generated ${type}`, f.type === type, f.type)
    briefKinds[type] = { kinds: f.kinds, labels: f.labels, kits: f.kits.map(stripKit) }
  }
  note('generated: ' + JSON.stringify(briefKinds))

  // 8. Agreement: deploy the generated SABOTAGE contract and compare the HUD
  // objective panel with what the Brief printed.
  await openBrief('gc-if015-sabotage')
  const brief = briefKinds.SABOTAGE
  await page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('team')
    await new Promise((r) => setTimeout(r, 600))
    useAppStore.getState().startMission()
  })
  await page.waitForSelector('.hud-objectives', { timeout: 30000 }).catch(() => null)
  await wait(5000)
  const live = await page.evaluate(async () => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useMissionStore } = await import('/src/state/missionStore.ts')
    const { resolveMission } = await import('/src/state/worldStore.ts')
    const a = useAppStore.getState()
    const m = a.missionId ? resolveMission(a.missionId) : null
    return {
      phase: a.phase,
      missionId: a.missionId,
      storeLabels: useMissionStore.getState().objectives.map((o) => o.label),
      hudLabels: [...document.querySelectorAll('.hud-obj-text')].map((el) => el.textContent),
      deployedKinds: m ? m.objectives.map((o) => o.kind + (o.durationSec ? ':' + o.durationSec : '')) : null,
      deployedLabels: m ? m.objectives.map((o) => o.label) : null,
    }
  })
  check('deploy: mission phase on the generated SABOTAGE contract', live.phase === 'mission' && live.missionId === 'gc-if015-sabotage', JSON.stringify({ phase: live.phase, id: live.missionId }))
  check('deploy: the mission the sim was built from lists the same kinds the Brief printed from', JSON.stringify(live.deployedKinds) === JSON.stringify(brief.kinds), JSON.stringify({ brief: brief.kinds, deployed: live.deployedKinds }))
  check('deploy: the HUD objective panel (mission store rows) lists the Brief objectives in order', JSON.stringify(live.storeLabels) === JSON.stringify(brief.labels), JSON.stringify({ brief: brief.labels, store: live.storeLabels }))
  check('deploy: the HUD DOM prints those same labels', JSON.stringify(live.hudLabels) === JSON.stringify(brief.labels), JSON.stringify(live.hudLabels))
  await shot('sabotage-deployed-hud-objectives-100')
} catch (e) {
  fails++
  note('ERROR ' + (e && e.stack ? e.stack : String(e)))
}

check('no console or page errors', errs.length === 0, errs.join(' | '))
note(fails === 0 ? 'ALL PASS' : `${fails} FAIL`)
writeFileSync(`${OUT}capture-output.txt`, log.join('\n') + '\n')
await browser.close()
process.exit(fails === 0 ? 0 : 1)
