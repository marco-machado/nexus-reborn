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

// PASS 2. IF013-02: the card is aria-modal and intercepts clicks on the left
// sector list, so START HERE is read with the card up, then the card is
// dismissed (real UNDERSTOOD click) and every open sector's OPEN CONTRACTS is
// read by real sector clicks. The strategic clock state is recorded.
await run('IF013-02', async () => {
  await fno()
  await setScale(100); assist('text scale 100 via settingsStore.setTextScale')
  const s = await state(); R('intel', s.intel); R('selectedAtStart', s.selected); R('card', s.card)
  R('startHere', await page.evaluate(() => document.querySelector('.wm-onboard-row[data-row="start"] span')?.textContent))
  R('euOpsBehindCard', await ops())
  await shot('IF013-02-100-card')
  const t0 = await page.evaluate(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); return useWorldStore.getState().t })
  await dismissCard()
  const all = {}
  for (const sec of ['EUROPE', 'NORTH AMERICA', 'SOUTH AMERICA', 'AFRICA', 'ASIA', 'OCEANIA']) {
    await clickSector(sec)
    all[sec] = { selected: (await state()).selected, ops: await ops() }
  }
  const t1 = await page.evaluate(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); return useWorldStore.getState().t })
  R('worldT', { beforeScan: t0, afterScan: t1 })
  R('scan', all)
  await clickSector('EUROPE')
  await shot('IF013-02-100-scan-eu')
})

// PASS 2. IF013-20 with force clicks on the aria-disabled rows (real mouse
// click dispatched at the row; force only skips Playwright's enabled check).
await run('IF013-20', async () => {
  await fno(); await dismissCard()
  const s0 = await state(); R('pre', { intel: s0.intel, missionId: s0.missionId, phase: s0.phase })
  await clickSector('EUROPE'); await opRow('GLASS VEIL').click({ force: true, timeout: 3000 }); await wait(300)
  let s = await state(); R('afterGlassVeil', { missionId: s.missionId, phase: s.phase })
  await clickSector('ASIA'); await opRow('HOLLOW CROWN').click({ force: true, timeout: 3000 }); await wait(300)
  s = await state(); R('afterHollowCrown', { missionId: s.missionId, phase: s.phase })
  await shot('IF013-20-100-after-locked-clicks')
  await clickSector('NORTH AMERICA'); await opRow('RUST HAVEN').click({ timeout: 3000 }); await wait(500)
  s = await state(); R('afterRustHaven', { missionId: s.missionId, phase: s.phase })
  await shot('IF013-20-100-after-rust-haven-click')
})

writeFileSync(OUT + 'observations-pass2.json', JSON.stringify(rec, null, 2))
await browser.close()
