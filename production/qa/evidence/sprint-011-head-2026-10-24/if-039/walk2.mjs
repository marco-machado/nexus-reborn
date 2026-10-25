// IF-039 hand-walk, Sprint 11 Phase 5, build 131a5c1. Headless Chrome for
// Testing, 1280x720. Launch and fresh() copied from
// production/qa/evidence/playtest-fixes-2026-10-23/sweep.mjs.
// Run: node production/qa/evidence/sprint-011-head-2026-10-24/if-039/walk.mjs
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
const wait = (ms) => page.waitForTimeout(ms)
const R = {}
const note = (k, v) => { R[k] = v; console.log(k, JSON.stringify(v)) }
const store = (fn, arg) => page.evaluate(fn, arg)
const shot = (n) => page.screenshot({ path: OUT + n })
const setScale = (s) => store(async (s) => { (await import('/src/state/settingsStore.ts')).useSettingsStore.getState().setTextScale(s) }, s)

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await store(async () => {
    (await import('/src/state/save.ts')).startNewOperation()
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    for (const id of ['hint-worldmap', 'hint-influence', 'hint-debrief-research']) useTutorialStore.getState().markSeen(id)
  })
}
const intel = (n) => store(async (n) => (await import('/src/state/campaignStore.ts')).useCampaignStore.setState({ intelLevel: n }), n)
const openBrief = async (id) => {
  const ph = await store(async (id) => {
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('world')
    useAppStore.getState().selectMission(id)
    return useAppStore.getState().phase
  }, id)
  await wait(800)
  return ph
}
// walk2: re-run of TC-09 / TC-10 (row finder fixed: the label renders with a
// leading "> " glyph) and TC-12 step 4 (the 125% armed read came back empty).
const kiaRows = () => page.evaluate(() => {
  const all = [...document.querySelectorAll('body *')]
  const labels = all.filter((e) => e.innerText && /KIA \/\//.test(e.innerText) && ![...e.children].some((c) => c.innerText && /KIA \/\//.test(c.innerText)))
  const text = document.body.innerText
  return {
    rows: labels.map((l) => {
      const row = l.parentElement
      return { label: l.innerText.trim(), value: row.innerText.replace(l.innerText, '').replace(/\s+/g, ' ').trim(), row: String(row.className), html: row.outerHTML.slice(0, 600) }
    }),
    idxCasualties: text.indexOf('SQUAD CASUALTIES'), idxKia: text.indexOf('KIA //'), idxInjured: text.indexOf('INJURED //'),
    lines: text.split('\n').filter((ln) => /DART|MARA|KIA|INJURED|CASUALT/.test(ln)),
  }
})
const team = async () => {
  await fresh()
  await store(async () => { const { useAppStore } = await import('/src/state/appStore.ts'); useAppStore.getState().selectMission('m03'); useAppStore.getState().goto('team') })
  await wait(900)
}
const settle = (o) => store(async (o) => {
  const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
  const applyKey = useAppStore.getState().lastAppliedKey + 1
  useAppStore.getState().setOutcome(settleOutcome({ applyKey, bonus: 0, quietReplay: false, ...o }))
}, o)
await team()
await settle({ won: true, kills: 6, casualties: 1, timeSec: 72, civiliansHit: 1, reward: 37000, deadIds: ['op3'], survivorHp: { op1: 0.9, op2: 0.3, op4: 0.8 } })
await page.waitForSelector('.db-filing', { timeout: 20000 }); await wait(2500)
const k9 = await kiaRows()
k9.store = await store(async () => { const { useCampaignStore } = await import('/src/state/campaignStore.ts'); const s = useCampaignStore.getState(); return { operatives: s.operatives.length, kia: s.lastReport && s.lastReport.kia } })
note('tc09', k9)
await team()
note('tc10-seed', await store(async () => {
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  useCampaignStore.setState((s) => ({ roster: { ...s.roster, op1: { ...s.roster.op1, xp: 120 }, op3: { ...s.roster.op3, xp: 45 } } }))
  const r = useCampaignStore.getState().roster; return { op1: r.op1.xp, op3: r.op3.xp }
}))
await settle({ won: true, kills: 4, casualties: 2, timeSec: 120, civiliansHit: 0, reward: 41000, deadIds: ['op1', 'op3'], survivorHp: { op2: 0.9, op4: 0.9 } })
await page.waitForSelector('.db-filing', { timeout: 20000 }); await wait(2500)
note('tc10-two', await kiaRows())
await team()
await settle({ won: true, kills: 2, casualties: 0, timeSec: 180, civiliansHit: 0, reward: 85000, deadIds: [], survivorHp: {} })
await page.waitForSelector('.db-filing', { timeout: 20000 }); await wait(1800)
note('tc10-none', await kiaRows())

// TC-12 step 4
await team()
await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission())
await wait(6000)
await page.keyboard.press('Escape'); await wait(600)
await setScale(125); await wait(500)
const st = () => page.evaluate(() => { const h = document.querySelector('.pause-arm-hint'); const b = document.querySelector('button.hud-btn.abort'); return { hint: h ? h.innerText.trim() : null, btn: b ? b.innerText.trim() : null } })
const t = { afterScale: await st() }
await page.locator('button.hud-btn.abort').click()
t.t0 = await st()
await wait(150)
t.t150 = await st()
t.geo = await page.evaluate(() => {
  const h = document.querySelector('.pause-arm-hint'); const r = h.getBoundingClientRect()
  const panel = h.closest('.panel'); const p = panel.getBoundingClientRect()
  const rg = document.createRange(); rg.selectNodeContents(h)
  const lines = [...rg.getClientRects()].map((q) => ({ l: Math.round(q.left * 10) / 10, r: Math.round(q.right * 10) / 10, t: Math.round(q.top) }))
  return { text: h.innerText.trim(), hintL: r.left, hintR: r.right, scrollW: h.scrollWidth, clientW: h.clientWidth, panelL: p.left, panelR: p.right, lines }
})
await shot('if039-tc12-armed-125.png')
await setScale(100)
note('tc12-125', t)
note('pageerrors', errs)
writeFileSync(OUT + 'walk2-output.json', JSON.stringify(R, null, 2))
await browser.close()
