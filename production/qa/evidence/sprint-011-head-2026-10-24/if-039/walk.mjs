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
const scrollTo = (sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: 'center' }) }, sel)
// Clone contracts[0] under new ids/types/seeds.
const cloneContracts = (specs) => store(async (specs) => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const cs = useWorldStore.getState().contracts
  if (!cs.length) return { error: 'contracts empty', n: 0 }
  const base = cs[0]
  const clones = specs.map((s) => ({ ...base, ...s }))
  useWorldStore.setState({ contracts: [...cs, ...clones] })
  return { base, clones }
}, specs)
const objTiers = () => page.evaluate(() => [...document.querySelectorAll('.mb-obj')].map((o) => {
  const b = o.querySelector('b')
  return { tier: b ? b.innerText.trim() : null, text: o.innerText.replace(/\s+/g, ' ').trim() }
}))
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim()

// ---------- TC-01 / TC-03 / TC-04 ----------
await fresh(); await intel(2)
note('COLLATERAL_FINE', await store(async () => (await import('/src/state/appStore.ts')).COLLATERAL_FINE))
for (const id of ['m03', 'm01', 'm02']) {
  note(`brief-${id}-phase`, await openBrief(id))
  const d = await page.evaluate(() => {
    const c = document.querySelector('.mb-collateral')
    const boxEl = c && c.closest('.mb-box')
    const desc = boxEl ? [...boxEl.querySelectorAll('*')] : []
    const meters = desc.filter((e) => /seg|bar|meter/i.test(typeof e.className === 'string' ? e.className : '') || e.getAttribute('role') === 'meter' || e.tagName === 'METER' || e.tagName === 'PROGRESS').map((e) => e.className)
    const all = document.body.innerText
    const eta = document.querySelector('.mb-reward-eta')
    return {
      collateral: c ? c.innerText.replace(/\s+/g, ' ').trim() : null,
      boxText: boxEl ? boxEl.innerText.replace(/\s+/g, ' ').trim() : null,
      meters, pct: boxEl ? /%/.test(boxEl.innerText) : null,
      tierParen: boxEl ? /LOW|MODERATE|HIGH \(/.test(boxEl.innerText) : null,
      tolerance: /COLLATERAL TOLERANCE/.test(all), ten: /\(10%\)/.test(all),
      eta: eta ? eta.innerText.trim() : null, etaInReward: eta ? !!eta.closest('.mb-reward') : null,
      etaOld: (all.match(/ETA [234]D/g) || []),
    }
  })
  d.etaDays = await store(async (id) => (await import('/src/state/worldStore.ts')).resolveMission(id)?.etaDays, id)
  d.tiers = await objTiers()
  note(`brief-${id}`, d)
  await scrollTo('.mb-collateral'); await shot(`if039-tc01-${id}.png`)
  if (id === 'm03') {
    await scrollTo('.mb-reward-eta'); await shot('if039-tc03-m03.png')
    const n = await page.evaluate(() => document.querySelectorAll('.mb-obj').length)
    for (let i = 0; i < n; i++) {
      await page.evaluate((i) => document.querySelectorAll('.mb-obj')[i].scrollIntoView({ block: 'center' }), i)
      await shot(`if039-tc04-m03-${i + 1}.png`)
    }
  }
}

// ---------- TC-02 ----------
await fresh(); await intel(2)
note('tc02-contracts-at-fresh', await store(async () => (await import('/src/state/worldStore.ts')).useWorldStore.getState().contracts))
note('tc02-clone', await cloneContracts([
  { id: 'qa039-seizure', type: 'SEIZURE' }, { id: 'qa039-extraction', type: 'EXTRACTION' }, { id: 'qa039-sabotage', type: 'SABOTAGE' },
]))
await intel(5)
for (const id of ['m01', 'm02', 'm03', 'qa039-seizure', 'qa039-extraction', 'qa039-sabotage']) {
  const ph = await openBrief(id)
  const notes = await page.evaluate(() => [...document.querySelectorAll('.mb-note')].map((n) => n.innerText.trim()))
  note(`tc02-${id}`, { phase: ph, notes, has: notes.some((n) => n.includes('EVERY CIVILIAN HIT IS BILLED.')) })
  await scrollTo('.mb-note'); await shot(`if039-tc02-${id}.png`)
}

// ---------- TC-05 ----------
await fresh(); await intel(5)
const S1 = await store(async () => { const c = await import('/src/game/contracts.ts'); for (let s = 1; s < 10000; s++) if (c.sequenceVariant(s) === 1) return s })
note('tc05-S1', S1)
const cl5 = await cloneContracts([{ id: 'qa039-sab-v1', type: 'SABOTAGE', seed: S1 }, { id: 'qa039-ext', type: 'EXTRACTION' }])
cl5.variants = await store(async (seeds) => { const c = await import('/src/game/contracts.ts'); return seeds.map((s) => c.sequenceVariant(s)) }, (cl5.clones || []).map((c) => c.seed))
note('tc05-clone', cl5)
for (const id of ['qa039-sab-v1', 'qa039-ext']) {
  note(`tc05-${id}`, { phase: await openBrief(id), tiers: await objTiers() })
  if (id === 'qa039-sab-v1') { await scrollTo('.mb-obj'); await shot('if039-tc05-sab.png') }
}

// ---------- TC-07 ----------
await fresh(); await intel(2)
for (const id of ['m03', 'm01', 'm02']) {
  await openBrief(id)
  await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().goto('team'))
  await wait(900)
  const d = await page.evaluate(() => {
    const sub = document.querySelector('.ts-deploy-sub')
    const btn = [...document.querySelectorAll('button')].find((b) => /DEPLOY/.test(b.innerText))
    const hint = document.querySelector('.ts-loadout-hint')
    const box = hint && hint.closest('.ts-box')
    const lo = box && box.querySelector('.ts-loadout')
    return {
      sub: sub ? sub.innerText.replace(/\s+/g, ' ').trim() : null,
      deployBtn: btn ? { text: btn.innerText.trim(), disabled: btn.disabled } : null,
      hint: hint ? hint.innerText.replace(/\s+/g, ' ').trim() : null,
      hintInBox: !!box, hintAboveLoadout: lo ? !!(hint.compareDocumentPosition(lo) & Node.DOCUMENT_POSITION_FOLLOWING) : null,
    }
  })
  if (id === 'm03') {
    await shot('if039-tc07-m03.png')
    d.cycle = []
    const slot = page.locator('.ts-loadout-slot').first()
    d.cycle.push(await slot.evaluate((e) => ({ text: e.innerText.replace(/\s+/g, ' ').trim(), filled: e.classList.contains('filled') })))
    for (let i = 0; i < 3; i++) {
      await slot.click(); await wait(200)
      d.cycle.push(await slot.evaluate((e) => ({ text: e.innerText.replace(/\s+/g, ' ').trim(), filled: e.classList.contains('filled') })))
    }
  }
  note(`tc07-${id}`, d)
}

// ---------- TC-09 / TC-10 ----------
const kiaRows = () => page.evaluate(() => {
  const all = [...document.querySelectorAll('body *')]
  const labels = all.filter((e) => e.innerText && e.innerText.trim().startsWith('KIA //') && ![...e.children].some((c) => c.innerText && c.innerText.trim().startsWith('KIA //')))
  const text = document.body.innerText
  return {
    rows: labels.map((l) => {
      const row = l.parentElement
      return { label: l.innerText.trim(), value: row.innerText.replace(l.innerText, '').replace(/\s+/g, ' ').trim(), row: row.className, rowText: row.innerText.replace(/\s+/g, ' ').trim() }
    }),
    idxCasualties: text.indexOf('SQUAD CASUALTIES'), idxKia: text.indexOf('KIA //'), idxInjured: text.indexOf('INJURED //'),
    dartLines: text.split('\n').filter((ln) => /\bDART\b/.test(ln)),
  }
})
const team = async () => {
  await fresh()
  await store(async () => { const { useAppStore } = await import('/src/state/appStore.ts'); useAppStore.getState().selectMission('m03'); useAppStore.getState().goto('team') })
  await wait(900)
}
await team()
await store(async () => {
  const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
  const applyKey = useAppStore.getState().lastAppliedKey + 1
  useAppStore.getState().setOutcome(settleOutcome({ applyKey, won: true, kills: 6, casualties: 1, timeSec: 72, civiliansHit: 1, reward: 37000, bonus: 0, deadIds: ['op3'], survivorHp: { op1: 0.9, op2: 0.3, op4: 0.8 }, quietReplay: false }))
})
await page.waitForSelector('.db-filing', { timeout: 20000 }); await wait(2500)
await shot('if039-tc09.png')
const k9 = await kiaRows()
k9.store = await store(async () => { const { useCampaignStore } = await import('/src/state/campaignStore.ts'); const s = useCampaignStore.getState(); return { operatives: s.operatives.length, kia: s.lastReport && s.lastReport.kia } })
note('tc09', k9)

await team()
note('tc10-seed', await store(async () => {
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  useCampaignStore.setState((s) => ({ roster: { ...s.roster, op1: { ...s.roster.op1, xp: 120 }, op3: { ...s.roster.op3, xp: 45 } } }))
  const r = useCampaignStore.getState().roster
  const ops = useCampaignStore.getState().operatives
  return { op1: r.op1.xp, op3: r.op3.xp, codenames: ops.map((o) => o.id + ':' + o.codename) }
}))
await store(async () => {
  const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
  const applyKey = useAppStore.getState().lastAppliedKey + 1
  useAppStore.getState().setOutcome(settleOutcome({ applyKey, won: true, kills: 4, casualties: 2, timeSec: 120, civiliansHit: 0, reward: 41000, bonus: 0, deadIds: ['op1', 'op3'], survivorHp: { op2: 0.9, op4: 0.9 }, quietReplay: false }))
})
await page.waitForSelector('.db-filing', { timeout: 20000 }); await wait(2500)
await shot('if039-tc10-two.png')
note('tc10-two', await kiaRows())
await team()
await store(async () => {
  const { useAppStore, settleOutcome } = await import('/src/state/appStore.ts')
  const applyKey = useAppStore.getState().lastAppliedKey + 1
  useAppStore.getState().setOutcome(settleOutcome({ applyKey, won: true, kills: 2, casualties: 0, timeSec: 180, civiliansHit: 0, reward: 85000, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false }))
})
await page.waitForSelector('.db-filing', { timeout: 20000 }); await wait(1800)
await shot('if039-tc10-none.png')
note('tc10-none', await kiaRows())

// ---------- TC-12 ----------
const mission = async (id = 'm03') => {
  await fresh()
  if (id !== 'm03') await intel(5)
  return id
}
await team()
await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission())
await wait(6000)
await page.keyboard.press('Escape'); await wait(600)
const pauseState = () => page.evaluate(async () => {
  const h = document.querySelector('.pause-arm-hint'); const b = document.querySelector('button.hud-btn.abort')
  const { useAppStore } = await import('/src/state/appStore.ts')
  return { hint: h ? h.innerText.trim() : null, btn: b ? b.innerText.trim() : null, aria: b ? b.getAttribute('aria-label') : null, phase: useAppStore.getState().phase }
})
const t12 = { before: await pauseState() }
await page.locator('button.hud-btn.abort').click(); await wait(300)
t12.armed = await pauseState()
await shot('if039-tc12-armed-100.png')
await wait(3500)
t12.lapsed = await pauseState()
await setScale(125); await wait(300)
if (!(await page.locator('button.hud-btn.abort').count())) { await page.keyboard.press('Escape'); await wait(600) }
await page.locator('button.hud-btn.abort').click(); await wait(300)
await shot('if039-tc12-armed-125.png')
t12.armed125 = await page.evaluate(() => {
  const h = document.querySelector('.pause-arm-hint'); const r = h.getBoundingClientRect()
  const chain = []
  for (let n = h.parentElement; n && n !== document.body; n = n.parentElement) { const q = n.getBoundingClientRect(); chain.push({ cls: String(n.className), left: q.left, right: q.right }) }
  // text line rects
  const rg = document.createRange(); rg.selectNodeContents(h)
  const lines = [...rg.getClientRects()].map((q) => ({ l: Math.round(q.left * 10) / 10, r: Math.round(q.right * 10) / 10 }))
  return { text: h.innerText.trim(), left: r.left, right: r.right, scrollW: h.scrollWidth, clientW: h.clientWidth, lines, chain: chain.slice(0, 5) }
})
t12.after125 = await pauseState()
await setScale(100)
note('tc12', t12)

// ---------- TC-15 / TC-16 ----------
const heads = () => page.evaluate(() => [...document.querySelectorAll('.hud-panel-head')].map((h) => {
  const span = h.querySelector(':scope > span') || h
  const panel = h.closest('.hud-panel')
  const p = panel ? panel.getBoundingClientRect() : null
  const pcs = panel ? getComputedStyle(panel) : null
  const rg = document.createRange(); rg.selectNodeContents(span)
  const raw = [...rg.getClientRects()]
  const tops = [...new Set(raw.map((q) => Math.round(q.top)))]
  const lines = raw.map((q) => ({ l: Math.round(q.left * 10) / 10, r: Math.round(q.right * 10) / 10, t: Math.round(q.top) }))
  const inner = p ? p.width - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight) - parseFloat(pcs.borderLeftWidth) - parseFloat(pcs.borderRightWidth) : null
  const ok = p ? lines.every((q) => q.r <= p.right + 1.5 && q.l >= p.left - 1.5 && q.l >= 0 && q.r <= 1280) : null
  return {
    panel: panel ? String(panel.className) : null, text: span.innerText.trim(), ellipsis: /…|\.\.\./.test(span.innerText) || getComputedStyle(span).textOverflow === 'ellipsis',
    lineCount: tops.length, spanW: Math.round(span.getBoundingClientRect().width), panelL: p && Math.round(p.left * 10) / 10, panelR: p && Math.round(p.right * 10) / 10, inner: inner && Math.round(inner), lines, ok,
  }
}))
const singleLineW = () => page.evaluate(() => {
  const span = document.querySelector('.hud-objectives .hud-panel-head > span')
  if (!span) return null
  const c = span.cloneNode(true); c.style.whiteSpace = 'nowrap'; c.style.position = 'absolute'; c.style.visibility = 'hidden'
  span.parentElement.appendChild(c); const w = c.getBoundingClientRect().width; c.remove(); return Math.round(w)
})
await team()
await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission())
await wait(6000)
const t15 = {}
t15.at100 = await heads(); t15.single100 = await singleLineW()
await setScale(125); await wait(300)
t15.at125 = await heads(); t15.single125 = await singleLineW()
await shot('if039-tc15-hud-125.png')
const ob = await page.evaluate(() => { const r = document.querySelector('.hud-objectives')?.getBoundingClientRect(); return r && { x: r.x, y: r.y, width: r.width, height: r.height } })
if (ob) await page.screenshot({ path: OUT + 'if039-tc15-objectives-125.png', clip: { x: Math.max(0, ob.x - 4), y: Math.max(0, ob.y - 4), width: Math.min(1280 - Math.max(0, ob.x - 4), ob.width + 8), height: Math.min(720 - Math.max(0, ob.y - 4), ob.height + 8) } })
await setScale(100)
note('tc15', t15)

await fresh(); await intel(5)
note('tc16-clone', await cloneContracts([{ id: 'qa039-supp', type: 'SUPPRESSION' }]))
await store(async () => { const { useAppStore } = await import('/src/state/appStore.ts'); useAppStore.getState().goto('world'); useAppStore.getState().selectMission('qa039-supp'); useAppStore.getState().goto('team') })
await wait(900)
await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().startMission())
await wait(6000)
const t16 = { phase: await store(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase) }
await setScale(125); await wait(300)
t16.at125 = await heads(); t16.single125 = await singleLineW()
await shot('if039-tc16-hud-125.png')
await setScale(100)
note('tc16', t16)

note('pageerrors', errs)
writeFileSync(OUT + 'walk-output.json', JSON.stringify(R, null, 2))
await browser.close()
