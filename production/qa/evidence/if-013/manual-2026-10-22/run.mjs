// IF-013 manual-case session, 2026-10-22. Headless Chrome for Testing via the
// playwright-core inside the global @playwright/cli, own browser context,
// viewport 1280x720, against the already-running dev server on :4200.
// Writes raw observations to observations.json and screenshots next to this file.
// Harness assists are named in each case's record ("assists").
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync, existsSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname
const SCALES = [90, 100, 110, 125]

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
let cur = 'setup'
const rec = {}
const R = (k, v) => { (rec[cur] ??= { assists: [], errors: [] })[k] = v; console.log(cur, k, JSON.stringify(v)) }
const assist = (s) => { (rec[cur] ??= { assists: [], errors: [] }).assists.push(s) }
const begin = (id) => { cur = id; rec[id] ??= { assists: [], errors: [] }; console.log('=== ' + id) }
page.on('pageerror', (e) => (rec[cur] ??= { assists: [], errors: [] }).errors.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && (rec[cur] ??= { assists: [], errors: [] }).errors.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = async (name) => {
  const p = `${OUT}${name}.png`
  if (existsSync(p)) throw new Error('refusing to overwrite ' + p)
  await page.screenshot({ path: p })
  ;(rec[cur].shots ??= []).push(name + '.png')
}
const vp = () => page.evaluate(() => [innerWidth, innerHeight])
const setScale = async (scale) => {
  await page.evaluate(async (scale) => {
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setTextScale(scale)
  }, scale)
  await wait(350)
}
// clippedSel verbatim from capture.mjs
const clippedSel = (sel) =>
  page.evaluate((sel) => {
    const out = []
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect()
      let overflow = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
      if (el.tagName === 'BUTTON') {
        const range = document.createRange()
        range.selectNodeContents(el)
        const t = range.getBoundingClientRect()
        overflow = t.left < r.left - 0.5 || t.right > r.right + 0.5 || t.top < r.top - 0.5 || t.bottom > r.bottom + 0.5
      }
      const clip =
        overflow ||
        r.right > innerWidth + 0.5 ||
        r.bottom > innerHeight + 0.5 ||
        r.left < -0.5 ||
        r.top < -0.5
      if (clip) out.push(sel + ' ' + (el.textContent || '').slice(0, 40) + ' sw' + el.scrollWidth + '/cw' + el.clientWidth + ' sh' + el.scrollHeight + '/ch' + el.clientHeight + ' b' + Math.round(r.bottom))
    }
    return out
  }, sel)
const state = () =>
  page.evaluate(async () => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const ops = document.querySelector('.wm-ops')?.getBoundingClientRect()
    const seen = useTutorialStore.getState().seen
    return {
      phase: useAppStore.getState().phase,
      missionId: useAppStore.getState().missionId,
      intel: useCampaignStore.getState().intelLevel,
      influence: useWorldStore.getState().influence,
      selected: useWorldStore.getState().selected,
      seenWorldmap: seen.filter((i) => i === 'hint-worldmap').length,
      seenInfluence: seen.filter((i) => i === 'hint-influence').length,
      seen,
      card: !!document.querySelector('.wm-onboard'),
      moments: document.querySelectorAll('.wm-moment').length,
      momentTitle: document.querySelector('.wm-moment-title')?.textContent ?? null,
      momentBody: document.querySelector('.wm-moment-body')?.textContent ?? null,
      momentText: document.querySelector('.wm-moment')?.textContent ?? null,
      inset: !!document.querySelector('.wm-inset'),
      acts: [...document.querySelectorAll('.wm-act')].map((b) => ({
        name: b.querySelector('.wm-act-name')?.textContent?.trim(),
        status: b.querySelector('.wm-act-status')?.textContent,
        disabled: b.disabled,
        title: b.title,
      })),
      opsBottom: ops ? Math.round(ops.bottom) : null,
      opsHeight: ops ? Math.round(ops.height) : null,
      opsRows: document.querySelectorAll('.wm-ops .wm-op').length,
      rightOver: (() => { const c = document.querySelector('.wm-right'); return c ? c.scrollHeight - c.clientHeight : null })(),
    }
  })
const ops = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.wm-ops .wm-op')].map((b) => ({
      codename: b.querySelector('.wm-op-main b')?.textContent,
      sub: b.querySelector('.wm-op-main i')?.textContent,
      lockedClass: b.classList.contains('locked'),
      ariaDisabled: b.getAttribute('aria-disabled'),
      ariaLabel: b.getAttribute('aria-label'),
      lockGlyph: !!b.querySelector('.wm-op-glyph svg') && b.classList.contains('locked'),
      chips: [...b.querySelectorAll('.wm-op-meta .chip')].map((c) => c.textContent),
    })),
  )
const sectorBtn = (name) => page.locator('button.wm-sector', { has: page.locator('.wm-sector-name', { hasText: new RegExp('^' + name + '$') }) })
const clickSector = async (name) => { await sectorBtn(name).click({ timeout: 3000 }); await wait(350) }
const nav = async (label) => { await page.click(`button.navtab[aria-label="${label}"]`, { timeout: 3000 }); await wait(500) }
const opRow = (codename) => page.locator('button.wm-op', { has: page.locator('.wm-op-main b', { hasText: new RegExp('^' + codename + '$') }) })

async function fno() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  R('fno.viewport', await vp())
  const armed = await page.locator('button[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]').count()
  await page.click('button[aria-label="BEGIN NEW OPERATION"]', { timeout: 3000 })
  await wait(300)
  if (await page.locator('button[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]').count()) {
    await page.click('button[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]')
    R('fno.erasePrompt', true)
  }
  await wait(900)
  R('fno.path', 'real click << NEW OPERATION >> (localStorage.clear + reload first)')
}
const dismissCard = async () => { await page.click('button[aria-label="Dismiss the orientation"]', { timeout: 3000 }); await wait(300) }

async function run(id, fn) {
  begin(id)
  try { await fn() } catch (e) { R('EXCEPTION', String(e && e.stack || e)) }
}

await run('IF013-01', async () => {
  await fno()
  await setScale(100); assist('text scale 100 via settingsStore.setTextScale')
  const s = await state(); R('phase', s.phase); R('card', s.card)
  R('titles', await page.evaluate(() => [...document.querySelectorAll('.wm-onboard-row')].map((r) => r.querySelector('b')?.textContent)))
  R('cardText', await page.evaluate(() => document.querySelector('.wm-onboard')?.textContent))
  await shot('IF013-01-100')
})

await run('IF013-02', async () => {
  const s = await state(); R('intel', s.intel); R('selectedAtStart', s.selected)
  R('startHere', await page.evaluate(() => document.querySelector('.wm-onboard-row[data-row="start"] span')?.textContent))
  const all = {}
  for (const sec of ['EUROPE', 'NORTH AMERICA', 'SOUTH AMERICA', 'AFRICA', 'ASIA', 'OCEANIA']) {
    try { await clickSector(sec) } catch (e) { R('clickFail.' + sec, String(e).slice(0, 200)); continue }
    all[sec] = { selected: (await state()).selected, ops: await ops() }
  }
  R('scan', all)
  await clickSector('EUROPE')
  R('cardStillUp', (await state()).card)
  await shot('IF013-02-100-eu')
})

await run('IF013-03', async () => {
  R('time', await page.evaluate(() => document.querySelector('.wm-onboard-row[data-row="time"] span')?.textContent))
  R('job', await page.evaluate(() => document.querySelector('.wm-onboard-row[data-row="job"] span')?.textContent))
  R('numbers', await page.evaluate(() => [...document.querySelectorAll('.wm-onboard-row[data-row="numbers"] .wm-onboard-lines > span')].map((x) => x.textContent)))
})

await run('IF013-04', async () => {
  assist('text scale via settingsStore.setTextScale')
  for (const sc of SCALES) {
    await setScale(sc)
    const clip = {}
    for (const sel of ['.wm-onboard-row b', '.wm-onboard-row > span', '.wm-onboard-lines > span', '.wm-onboard', '.wm-onboard .hud-btn']) clip[sel] = await clippedSel(sel)
    R('clip' + sc, clip); R('vp' + sc, await vp())
    await shot('IF013-04-' + sc)
  }
  await setScale(100)
})

await run('IF013-05', async () => {
  const b = await state(); R('before', { count: b.seenWorldmap, card: b.card })
  await dismissCard()
  const a = await state(); R('after', { count: a.seenWorldmap, card: a.card, phase: a.phase })
  await shot('IF013-05-100')
})

await run('IF013-06', async () => {
  await nav('RESEARCH'); R('phaseAfterResearch', (await state()).phase)
  await nav('WORLD NETWORK'); const s1 = await state(); R('afterNav', { phase: s1.phase, card: s1.card })
  await wait(1100)
  const blob = await page.evaluate(() => localStorage.getItem('nexus-save-v1'))
  R('blobHasHintWorldmap', !!blob && blob.includes('hint-worldmap'))
  await page.reload(); await wait(1200)
  R('vpAfterReload', await vp())
  await page.click('button[aria-label="CONTINUE SAVED OPERATION // OPEN THE WORLD NETWORK"]', { timeout: 3000 })
  await wait(900)
  const s2 = await state(); R('afterReload', { phase: s2.phase, card: s2.card, count: s2.seenWorldmap })
  await shot('IF013-06-100-after-reload')
})

await run('IF013-07', async () => {
  await page.reload(); await wait(1200); assist('page reload to reach the Menu (no in-game route to Menu from World Network)')
  R('vp', await vp())
  await page.click('button[aria-label="BEGIN NEW OPERATION"]', { timeout: 3000 }); await wait(300)
  R('confirmLabel', await page.locator('button[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]').textContent().catch(() => null))
  await page.click('button[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]', { timeout: 3000 })
  await wait(900)
  const s = await state(); R('after', { phase: s.phase, card: s.card, count: s.seenWorldmap, influenceSeen: s.seenInfluence })
  await shot('IF013-07-100')
})

await run('IF013-08', async () => {
  await dismissCard()
  const s = await state()
  R('state', { influence: s.influence, selected: s.selected, seenInfluence: s.seenInfluence, acts: s.acts, moments: s.moments, inset: s.inset })
  await shot('IF013-08-100')
})

await run('IF013-09', async () => {
  await clickSector('NORTH AMERICA')
  const s = await state(); R('state', { selected: s.selected, acts: s.acts, moments: s.moments })
  await shot('IF013-09-100')
  await clickSector('EUROPE'); R('restored', (await state()).selected)
})

await run('IF013-10', async () => {
  assist('text scale via settingsStore.setTextScale')
  for (const sc of SCALES) {
    await setScale(sc)
    const s = await state()
    R('s' + sc, { clip: [...await clippedSel('.wm-act-name'), ...await clippedSel('.wm-act-status'), ...await clippedSel('.wm-right')], rightOver: s.rightOver, selected: s.selected, influence: s.influence, moments: s.moments })
    await shot('IF013-10-' + sc)
  }
  await setScale(100)
})

await run('IF013-11', async () => {
  await page.evaluate(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ influence: 8 }) })
  assist('clean-win fixture worldStore.setState({ influence: 8 })')
  await wait(400)
  const s = await state()
  R('state', { moments: s.moments, title: s.momentTitle, body: s.momentBody, acts: s.acts, seenInfluence: s.seenInfluence, inset: s.inset, opsRows: s.opsRows, selected: s.selected })
  await shot('IF013-11-100')
})

await run('IF013-12', async () => {
  assist('text scale via settingsStore.setTextScale')
  for (const sc of SCALES) {
    await setScale(sc)
    const s = await state()
    const clip = []
    for (const sel of ['.wm-moment-title', '.wm-moment-body', '.wm-moment-btn', '.wm-moment', '.wm-right']) clip.push(...await clippedSel(sel))
    R('s' + sc, { clip, rightOver: s.rightOver, opsBottom: s.opsBottom, opsHeight: s.opsHeight, moments: s.moments })
    await shot('IF013-12-' + sc)
  }
  await setScale(100)
})

await run('IF013-13', async () => {
  await page.click('button[aria-label="Dismiss the Influence note"]', { timeout: 3000 }); await wait(300)
  const s = await state(); R('state', { moments: s.moments, inset: s.inset, seenInfluence: s.seenInfluence })
  await shot('IF013-13-100')
})

await run('IF013-14', async () => {
  const b = await state(); R('before', { influence: b.influence, selected: b.selected })
  await page.locator('.wm-act').first().click({ timeout: 3000 }); await wait(400)
  const a = await state(); R('afterSpend', { influence: a.influence, moments: a.moments, acts: a.acts })
  await page.evaluate(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ influence: 20 }) })
  assist('recovery worldStore.setState({ influence: 20 })')
  await wait(400)
  const per = {}
  for (const sec of ['EUROPE', 'AFRICA', 'ASIA', 'OCEANIA', 'NORTH AMERICA', 'SOUTH AMERICA']) {
    await clickSector(sec); await wait(100)
    const s = await state(); per[sec] = { selected: s.selected, moments: s.moments, acts: s.acts.map((x) => x.status) }
  }
  R('perSector', per)
  await shot('IF013-14-100-south-america')
  await nav('RESEARCH'); await nav('WORLD NETWORK')
  const z = await state(); R('afterNav', { phase: z.phase, moments: z.moments, seenInfluence: z.seenInfluence, influence: z.influence })
})

await run('IF013-15', async () => {
  await wait(1100)
  const blob = await page.evaluate(() => localStorage.getItem('nexus-save-v1'))
  R('blobHasHintInfluence', !!blob && blob.includes('hint-influence'))
  await page.reload(); await wait(1200); R('vp', await vp())
  await page.click('button[aria-label="CONTINUE SAVED OPERATION // OPEN THE WORLD NETWORK"]', { timeout: 3000 }); await wait(900)
  const s = await state()
  R('state', { phase: s.phase, influence: s.influence, selected: s.selected, acts: s.acts.map((x) => x.status), moments: s.moments, card: s.card, seen: s.seen, seenWorldmap: s.seenWorldmap, seenInfluence: s.seenInfluence })
  await shot('IF013-15-100')
})

await run('IF013-17', async () => {
  await fno(); await dismissCard()
  await page.evaluate(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ influence: 8 }); useWorldStore.getState().select('an') })
  assist('clean-win fixture influence 8 + worldStore.select("an") in one eval'); assist('text scale via settingsStore.setTextScale')
  await wait(400)
  for (const sc of SCALES) {
    await setScale(sc)
    const s = await state(); R('s' + sc, { selected: s.selected, acts: s.acts.length, moments: s.moments, seenInfluence: s.seenInfluence })
    await shot('IF013-17-' + sc)
  }
  await setScale(100)
  await clickSector('EUROPE'); await wait(400)
  const s = await state(); R('refocusEU', { selected: s.selected, moments: s.moments, seenInfluence: s.seenInfluence, title: s.momentTitle })
  await shot('IF013-17-100-refocus-eu')
})

await run('IF013-18', async () => {
  await page.evaluate(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.getState().select('an') })
  assist('worldStore.select("an")')
  await wait(400)
  const s = await state(); R('state', { selected: s.selected, moments: s.moments, text: s.momentText, acts: s.acts.length, inset: s.inset })
  await shot('IF013-18-100')
})

await run('IF013-19', async () => {
  await fno(); await dismissCard()
  await page.evaluate(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ influence: 8 }) })
  assist('clean-win fixture worldStore.setState({ influence: 8 })')
  await wait(400)
  const b = await state(); R('before', { selected: b.selected, moments: b.moments, seenInfluence: b.seenInfluence })
  await shot('IF013-19-100-panel-up')
  await nav('RESEARCH'); await nav('WORLD NETWORK')
  const a = await state(); R('after', { phase: a.phase, moments: a.moments, seenInfluence: a.seenInfluence, inset: a.inset })
  await shot('IF013-19-100-after-return')
})

const rowRead = async (sec, code) => {
  await clickSector(sec)
  return (await ops()).find((o) => o.codename === code) ?? null
}
await run('IF013-20', async () => {
  await fno(); await dismissCard()
  const s0 = await state(); R('pre', { intel: s0.intel, missionId: s0.missionId })
  const rows = {}
  for (const [sec, code] of [['EUROPE', 'GLASS VEIL'], ['ASIA', 'HOLLOW CROWN'], ['NORTH AMERICA', 'RUST HAVEN']]) {
    rows[code] = await rowRead(sec, code)
    await shot('IF013-20-100-' + code.toLowerCase().replace(' ', '-'))
  }
  R('rows', rows)
  await clickSector('EUROPE'); await opRow('GLASS VEIL').click({ timeout: 3000 }); await wait(300)
  R('afterGlassVeil', (await state()).missionId)
  await clickSector('ASIA'); await opRow('HOLLOW CROWN').click({ timeout: 3000 }); await wait(300)
  R('afterHollowCrown', (await state()).missionId)
  await clickSector('NORTH AMERICA'); await opRow('RUST HAVEN').click({ timeout: 3000 }); await wait(500)
  const s = await state(); R('afterRustHaven', { missionId: s.missionId, phase: s.phase })
  await shot('IF013-20-100-after-rust-haven-click')
})

await run('IF013-21', async () => {
  if ((await state()).phase !== 'world') { await nav('WORLD NETWORK') }
  await page.evaluate(async () => { const { useCampaignStore } = await import('/src/state/campaignStore.ts'); useCampaignStore.setState({ intelLevel: 2 }) })
  assist('campaignStore.setState({ intelLevel: 2 })')
  await wait(300)
  const rows = {}
  for (const [sec, code] of [['EUROPE', 'GLASS VEIL'], ['ASIA', 'HOLLOW CROWN'], ['NORTH AMERICA', 'RUST HAVEN']]) {
    rows[code] = await rowRead(sec, code)
    await shot('IF013-21-100-' + code.toLowerCase().replace(' ', '-'))
  }
  R('rows', rows)
  await clickSector('EUROPE'); await opRow('GLASS VEIL').click({ timeout: 3000 }); await wait(500)
  const a = await state(); R('afterGlassVeil', { missionId: a.missionId, phase: a.phase })
  await shot('IF013-21-100-after-glass-veil-click')
  if (a.phase !== 'world') await nav('WORLD NETWORK')
  await clickSector('ASIA'); await opRow('HOLLOW CROWN').click({ timeout: 3000 }); await wait(500)
  const b = await state(); R('afterHollowCrown', { missionId: b.missionId, phase: b.phase })
  await shot('IF013-21-100-after-hollow-crown-click')
  R('ids', await page.evaluate(async () => { const d = await import('/src/game/data.ts'); return ['m01', 'm02', 'm03'].map((i) => [i, d.missionById(i)?.codename]) }))
})

writeFileSync(OUT + 'observations.json', JSON.stringify(rec, null, 2))
await browser.close()
